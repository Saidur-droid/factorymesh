import { redirect } from "next/navigation";
import { CapacityForm } from "@/components/capacity-form";
import { FactoryCommercialResponse } from "@/components/factory-commercial-response";
import { OperatorVerificationPanel } from "@/components/operator-verification-panel";
import { OrderActions } from "@/components/order-actions";
import { OutcomeMemoryForm } from "@/components/outcome-memory-form";
import { ProductionBriefForm } from "@/components/production-brief-form";
import { ProductionEventForm } from "@/components/production-event-form";
import { TechPackUploader } from "@/components/tech-pack-uploader";
import {
  evaluateCapacityFreshness,
} from "@/lib/capacity/freshness";
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
  const isOperator = role === "operator" || role === "admin";

  const { data: ownFactory } = isFactory && profile.organization_id
    ? await supabase
        .from("factories")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .maybeSingle()
    : { data: null };

  const [
    { data: orders },
    { data: capacity },
    { data: factories },
    { data: factoryMatches },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id,title,product_category,quantity,target_unit_price,currency,required_delivery_date,status,assigned_factory_id,tech_pack_path,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("capacity_slots")
      .select("id,factory_id,starts_on,ends_on,product_category,available_units,reserved_units,status,confidence,source,last_verified_at,updated_at")
      .gte("ends_on", new Date().toISOString().slice(0, 10))
      .order("starts_on", { ascending: true })
      .limit(100),
    isOperator
      ? supabase
          .from("factories")
          .select("id,legal_name,verified,verified_at,city,country_code")
          .order("legal_name", { ascending: true })
          .limit(200)
      : Promise.resolve({ data: [] as any[] }),
    isFactory && ownFactory?.id
      ? supabase
          .from("order_matches")
          .select("id,order_id,status,factory_response,quoted_unit_price,quoted_currency,promised_ship_date,factory_note,responded_at")
          .eq("factory_id", ownFactory.id)
          .in("status", ["suggested", "shortlisted", "reserved"])
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const organization = Array.isArray(profile.organizations)
    ? profile.organizations[0]
    : profile.organizations;

  const matchesByOrder = new Map(
    (factoryMatches ?? []).map((match: any) => [match.order_id, match]),
  );

  const capacityWithFreshness = (capacity ?? []).map((slot: any) => ({
    ...slot,
    freshness: evaluateCapacityFreshness({
      confidence: Number(slot.confidence ?? 0),
      lastVerifiedAt: slot.last_verified_at ?? null,
      updatedAt: slot.updated_at,
    }),
  }));

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">FactoryMesh Control Plane</span>
          <h1 className="workspace-title">{organization?.name ?? "Workspace"}</h1>
          <p className="muted">{profile.full_name ?? "Operator"} · {role}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="secondary-button">Sign out</button>
        </form>
      </header>

      <section className="workspace-stats">
        <article><span>Visible orders</span><strong>{orders?.length ?? 0}</strong></article>
        <article>
          <span>Executable fresh capacity</span>
          <strong>
            {capacityWithFreshness.filter(
              (slot: any) =>
                slot.status !== "booked" &&
                (slot.freshness.state === "fresh" || slot.freshness.state === "aging"),
            ).length}
          </strong>
        </article>
        <article><span>Network mode</span><strong>{isFactory ? "Supply" : isOperator ? "Operations" : "Demand"}</strong></article>
      </section>

      {isBuyer && (
        <section className="workspace-panel">
          <div className="section-heading">
            <div><span className="eyebrow">Demand</span><h2>Create production brief</h2></div>
            <span className="status">Buyer workflow</span>
          </div>
          <ProductionBriefForm />
        </section>
      )}

      {isFactory && (
        <section className="workspace-panel">
          <div className="section-heading">
            <div><span className="eyebrow">Supply</span><h2>Publish production capacity</h2></div>
            <span className="status">Factory workflow</span>
          </div>
          <CapacityForm />
        </section>
      )}

      {isOperator && (
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Trust operations</span>
              <h2>Factory & capacity verification</h2>
            </div>
            <span className="status">Operator workflow</span>
          </div>
          <OperatorVerificationPanel
            factories={(factories ?? []).map((factory: any) => ({
              id: factory.id,
              legalName: factory.legal_name,
              verified: Boolean(factory.verified),
              city: factory.city ?? null,
              countryCode: factory.country_code,
            }))}
            capacity={capacityWithFreshness.map((slot: any) => ({
              id: slot.id,
              factoryId: slot.factory_id,
              productCategory: slot.product_category ?? null,
              startsOn: slot.starts_on,
              endsOn: slot.ends_on,
              confidence: Number(slot.confidence ?? 0),
              source: slot.source,
              freshness: slot.freshness.state,
              effectiveConfidence: slot.freshness.effectiveConfidence,
              lastVerifiedAt: slot.last_verified_at ?? null,
            }))}
          />
        </section>
      )}

      <section className="workspace-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Orders</span>
            <h2>{isFactory ? "Matched & assigned production" : "Production pipeline"}</h2>
          </div>
          <span className="status">{orders?.length ?? 0} records</span>
        </div>
        <div className="data-list">
          {(orders ?? []).length === 0 ? (
            <p className="empty-state">No orders yet.</p>
          ) : (orders ?? []).map((order: any) => {
            const ownMatch = matchesByOrder.get(order.id);
            return (
              <article className="data-row order-record" key={order.id}>
                <div className="data-main">
                  <strong>{order.title}</strong>
                  <span>{order.product_category} · {order.quantity.toLocaleString()} units</span>
                </div>
                <div><span>Status</span><strong>{order.status.replaceAll("_", " ")}</strong></div>
                <div><span>Deadline</span><strong>{order.required_delivery_date}</strong></div>
                <div>
                  <span>Target</span>
                  <strong>
                    {order.target_unit_price
                      ? order.currency + " " + Number(order.target_unit_price).toFixed(2)
                      : "Open"}
                  </strong>
                </div>

                {isBuyer && <TechPackUploader orderId={order.id} hasFile={Boolean(order.tech_pack_path)} />}
                {isBuyer && !order.assigned_factory_id
                  ? <OrderActions orderId={order.id} quantity={order.quantity} />
                  : null}

                {isFactory && !order.assigned_factory_id && ownMatch ? (
                  <FactoryCommercialResponse
                    matchId={ownMatch.id}
                    currentResponse={ownMatch.factory_response}
                    quotedUnitPrice={
                      ownMatch.quoted_unit_price == null
                        ? null
                        : Number(ownMatch.quoted_unit_price)
                    }
                    quotedCurrency={ownMatch.quoted_currency}
                    promisedShipDate={ownMatch.promised_ship_date}
                    factoryNote={ownMatch.factory_note}
                  />
                ) : null}

                {isFactory && order.assigned_factory_id
                  ? <ProductionEventForm orderId={order.id} />
                  : null}

                {isOperator && order.assigned_factory_id && ["shipped", "completed"].includes(order.status) ? (
                  <OutcomeMemoryForm orderId={order.id} currency={order.currency} />
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="workspace-panel">
        <div className="section-heading">
          <div><span className="eyebrow">Capacity map</span><h2>Executable production windows</h2></div>
          <span className="status">Freshness-aware live data</span>
        </div>
        <div className="data-list">
          {capacityWithFreshness.length === 0 ? (
            <p className="empty-state">No current capacity published.</p>
          ) : capacityWithFreshness.map((slot: any) => (
            <article className="data-row compact" key={slot.id}>
              <div className="data-main">
                <strong>{slot.product_category}</strong>
                <span>{slot.starts_on} → {slot.ends_on}</span>
              </div>
              <div>
                <span>Available</span>
                <strong>{Math.max(0, slot.available_units - slot.reserved_units).toLocaleString()}</strong>
              </div>
              <div><span>Status</span><strong>{slot.status}</strong></div>
              <div>
                <span>Trust</span>
                <strong>
                  {slot.freshness.state} · {slot.freshness.effectiveConfidence.toFixed(0)}%
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
