import { redirect } from "next/navigation";
import { CapacityForm } from "@/components/capacity-form";
import { OrderActions } from "@/components/order-actions";
import { ProductionBriefForm } from "@/components/production-brief-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role,organization_id,organizations(name,kind)")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const role = profile.role as "buyer" | "factory" | "operator" | "admin";
  const isBuyer = role === "buyer" || role === "operator" || role === "admin";
  const isFactory = role === "factory";

  const [{ data: orders }, { data: capacity }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,title,product_category,quantity,target_unit_price,currency,required_delivery_date,status,assigned_factory_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("capacity_slots")
      .select("id,factory_id,starts_on,ends_on,product_category,available_units,reserved_units,status,confidence,source,updated_at")
      .gte("ends_on", new Date().toISOString().slice(0, 10))
      .order("starts_on", { ascending: true })
      .limit(100),
  ]);

  const organization = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">FactoryMesh Control Plane</span>
          <h1 className="workspace-title">{organization?.name ?? "Workspace"}</h1>
          <p className="muted">{profile.full_name ?? "Operator"} · {role}</p>
        </div>
        <form action="/auth/signout" method="post"><button className="secondary-button">Sign out</button></form>
      </header>

      <section className="workspace-stats">
        <article><span>Visible orders</span><strong>{orders?.length ?? 0}</strong></article>
        <article><span>Open capacity slots</span><strong>{capacity?.filter((slot) => slot.status !== "booked").length ?? 0}</strong></article>
        <article><span>Network mode</span><strong>{isFactory ? "Supply" : "Demand"}</strong></article>
      </section>

      {isBuyer && (
        <section className="workspace-panel">
          <div className="section-heading"><div><span className="eyebrow">Demand</span><h2>Create production brief</h2></div><span className="status">Buyer workflow</span></div>
          <ProductionBriefForm />
        </section>
      )}

      {isFactory && (
        <section className="workspace-panel">
          <div className="section-heading"><div><span className="eyebrow">Supply</span><h2>Publish production capacity</h2></div><span className="status">Factory workflow</span></div>
          <CapacityForm />
        </section>
      )}

      <section className="workspace-panel">
        <div className="section-heading"><div><span className="eyebrow">Orders</span><h2>{isFactory ? "Assigned production" : "Production pipeline"}</h2></div><span className="status">{orders?.length ?? 0} records</span></div>
        <div className="data-list">
          {(orders ?? []).length === 0 ? <p className="empty-state">No orders yet.</p> : (orders ?? []).map((order) => (
            <article className="data-row" key={order.id}>
              <div className="data-main"><strong>{order.title}</strong><span>{order.product_category} · {order.quantity.toLocaleString()} units</span></div>
              <div><span>Status</span><strong>{order.status.replaceAll("_", " ")}</strong></div>
              <div><span>Deadline</span><strong>{order.required_delivery_date}</strong></div>
              <div><span>Target</span><strong>{order.target_unit_price ? `${order.currency} ${Number(order.target_unit_price).toFixed(2)}` : "Open"}</strong></div>
              {isBuyer && !order.assigned_factory_id ? <OrderActions orderId={order.id} quantity={order.quantity} /> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="section-heading"><div><span className="eyebrow">Capacity map</span><h2>Executable production windows</h2></div><span className="status">Live DB data</span></div>
        <div className="data-list">
          {(capacity ?? []).length === 0 ? <p className="empty-state">No current capacity published.</p> : (capacity ?? []).map((slot) => (
            <article className="data-row compact" key={slot.id}>
              <div className="data-main"><strong>{slot.product_category}</strong><span>{slot.starts_on} → {slot.ends_on}</span></div>
              <div><span>Available</span><strong>{Math.max(0, slot.available_units - slot.reserved_units).toLocaleString()}</strong></div>
              <div><span>Status</span><strong>{slot.status}</strong></div>
              <div><span>Confidence</span><strong>{Number(slot.confidence).toFixed(0)}%</strong></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
