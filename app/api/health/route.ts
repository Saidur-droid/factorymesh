export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "factorymesh",
      timestamp: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } }
  );
}
