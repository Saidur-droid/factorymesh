export async function GET() {
  return Response.json({
    ok: true,
    service: "factorymesh",
    timestamp: new Date().toISOString(),
  });
}
