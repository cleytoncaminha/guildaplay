import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { addCollectionItemSchema, createCollectionSchema, personalItemSchema, reviewSchema, updateCollectionSchema } from "@/lib/personal-schemas";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies, isTrustedMutation } from "@/lib/auth-session";

type Context = { params: Promise<{ segments: string[] }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function query(request: NextRequest, names: string[]) {
  const params = new URLSearchParams();
  names.forEach((name) => { const value = request.nextUrl.searchParams.get(name); if (value !== null) params.set(name, value); });
  return params.size ? `?${params}` : "";
}

function resolve(segments: string[], method: string, request: NextRequest): { path: string; schema?: ZodType } | null {
  if (segments[0] === "items") {
    if (segments.length === 1 && method === "GET") return { path: `/catalog/me/items${query(request, ["hasItem", "wantsItem", "playedItem", "isFavorite", "page", "limit"])}` };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "PUT") return { path: `/catalog/me/items/${segments[1]}`, schema: personalItemSchema };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "DELETE") return { path: `/catalog/me/items/${segments[1]}` };
  }
  if (segments[0] === "collections") {
    if (segments.length === 1 && method === "GET") return { path: "/catalog/me/collections" };
    if (segments.length === 1 && method === "POST") return { path: "/catalog/me/collections", schema: createCollectionSchema };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "GET") return { path: `/catalog/me/collections/${segments[1]}` };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "PATCH") return { path: `/catalog/me/collections/${segments[1]}`, schema: updateCollectionSchema };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "DELETE") return { path: `/catalog/me/collections/${segments[1]}` };
    if (segments.length === 4 && uuid.test(segments[1]) && segments[2] === "items" && uuid.test(segments[3]) && method === "POST") return { path: `/catalog/me/collections/${segments[1]}/items/${segments[3]}`, schema: addCollectionItemSchema };
    if (segments.length === 4 && uuid.test(segments[1]) && segments[2] === "items" && uuid.test(segments[3]) && method === "DELETE") return { path: `/catalog/me/collections/${segments[1]}/items/${segments[3]}` };
  }
  if (segments[0] === "reviews") {
    if (segments.length === 1 && method === "GET") return { path: `/catalog/reviews/mine${query(request, ["page", "limit"])}` };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "PUT") return { path: `/catalog/reviews/${segments[1]}`, schema: reviewSchema };
    if (segments.length === 2 && uuid.test(segments[1]) && method === "DELETE") return { path: `/catalog/reviews/${segments[1]}` };
  }
  return null;
}

async function handle(request: NextRequest, context: Context) {
  const method = request.method.toUpperCase();
  if (method !== "GET" && !isTrustedMutation(request)) return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  const target = resolve((await context.params).segments, method, request);
  if (!target) return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });

  try {
    let body: string | undefined;
    if (target.schema) {
      let raw: unknown;
      try { raw = await request.json(); } catch { raw = null; }
      const parsed = target.schema.safeParse(raw);
      if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
      body = JSON.stringify(parsed.data);
    }
    const { response, rotated } = await authorizedApiRequest(request, target.path, { method, ...(body ? { body, headers: { "Content-Type": "application/json" } } : {}) });
    const text = await response.text();
    const result = new NextResponse(text || null, { status: response.status, headers: text ? { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } : { "Cache-Control": "no-store" } });
    if (rotated) applySessionCookies(result, rotated);
    if (response.status === 401) clearSessionCookies(result);
    return result;
  } catch { return NextResponse.json({ message: "Não foi possível acessar seus dados pessoais." }, { status: 503 }); }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
