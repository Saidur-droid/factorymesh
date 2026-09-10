import { expect, test } from '@playwright/test';

test('buyer routes, reserves, factory executes, operator observes', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByText('Northstar Commerce · FW26 Hoodie Program')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find executable capacity' })).toBeVisible();

  await page.getByRole('button', { name: 'Find executable capacity' }).click();
  await expect(page.getByText('3 executable options')).toBeVisible();

  const reserveButtons = page.getByRole('button', { name: 'Reserve capacity' });
  await expect(reserveButtons.first()).toBeVisible();
  await reserveButtons.first().click();

  await expect(page.getByText('A booked order is ready to execute.')).toBeVisible();
  await page.getByRole('button', { name: 'Start production' }).click();
  await page.getByRole('button', { name: 'Record 35% complete' }).click();
  await page.getByRole('button', { name: 'QC passed' }).click();
  await page.getByRole('button', { name: 'Dispatch shipment' }).click();

  await expect(page.getByRole('button', { name: 'Order execution complete' })).toBeVisible();
  await expect(page.getByText('Shipment dispatched — demo order complete.')).toBeVisible();

  await page.getByRole('button', { name: 'operator' }).click();
  await expect(page.getByText('See the manufacturing network as one system.')).toBeVisible();
  await expect(page.getByText('Shipped')).toBeVisible();

  await expect(page.getByText('Capacity reserved')).toBeVisible();
  await expect(page.getByText('Dispatch shipment')).toBeVisible();
});
