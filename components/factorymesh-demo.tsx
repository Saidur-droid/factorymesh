'use client';

import { useMemo, useState } from 'react';
import { routeOrder, type RoutingCandidate, type RoutingResult } from '@/lib/routing/engine';

type Persona = 'buyer' | 'factory' | 'operator';
type OrderStatus = 'draft' | 'matching' | 'reserved' | 'in_production' | 'qc' | 'shipped';

type DemoEvent = {
  id: number;
  actor: string;
  label: string;
  detail: string;
  time: string;
};

const factories: RoutingCandidate[] = [
  {
    factoryId: 'fac-dhaka-knit',
    factoryName: 'Dhaka Knitworks Ltd.',
    capacitySlotId: 'slot-dk-01',
    productCategories: ['Hoodies', 'Sweatshirts', 'T-Shirts'],
    certifications: ['WRAP', 'BSCI', 'OEKO-TEX'],
    availableUnits: 340000,
    slotEndsOn: '2026-10-24',
    indicativeCostMin: 7.35,
    indicativeCostMax: 7.85,
    onTimeRate: 96,
    defectRate: 0.8,
    capacityConfidence: 95,
  },
  {
    factoryId: 'fac-metro-apparel',
    factoryName: 'Metro Apparel Industries',
    capacitySlotId: 'slot-ma-02',
    productCategories: ['Hoodies', 'T-Shirts'],
    certifications: ['BSCI', 'OEKO-TEX'],
    availableUnits: 315000,
    slotEndsOn: '2026-10-29',
    indicativeCostMin: 7.55,
    indicativeCostMax: 8.05,
    onTimeRate: 92,
    defectRate: 1.1,
    capacityConfidence: 91,
  },
  {
    factoryId: 'fac-green-stitch',
    factoryName: 'Green Stitch Manufacturing',
    capacitySlotId: 'slot-gs-05',
    productCategories: ['Hoodies', 'Sweatshirts'],
    certifications: ['WRAP', 'BSCI', 'OEKO-TEX', 'GRS'],
    availableUnits: 305000,
    slotEndsOn: '2026-11-01',
    indicativeCostMin: 7.8,
    indicativeCostMax: 8.35,
    onTimeRate: 97,
    defectRate: 0.6,
    capacityConfidence: 88,
  },
  {
    factoryId: 'fac-river-denim',
    factoryName: 'River Denim & Garments',
    capacitySlotId: 'slot-rd-03',
    productCategories: ['Jeans', 'Jackets'],
    certifications: ['BSCI'],
    availableUnits: 500000,
    slotEndsOn: '2026-10-20',
    indicativeCostMin: 9.1,
    indicativeCostMax: 11.4,
    onTimeRate: 90,
    defectRate: 1.4,
    capacityConfidence: 93,
  },
];

const initialEvents: DemoEvent[] = [
  { id: 1, actor: 'FactoryMesh', label: 'Network ready', detail: '4 verified factories · 1.46M units visible capacity', time: '09:00' },
  { id: 2, actor: 'Dhaka Knitworks', label: 'Capacity synced', detail: '340,000 hoodie units available through Oct 24', time: '09:12' },
];

const eventButtonSteps = [
  { label: 'Start production', status: 'in_production' as const, detail: 'Cutting and sewing started · line A7/A8 allocated' },
  { label: 'Record 35% complete', status: 'in_production' as const, detail: '105,000 / 300,000 units completed' },
  { label: 'QC passed', status: 'qc' as const, detail: 'Inline + final QC passed · AQL 1.5' },
  { label: 'Dispatch shipment', status: 'shipped' as const, detail: 'Shipment dispatched · Chattogram Port handoff created' },
];

const statusCopy: Record<OrderStatus, string> = {
  draft: 'Brief ready',
  matching: 'Routing capacity',
  reserved: 'Capacity reserved',
  in_production: 'In production',
  qc: 'QC passed',
  shipped: 'Shipped',
};

export function FactoryMeshDemo() {
  const [persona, setPersona] = useState<Persona>('buyer');
  const [quantity, setQuantity] = useState(300000);
  const [targetPrice, setTargetPrice] = useState(7.8);
  const [deadline, setDeadline] = useState('2026-11-05');
  const [requirements, setRequirements] = useState('WRAP, BSCI, OEKO-TEX');
  const [status, setStatus] = useState<OrderStatus>('draft');
  const [matches, setMatches] = useState<RoutingResult[]>([]);
  const [selected, setSelected] = useState<RoutingResult | null>(null);
  const [productionStep, setProductionStep] = useState(0);
  const [events, setEvents] = useState<DemoEvent[]>(initialEvents);
  const [fileName, setFileName] = useState('northstar-fw26-hoodie-techpack.pdf');

  const availableCapacity = useMemo(
    () => factories.filter((f) => f.productCategories.includes('Hoodies')).reduce((sum, f) => sum + f.availableUnits, 0),
    [],
  );

  function pushEvent(actor: string, label: string, detail: string) {
    const minutes = 14 + events.length * 3;
    setEvents((current) => [
      ...current,
      { id: Date.now(), actor, label, detail, time: `09:${String(minutes).padStart(2, '0')}` },
    ]);
  }

  function findCapacity() {
    setStatus('matching');
    const routed = routeOrder(
      {
        productCategory: 'Hoodies',
        quantity,
        targetUnitPrice: targetPrice,
        requiredDeliveryDate: deadline,
        complianceRequirements: requirements.split(',').map((v) => v.trim()).filter(Boolean),
      },
      factories,
    );
    setMatches(routed);
    setSelected(null);
    pushEvent('Northstar Commerce', 'Production brief submitted', `${quantity.toLocaleString()} hoodies · target $${targetPrice.toFixed(2)} · ${deadline}`);
    pushEvent('FactoryMesh', 'Routing completed', `${routed.length} executable single-factory options found`);
  }

  function reserveFactory(match: RoutingResult) {
    setSelected(match);
    setStatus('reserved');
    pushEvent('Northstar Commerce', 'Capacity reserved', `${match.factoryName} · ${quantity.toLocaleString()} units · slot ${match.slotEndsOn}`);
    setPersona('factory');
  }

  function advanceProduction() {
    const step = eventButtonSteps[productionStep];
    if (!step || !selected) return;
    setStatus(step.status);
    pushEvent(selected.factoryName, step.label, step.detail);
    setProductionStep((value) => value + 1);
  }

  function resetDemo() {
    setPersona('buyer');
    setQuantity(300000);
    setTargetPrice(7.8);
    setDeadline('2026-11-05');
    setRequirements('WRAP, BSCI, OEKO-TEX');
    setStatus('draft');
    setMatches([]);
    setSelected(null);
    setProductionStep(0);
    setEvents(initialEvents);
    setFileName('northstar-fw26-hoodie-techpack.pdf');
  }

  return (
    <main className="demo-shell">
      <header className="demo-topbar">
        <div className="demo-brand"><span className="demo-mark">FM</span><div><strong>FactoryMesh</strong><small>Interactive production demo</small></div></div>
        <div className="demo-personas" aria-label="Demo persona switcher">
          {(['buyer', 'factory', 'operator'] as Persona[]).map((item) => (
            <button key={item} className={persona === item ? 'active' : ''} onClick={() => setPersona(item)}>{item}</button>
          ))}
        </div>
        <button className="demo-reset" onClick={resetDemo}>Reset demo</button>
      </header>

      <section className="demo-hero-strip">
        <div><span>LIVE SCENARIO</span><strong>Northstar Commerce · FW26 Hoodie Program</strong></div>
        <div className="demo-status"><i className={`status-dot ${status}`} />{statusCopy[status]}</div>
      </section>

      {persona === 'buyer' && (
        <div className="demo-layout">
          <section className="demo-main-card">
            <div className="demo-card-head"><div><span className="eyebrow">Buyer workspace</span><h1>Book production, not supplier calls.</h1></div><span className="demo-chip">Northstar Commerce · US</span></div>
            <div className="demo-form-grid">
              <label>Product<input value="Premium heavyweight hoodie" readOnly /></label>
              <label>Quantity<input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label>
              <label>Target unit price<input type="number" step="0.05" value={targetPrice} onChange={(e) => setTargetPrice(Number(e.target.value))} /></label>
              <label>Required delivery<input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
              <label className="wide">Compliance<input value={requirements} onChange={(e) => setRequirements(e.target.value)} /></label>
              <label className="wide">Tech pack<div className="demo-file"><span>{fileName}</span><button type="button" onClick={() => setFileName(fileName ? '' : 'northstar-fw26-hoodie-techpack.pdf')}>{fileName ? 'Remove' : 'Attach demo file'}</button></div></label>
            </div>
            <button className="demo-primary" onClick={findCapacity}>Find executable capacity</button>
          </section>

          <aside className="demo-side-card">
            <span className="eyebrow">Network snapshot</span>
            <div className="demo-big-metric"><strong>{availableCapacity.toLocaleString()}</strong><span>hoodie units visible</span></div>
            <dl className="demo-mini-stats"><div><dt>Factories</dt><dd>4 verified</dd></div><div><dt>Country</dt><dd>Bangladesh</dd></div><div><dt>Routing mode</dt><dd>Deterministic</dd></div></dl>
          </aside>

          {matches.length > 0 && (
            <section className="demo-results">
              <div className="demo-card-head"><div><span className="eyebrow">Routing result</span><h2>{matches.length} executable options</h2></div><span className="demo-chip">Ranked by capacity · delivery · quality · cost · compliance</span></div>
              <div className="demo-match-list">
                {matches.map((match, index) => (
                  <article className="demo-match" key={match.factoryId}>
                    <div className="rank">0{index + 1}</div>
                    <div className="factory"><strong>{match.factoryName}</strong><span>{match.availableUnits.toLocaleString()} units · completes {match.slotEndsOn}</span></div>
                    <div className="score"><strong>{match.score}</strong><span>routing score</span></div>
                    <div className="price"><strong>${match.indicativeCostMin?.toFixed(2)}–${match.indicativeCostMax?.toFixed(2)}</strong><span>indicative / pc</span></div>
                    <div className="signals"><span>{match.onTimeRate}% on-time</span><span>{match.defectRate}% defect</span><span>{match.capacityConfidence}% capacity confidence</span></div>
                    <button onClick={() => reserveFactory(match)}>Reserve capacity</button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {persona === 'factory' && (
        <div className="demo-layout">
          <section className="demo-main-card">
            <div className="demo-card-head"><div><span className="eyebrow">Factory workspace</span><h1>{selected ? 'A booked order is ready to execute.' : 'Your capacity is discoverable.'}</h1></div><span className="demo-chip">Dhaka Knitworks · Bangladesh</span></div>
            {selected ? (
              <>
                <div className="demo-order-summary">
                  <div><span>Buyer</span><strong>Northstar Commerce</strong></div><div><span>Program</span><strong>FW26 Hoodie</strong></div><div><span>Quantity</span><strong>{quantity.toLocaleString()}</strong></div><div><span>Delivery</span><strong>{deadline}</strong></div>
                </div>
                <div className="demo-progress"><div><span style={{ width: `${Math.min(100, productionStep * 30)}%` }} /></div><small>{productionStep === 0 ? 'Capacity reserved — start the production run.' : productionStep >= eventButtonSteps.length ? 'Shipment dispatched — demo order complete.' : `${productionStep} production milestone${productionStep > 1 ? 's' : ''} recorded.`}</small></div>
                {productionStep < eventButtonSteps.length ? <button className="demo-primary" onClick={advanceProduction}>{eventButtonSteps[productionStep].label}</button> : <button className="demo-primary complete" disabled>Order execution complete</button>}
              </>
            ) : (
              <div className="demo-empty"><strong>340,000 hoodie units</strong><span>are published for the current production window.</span><button onClick={() => setPersona('buyer')}>Open buyer demo and route an order</button></div>
            )}
          </section>
          <aside className="demo-side-card"><span className="eyebrow">Factory trust signals</span><div className="demo-big-metric"><strong>96%</strong><span>historical on-time delivery</span></div><dl className="demo-mini-stats"><div><dt>Defect rate</dt><dd>0.8%</dd></div><div><dt>Certifications</dt><dd>WRAP · BSCI · OEKO-TEX</dd></div><div><dt>Capacity confidence</dt><dd>95%</dd></div></dl></aside>
        </div>
      )}

      {persona === 'operator' && (
        <div className="demo-layout">
          <section className="demo-main-card operator-card">
            <div className="demo-card-head"><div><span className="eyebrow">Network control plane</span><h1>See the manufacturing network as one system.</h1></div><span className="demo-chip">FactoryMesh Operations</span></div>
            <div className="operator-grid"><article><span>Visible capacity</span><strong>1.46M</strong><small>units across active slots</small></article><article><span>Hoodie capacity</span><strong>960K</strong><small>3 executable factories</small></article><article><span>Active order</span><strong>{selected ? '$2.34M' : '$0'}</strong><small>{selected ? '300K units reserved' : 'No reservation yet'}</small></article><article><span>Network confidence</span><strong>91.8</strong><small>weighted capacity confidence</small></article></div>
          </section>
          <aside className="demo-side-card"><span className="eyebrow">Order state</span><div className="demo-big-metric"><strong>{statusCopy[status]}</strong><span>{selected?.factoryName ?? 'Waiting for buyer routing'}</span></div><button className="demo-secondary" onClick={() => setPersona(selected ? 'factory' : 'buyer')}>{selected ? 'Open factory execution' : 'Open buyer workflow'}</button></aside>
        </div>
      )}

      <section className="demo-timeline">
        <div className="demo-card-head"><div><span className="eyebrow">Shared audit timeline</span><h2>One source of truth for every participant.</h2></div><span className="demo-chip">{events.length} events</span></div>
        <div className="timeline-list">{[...events].reverse().map((event) => <article key={event.id}><time>{event.time}</time><div><strong>{event.label}</strong><span>{event.actor}</span></div><p>{event.detail}</p></article>)}</div>
      </section>

      <footer className="demo-footer"><div><strong>This is a safe interactive demo.</strong><span>It uses the same routing logic as the production code but no real commercial order is created.</span></div><a href="/">Back to FactoryMesh</a></footer>
    </main>
  );
}
