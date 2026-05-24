export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "inkdown",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    },
  );
}
