export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liten hjälpare: proxya mot Wield
 */
async function proxy(req, { params }, method = "GET") {
  const key = process.env.WIELD_API_KEY || "";
  if (!key) {
    return new Response(JSON.stringify({ ok: false, error: "Missing WIELD_API_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }

  const parts = Array.isArray(params?.path) ? params.path : [];
  const suffix = req.nextUrl?.search || "";
  const upstream = `https://build.wield.xyz/${parts.join("/")}${suffix}`;

  const init = {
    method,
    headers: {
      "x-api-key": key,
      // Forwarda content-type bara vid POST/PUT/PATCH
      ...(method !== "GET" && { "content-type": req.headers.get("content-type") || "application/json" })
    },
    // vid skrivande metoder, vidarebefordra body
    ...(method !== "GET" ? { body: await req.text() } : undefined),
    // undvik edge-caching på mellanlagren
    next: { revalidate: 0 }
  };

  const r = await fetch(upstream, init);
  const bodyText = await r.text();
  const contentType = r.headers.get("content-type") || "application/json";

  return new Response(bodyText, {
    status: r.status,
    headers: {
      "content-type": contentType,
      "cache-control": "no-store"
    }
  });
}

export async function GET(req, ctx) {
  try {
    return await proxy(req, ctx, "GET");
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
}

export async function POST(req, ctx) {
  try {
    return await proxy(req, ctx, "POST");
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" }
    });
  }
}

// (valfritt stöd för fler metoder)
// export async function PUT(req, ctx) { return proxy(req, ctx, "PUT"); }
// export async function PATCH(req, ctx) { return proxy(req, ctx, "PATCH"); }
// export async function DELETE(req, ctx) { return proxy(req, ctx, "DELETE"); }
