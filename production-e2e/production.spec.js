const { test, expect } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('node:crypto');

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'https://factorymesh.vercel.app';
const SUPABASE_URL = process.env.SUPABASE_TEST_URL;
const SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY;
const PUBLISHABLE_KEY = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !PUBLISHABLE_KEY) {
  throw new Error('Production E2E requires Supabase test credentials');
}

const runId = Date.now().toString(36) + '-' + crypto.randomBytes(3).toString('hex');
const category = 'E2E-Hoodies-' + runId.slice(-6);
const deliveryDate = isoDaysFromNow(45);
const startsOn = isoDaysFromNow(2);
const endsOn = isoDaysFromNow(30);
const passwordBase = 'Fm!' + crypto.randomUUID() + '9aA';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const users = {
  buyerA: { key: 'buyer-a', role: 'buyer', org: '[E2E TEST] Buyer A ' + runId },
  buyerB: { key: 'buyer-b', role: 'buyer', org: '[E2E TEST] Buyer B ' + runId },
  factoryA: { key: 'factory-a', role: 'factory', org: '[E2E TEST] Factory A ' + runId },
  factoryB: { key: 'factory-b', role: 'factory', org: '[E2E TEST] Factory B ' + runId },
  operator: { key: 'operator', role: 'operator', org: '[E2E TEST] Operator ' + runId },
};

function isoDaysFromNow(days) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function appUrl(path) {
  return new URL(path, BASE_URL).toString();
}

async function createConfirmedUser(key) {
  const email = 'factorymesh.e2e.' + runId + '.' + key + '@example.com';
  const password = passwordBase + '-' + key;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { factorymesh_e2e_run: runId },
  });
  if (error || !data.user) throw error || new Error('Unable to create test user');
  return { id: data.user.id, email, password };
}

async function loginAndOnboard(browser, identity, role, org) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto('/login');
  await page.getByLabel('Email').fill(identity.email);
  await page.getByLabel('Password').fill(identity.password);
  await page.locator('form.auth-form button[type="submit"]').click();
  // Every production verification user is created fresh, so the authenticated
  // dashboard must settle on onboarding before a workspace exists.
  await page.waitForURL((url) => url.pathname === '/onboarding', { timeout: 30_000 });

  const onboarding = await page.request.post(appUrl('/api/onboarding'), {
    data: {
      fullName: '[E2E TEST] ' + role + ' ' + runId,
      organizationName: org,
      role,
      countryCode: 'BD',
      city: 'Dhaka',
      productCategories: role === 'factory' ? [category] : [],
    },
  });
  const onboardingBody = await getJson(onboarding);
  expect(onboarding.status(), JSON.stringify(onboardingBody)).toBe(201);
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: org })).toBeVisible({ timeout: 30_000 });
  return { context, page };
}

async function loginExistingUser(browser, identity, expectedOrg) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  await page.goto('/login');
  await page.getByLabel('Email').fill(identity.email);
  await page.getByLabel('Password').fill(identity.password);
  await page.locator('form.auth-form button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: expectedOrg })).toBeVisible({ timeout: 30_000 });

  return { context, page };
}

async function getJson(response) {
  const body = await response.text();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Expected JSON but got: ' + body.slice(0, 400));
  }
}

async function api(page, path, options = {}) {
  return page.request.fetch(appUrl(path), options);
}

async function createOrder(page, title, quantity) {
  const response = await api(page, '/api/orders', {
    method: 'POST',
    data: {
      title,
      productCategory: category,
      quantity,
      currency: 'USD',
      requiredDeliveryDate: deliveryDate,
      shipToCountryCode: 'US',
      complianceRequirements: [],
    },
  });
  const created = await getJson(response);
  expect(response.status(), JSON.stringify(created)).toBe(201);

  const listResponse = await api(page, '/api/orders');
  expect(listResponse.status()).toBe(200);
  const body = await getJson(listResponse);
  const order = body.orders.find((item) => item.id === created.order.id);
  expect(order).toBeTruthy();
  return order;
}

async function cleanupFixtures() {
  const ids = Object.values(users).map((u) => u.identity && u.identity.id).filter(Boolean);
  const cleanupErrors = [];

  try {
    const { data: profiles, error: profileReadError } = ids.length
      ? await admin.from('profiles').select('id,organization_id').in('id', ids)
      : { data: [], error: null };
    if (profileReadError) cleanupErrors.push('profile read: ' + profileReadError.message);

    const orgIds = (profiles || []).map((p) => p.organization_id).filter(Boolean);
    const { data: orders, error: orderReadError } = orgIds.length
      ? await admin.from('orders').select('id,tech_pack_path,buyer_organization_id').in('buyer_organization_id', orgIds)
      : { data: [], error: null };
    if (orderReadError) cleanupErrors.push('order read: ' + orderReadError.message);

    const orderIds = (orders || []).map((o) => o.id);
    const techPaths = (orders || []).map((o) => o.tech_pack_path).filter(Boolean);

    if (techPaths.length) {
      const { error } = await admin.storage.from('tech-packs').remove(techPaths);
      if (error) cleanupErrors.push('storage cleanup: ' + error.message);
    }

    if (orderIds.length) {
      for (const [table, column] of [
        ['production_events', 'order_id'],
        ['order_matches', 'order_id'],
      ]) {
        const { error } = await admin.from(table).delete().in(column, orderIds);
        if (error) cleanupErrors.push(table + ': ' + error.message);
      }
    }

    if (ids.length) {
      const { error } = await admin.from('audit_logs').delete().in('actor_user_id', ids);
      if (error) cleanupErrors.push('audit_logs: ' + error.message);
    }

    if (orderIds.length) {
      const { error } = await admin.from('orders').delete().in('id', orderIds);
      if (error) cleanupErrors.push('orders: ' + error.message);
    }

    if (orgIds.length) {
      const { data: factories, error: factoryReadError } = await admin
        .from('factories')
        .select('id')
        .in('organization_id', orgIds);
      if (factoryReadError) cleanupErrors.push('factory read: ' + factoryReadError.message);

      const factoryIds = (factories || []).map((f) => f.id);
      if (factoryIds.length) {
        const { error: capacityError } = await admin.from('capacity_slots').delete().in('factory_id', factoryIds);
        if (capacityError) cleanupErrors.push('capacity_slots: ' + capacityError.message);
      }

      const { error: factoryDeleteError } = await admin.from('factories').delete().in('organization_id', orgIds);
      if (factoryDeleteError) cleanupErrors.push('factories: ' + factoryDeleteError.message);
    }

    if (ids.length) {
      const { error } = await admin.from('profiles').delete().in('id', ids);
      if (error) cleanupErrors.push('profiles: ' + error.message);
    }

    if (orgIds.length) {
      const { error } = await admin.from('organizations').delete().in('id', orgIds);
      if (error) cleanupErrors.push('organizations: ' + error.message);
    }
  } finally {
    for (const user of Object.values(users)) {
      if (user.identity && user.identity.id) {
        const { error } = await admin.auth.admin.deleteUser(user.identity.id);
        if (error) cleanupErrors.push('auth user: ' + error.message);
      }
    }
  }

  if (cleanupErrors.length) {
    throw new Error('Fixture cleanup failed: ' + cleanupErrors.join(' | '));
  }
}

test.beforeAll(async () => {
  for (const user of Object.values(users)) {
    user.identity = await createConfirmedUser(user.key);
  }

  const { data: operatorOrg, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: users.operator.org,
      slug: 'e2e-operator-' + runId,
      kind: 'operator',
      country_code: 'BD',
    })
    .select('id')
    .single();
  if (orgError || !operatorOrg) throw orgError || new Error('Unable to create operator organization');

  const { error: profileError } = await admin.from('profiles').insert({
    id: users.operator.identity.id,
    full_name: '[E2E TEST] Operator ' + runId,
    role: 'operator',
    organization_id: operatorOrg.id,
  });
  if (profileError) throw profileError;
});

test.afterAll(async () => {
  await cleanupFixtures();
});

test('real production buyer/factory workflow, isolation, reservation atomicity, and tech-pack security', async ({ browser }) => {
  const buyerA = await loginAndOnboard(browser, users.buyerA.identity, 'buyer', users.buyerA.org);
  const buyerB = await loginAndOnboard(browser, users.buyerB.identity, 'buyer', users.buyerB.org);
  const factoryA = await loginAndOnboard(browser, users.factoryA.identity, 'factory', users.factoryA.org);
  const factoryB = await loginAndOnboard(browser, users.factoryB.identity, 'factory', users.factoryB.org);
  const operator = await loginExistingUser(browser, users.operator.identity, users.operator.org);

  try {
    const createCapacityResponse = await api(factoryA.page, '/api/capacity', {
      method: 'POST',
      data: {
        startsOn,
        endsOn,
        lineType: 'E2E knit line',
        productCategory: category,
        availableUnits: 100,
      },
    });
    const createdCapacity = await getJson(createCapacityResponse);
    expect(createCapacityResponse.status(), JSON.stringify(createdCapacity)).toBe(201);

    const factoryACapacityResponse = await api(factoryA.page, '/api/capacity');
    expect(factoryACapacityResponse.status()).toBe(200);
    const factoryACapacityBody = await getJson(factoryACapacityResponse);
    const slot = factoryACapacityBody.capacity.find((item) => item.id === createdCapacity.capacity.id);
    expect(slot).toBeTruthy();
    expect(slot.available_units).toBe(100);
    expect(slot.reserved_units).toBe(0);

    const verifyFactoryResponse = await api(
      operator.page,
      '/api/operator/factories/' + slot.factory_id + '/verification',
      { method: 'POST', data: { verified: true } },
    );
    expect(verifyFactoryResponse.status()).toBe(200);

    const verifyCapacityResponse = await api(
      operator.page,
      '/api/operator/capacity/' + slot.id + '/verification',
      { method: 'POST', data: { decision: 'verified' } },
    );
    expect(verifyCapacityResponse.status()).toBe(200);

    const factoryBCapacityResponse = await api(factoryB.page, '/api/capacity');
    expect(factoryBCapacityResponse.status()).toBe(200);
    const factoryBCapacityBody = await getJson(factoryBCapacityResponse);
    expect(factoryBCapacityBody.capacity.some((item) => item.id === slot.id)).toBe(false);

    const buyerACapacityResponse = await api(buyerA.page, '/api/capacity');
    expect(buyerACapacityResponse.status()).toBe(200);
    const buyerACapacityBody = await getJson(buyerACapacityResponse);
    expect(buyerACapacityBody.capacity.some((item) => item.id === slot.id)).toBe(true);

    const orderATitle = '[E2E TEST] Buyer A order ' + runId;
    const orderBTitle = '[E2E TEST] Buyer B order ' + runId;
    const orderA = await createOrder(buyerA.page, orderATitle, 80);
    const orderB = await createOrder(buyerB.page, orderBTitle, 80);

    const buyerAOrders = await getJson(await api(buyerA.page, '/api/orders'));
    const buyerBOrders = await getJson(await api(buyerB.page, '/api/orders'));
    expect(buyerAOrders.orders.some((item) => item.id === orderA.id)).toBe(true);
    expect(buyerAOrders.orders.some((item) => item.id === orderB.id)).toBe(false);
    expect(buyerBOrders.orders.some((item) => item.id === orderB.id)).toBe(true);
    expect(buyerBOrders.orders.some((item) => item.id === orderA.id)).toBe(false);

    const crossRoute = await api(buyerB.page, '/api/orders/' + orderA.id + '/route', { method: 'POST' });
    expect([403, 404]).toContain(crossRoute.status());

    const invalidMime = await api(buyerA.page, '/api/uploads/tech-pack', {
      method: 'POST',
      data: { orderId: orderA.id, fileName: 'bad.txt', mimeType: 'text/plain', size: 10 },
    });
    expect(invalidMime.status()).toBe(400);

    const oversized = await api(buyerA.page, '/api/uploads/tech-pack', {
      method: 'POST',
      data: { orderId: orderA.id, fileName: 'huge.pdf', mimeType: 'application/pdf', size: 25 * 1024 * 1024 + 1 },
    });
    expect(oversized.status()).toBe(400);

    const techPackBytes = Buffer.from('%PDF-1.4\n% FactoryMesh production E2E test\n');
    const authorizeUpload = await api(buyerA.page, '/api/uploads/tech-pack', {
      method: 'POST',
      data: {
        orderId: orderA.id,
        fileName: 'factorymesh-e2e-' + runId + '.pdf',
        mimeType: 'application/pdf',
        size: techPackBytes.length,
      },
    });
    const signedUpload = await getJson(authorizeUpload);
    expect(authorizeUpload.status(), JSON.stringify(signedUpload)).toBe(200);

    const storageClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: uploadError } = await storageClient.storage
      .from('tech-packs')
      .uploadToSignedUrl(signedUpload.path, signedUpload.token, techPackBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });
    expect(uploadError).toBeNull();

    const confirmUpload = await api(buyerA.page, '/api/uploads/tech-pack/confirm', {
      method: 'POST',
      data: { orderId: orderA.id, path: signedUpload.path },
    });
    const confirmBody = await getJson(confirmUpload);
    expect(confirmUpload.status(), JSON.stringify(confirmBody)).toBe(200);

    const techPackResponse = await api(buyerA.page, '/api/orders/' + orderA.id + '/tech-pack');
    expect(techPackResponse.status()).toBe(200);
    const techPack = await getJson(techPackResponse);
    expect(techPack.expiresIn).toBe(300);
    const signedDownload = await buyerA.page.request.get(techPack.url);
    expect(signedDownload.status()).toBe(200);

    const crossTechPack = await api(buyerB.page, '/api/orders/' + orderA.id + '/tech-pack');
    expect(crossTechPack.status()).toBe(404);

    const crossUpload = await api(buyerB.page, '/api/uploads/tech-pack', {
      method: 'POST',
      data: { orderId: orderA.id, fileName: 'cross.pdf', mimeType: 'application/pdf', size: 32 },
    });
    expect([403, 404]).toContain(crossUpload.status());

    const routedAResponse = await api(buyerA.page, '/api/orders/' + orderA.id + '/route', { method: 'POST' });
    const routedBResponse = await api(buyerB.page, '/api/orders/' + orderB.id + '/route', { method: 'POST' });
    expect(routedAResponse.status()).toBe(200);
    expect(routedBResponse.status()).toBe(200);
    const routedA = await getJson(routedAResponse);
    const routedB = await getJson(routedBResponse);
    const matchA = routedA.matches.find((item) => item.capacitySlotId === slot.id);
    const matchB = routedB.matches.find((item) => item.capacitySlotId === slot.id);
    expect(matchA && matchA.id).toBeTruthy();
    expect(matchB && matchB.id).toBeTruthy();

    for (const match of [matchA, matchB]) {
      const response = await api(factoryA.page, '/api/matches/' + match.id + '/respond', {
        method: 'POST',
        data: {
          decision: 'accept',
          quotedUnitPrice: 7.5,
          quotedCurrency: 'USD',
          promisedShipDate: isoDaysFromNow(35),
          note: 'Production E2E commercial confirmation',
        },
      });
      expect(response.status()).toBe(200);
    }

    const [reserveA, reserveB] = await Promise.all([
      api(buyerA.page, '/api/matches/' + matchA.id + '/reserve', {
        method: 'POST',
        data: { orderId: orderA.id, units: 80 },
      }),
      api(buyerB.page, '/api/matches/' + matchB.id + '/reserve', {
        method: 'POST',
        data: { orderId: orderB.id, units: 80 },
      }),
    ]);

    const reservationStatuses = [reserveA.status(), reserveB.status()].sort();
    expect(reservationStatuses).toEqual([201, 409]);

    const postReservationCapacity = await getJson(await api(buyerA.page, '/api/capacity'));
    const reservedSlot = postReservationCapacity.capacity.find((item) => item.id === slot.id);
    expect(reservedSlot.reserved_units).toBe(80);
    expect(reservedSlot.available_units - reservedSlot.reserved_units).toBe(20);

    const winner = reserveA.status() === 201
      ? { page: buyerA.page, order: orderA, title: orderATitle }
      : { page: buyerB.page, order: orderB, title: orderBTitle };
    const loser = reserveA.status() === 201
      ? { order: orderB, title: orderBTitle }
      : { order: orderA, title: orderATitle };

    const factoryAOrdersResponse = await api(factoryA.page, '/api/orders');
    expect(factoryAOrdersResponse.status()).toBe(200);
    const factoryAOrders = await getJson(factoryAOrdersResponse);
    expect(factoryAOrders.orders.some((item) => item.id === winner.order.id)).toBe(true);
    expect(factoryAOrders.orders.some((item) => item.id === loser.order.id)).toBe(false);

    const factoryBOrdersResponse = await api(factoryB.page, '/api/orders');
    expect(factoryBOrdersResponse.status()).toBe(200);
    const factoryBOrders = await getJson(factoryBOrdersResponse);
    expect(factoryBOrders.orders.some((item) => item.id === winner.order.id)).toBe(false);

    const unauthorizedEvent = await api(factoryB.page, '/api/production-events', {
      method: 'POST',
      data: { orderId: winner.order.id, eventType: 'production.started', payload: {} },
    });
    expect(unauthorizedEvent.ok()).toBe(false);

    for (const eventType of ['production.started', 'qc.passed', 'shipment.dispatched']) {
      const response = await api(factoryA.page, '/api/production-events', {
        method: 'POST',
        data: { orderId: winner.order.id, eventType, payload: { source: 'production-e2e' } },
      });
      expect(response.status()).toBe(201);
    }

    const outcomeResponse = await api(
      operator.page,
      '/api/operator/orders/' + winner.order.id + '/outcome',
      {
        method: 'POST',
        data: {
          actualShipDate: deliveryDate,
          defectRate: 1.25,
          realizedUnitPrice: 7.5,
          currency: 'USD',
          notes: 'Production E2E verified outcome',
        },
      },
    );
    expect(outcomeResponse.status()).toBe(200);
    const outcomeBody = await getJson(outcomeResponse);
    expect(outcomeBody.metrics.sampleSize).toBeGreaterThanOrEqual(1);

    const eventsResponse = await api(winner.page, '/api/production-events?orderId=' + winner.order.id);
    expect(eventsResponse.status()).toBe(200);
    const eventsBody = await getJson(eventsResponse);
    const eventTypes = eventsBody.events.map((event) => event.event_type);
    expect(eventTypes).toContain('production.started');
    expect(eventTypes).toContain('qc.passed');
    expect(eventTypes).toContain('shipment.dispatched');

    const directBuyer = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await directBuyer.auth.signInWithPassword({
      email: users.buyerA.identity.email,
      password: users.buyerA.identity.password,
    });
    expect(signInError).toBeNull();

    const { error: directOrderMutationError } = await directBuyer
      .from('orders')
      .update({ title: '[E2E TEST] forbidden browser mutation' })
      .eq('id', orderA.id);
    expect(directOrderMutationError).toBeTruthy();

    const directFactory = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: factorySignInError } = await directFactory.auth.signInWithPassword({
      email: users.factoryA.identity.email,
      password: users.factoryA.identity.password,
    });
    expect(factorySignInError).toBeNull();

    const { error: directCapacityMutationError } = await directFactory
      .from('capacity_slots')
      .update({ confidence: 99 })
      .eq('id', slot.id);
    expect(directCapacityMutationError).toBeTruthy();
  } finally {
    await Promise.allSettled([
      buyerA.context.close(),
      buyerB.context.close(),
      factoryA.context.close(),
      factoryB.context.close(),
      operator.context.close(),
    ]);
  }
});
