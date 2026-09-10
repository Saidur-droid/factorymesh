const capacity = [
  { factory: "KnitWorks BD", category: "Hoodies", window: "Sep 21–Oct 18", units: "180k", confidence: "94%" },
  { factory: "Delta Apparel", category: "T-Shirts", window: "Sep 16–Oct 06", units: "240k", confidence: "91%" },
  { factory: "Metro Stitch", category: "Sweatshirts", window: "Oct 02–Oct 28", units: "120k", confidence: "88%" },
];

export default function Home() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <span className="eyebrow">FactoryMesh</span>
          <h1>Programmable manufacturing capacity for global brands.</h1>
          <p>
            Route a production brief into verified factory capacity, quotes,
            reservations and execution tracking — starting with Bangladesh RMG.
          </p>
          <div className="actions">
            <button>Create production brief</button>
            <a href="#capacity">View live capacity</a>
          </div>
        </div>
        <div className="brief-card">
          <span>Example request</span>
          <strong>300,000 hoodies</strong>
          <dl>
            <div><dt>Target</dt><dd>$8.00 / pc</dd></div>
            <div><dt>Deadline</dt><dd>55 days</dd></div>
            <div><dt>Routing</dt><dd>Bangladesh</dd></div>
          </dl>
          <div className="route-result">3 executable capacity options found</div>
        </div>
      </section>

      <section className="stats">
        <article><span>Network stage</span><strong>Pilot</strong></article>
        <article><span>Primary wedge</span><strong>Live capacity</strong></article>
        <article><span>Launch market</span><strong>Bangladesh RMG</strong></article>
      </section>

      <section id="capacity" className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Live Capacity Map</span>
            <h2>Bookable production windows</h2>
          </div>
          <span className="status">Demo data</span>
        </div>
        <div className="capacity-list">
          {capacity.map((slot) => (
            <article key={slot.factory} className="capacity-row">
              <div><strong>{slot.factory}</strong><span>{slot.category}</span></div>
              <div><span>Window</span><strong>{slot.window}</strong></div>
              <div><span>Available</span><strong>{slot.units}</strong></div>
              <div><span>Confidence</span><strong>{slot.confidence}</strong></div>
              <button>Inspect</button>
            </article>
          ))}
        </div>
      </section>

      <section className="how">
        <span className="eyebrow">Core loop</span>
        <h2>From demand to production — without browsing a supplier directory.</h2>
        <div className="steps">
          {[
            ["01", "Submit", "Tech pack, quantity, target cost and deadline."],
            ["02", "Route", "Filter hard constraints and rank executable capacity."],
            ["03", "Reserve", "Confirm factory, price and production slot."],
            ["04", "Execute", "Track milestones, QC, exceptions and shipment."],
          ].map(([n, title, copy]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
