// Serverless-proxy till upstream-API:t (förhindrar CORS + döljer nyckel)
import { NextResponse } from "next/server";

const UPSTREAM = "https://vibechain.com/api/"; // <— använder Vibe API-proxy

export async function GET(req, { params }) {
  return proxy(req, params);
}
export async function POST(req, { params }) {
  return proxy(req, params);
}

async function proxy(req, params) {
  try {
    const path = Array.isArray(params.path) ? params.path.join("/") : "";
    const url = new URL(req.url);
    const target = `${UPSTREAM}${path}${url.search || ""}`;

    const res = await fetch(target, {
      method: req.method,
      headers: {
        "x-api-key": process.env.WIELD_API_KEY || "",
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
      cache: "no-store",
    });

    const ct = res.headers.get("content-type") || "";
    const init = { status: res.status, headers: { "content-type": ct } };
    if (ct.includes("application/json")) return NextResponse.json(await res.json(), init);
    return new NextResponse(await res.text(), init);
  } catch (e) {
    return NextResponse.json({ error: "proxy_failed", message: String(e) }, { status: 500 });
  }
}
