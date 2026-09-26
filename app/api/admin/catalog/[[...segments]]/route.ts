import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import {
  createCategorySchema,
  createCatalogItemSchema,
  createAliasSchema,
  createEditionSchema,
  createRelationSchema,
  createSourceSchema,
  createCreatorSchema,
  createPublisherSchema,
  createRpgSystemSchema,
  createTagSchema,
  mediaUploadSchema,
  updateCategorySchema,
  updateCatalogItemSchema,
  updateEditionSchema,
  updateCreatorSchema,
  updatePublisherSchema,
  updateRpgSystemSchema,
  updateTagSchema,
} from "@/lib/admin-schemas";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies, isTrustedMutation } from "@/lib/auth-session";

type Context = { params: Promise<{ segments?: string[] }> };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const listResources = new Set(["publishers", "creators", "categories", "tags", "systems", "items", "editions"]);
const referenceSchemas = {
  publishers: { create: createPublisherSchema, update: updatePublisherSchema },
  creators: { create: createCreatorSchema, update: updateCreatorSchema },
  categories: { create: createCategorySchema, update: updateCategorySchema },
  tags: { create: createTagSchema, update: updateTagSchema },
} as const;

function paginationQuery(request: NextRequest) {
  const query = new URLSearchParams();
  for (const name of ["page", "limit"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value !== null) query.set(name, value);
  }
  return query.size ? `?${query}` : "";
}

function resolve(segments: string[], method: string, request: NextRequest): { path: string; schema?: ZodType } | null {
  const [resource, id, action] = segments;

  if (segments.length === 1 && listResources.has(resource) && method === "GET") {
    return { path: `/admin/catalog/${resource}${paginationQuery(request)}` };
  }

  if (resource in referenceSchemas) {
    const schemas = referenceSchemas[resource as keyof typeof referenceSchemas];
    if (segments.length === 1 && method === "POST") return { path: `/admin/catalog/${resource}`, schema: schemas.create };
    if (segments.length === 2 && uuid.test(id) && method === "PATCH") return { path: `/admin/catalog/${resource}/${id}`, schema: schemas.update };
    return null;
  }

  if (resource === "items") {
    if (segments.length === 1 && method === "POST") return { path: "/admin/catalog/items", schema: createCatalogItemSchema };
    if (segments.length === 2 && uuid.test(id) && method === "GET") return { path: `/admin/catalog/items/${id}` };
    if (segments.length === 2 && uuid.test(id) && method === "PATCH") return { path: `/admin/catalog/items/${id}`, schema: updateCatalogItemSchema };
    if (segments.length === 3 && uuid.test(id) && (action === "publish" || action === "archive") && method === "POST") {
      return { path: `/admin/catalog/items/${id}/${action}` };
    }
    if (segments.length === 3 && uuid.test(id) && action === "aliases" && method === "POST") return { path: `/admin/catalog/items/${id}/aliases`, schema: createAliasSchema };
    if (segments.length === 3 && uuid.test(id) && action === "sources" && method === "POST") return { path: `/admin/catalog/items/${id}/sources`, schema: createSourceSchema };
    if (segments.length === 3 && uuid.test(id) && action === "relations" && method === "POST") return { path: `/admin/catalog/items/${id}/relations`, schema: createRelationSchema };
    if (segments.length === 4 && uuid.test(id) && action === "relations" && uuid.test(segments[3]) && method === "DELETE") return { path: `/admin/catalog/items/${id}/relations/${segments[3]}` };
    return null;
  }

  if (resource === "editions") {
    if (segments.length === 1 && method === "POST") return { path: "/admin/catalog/editions", schema: createEditionSchema };
    if (segments.length === 2 && uuid.test(id) && method === "GET") return { path: `/admin/catalog/editions/${id}` };
    if (segments.length === 2 && uuid.test(id) && method === "PATCH") return { path: `/admin/catalog/editions/${id}`, schema: updateEditionSchema };
    return null;
  }

  if (resource === "media") {
    if (segments.length === 2 && id === "upload-url" && method === "POST") return { path: "/media/upload-url", schema: mediaUploadSchema };
    if (segments.length === 3 && uuid.test(id) && action === "complete" && method === "POST") return { path: `/media/${id}/complete` };
    return null;
  }

  if (resource !== "systems") return null;
  if (segments.length === 1 && method === "POST") return { path: "/admin/catalog/systems", schema: createRpgSystemSchema };
  if (segments.length === 2 && uuid.test(id) && method === "GET") return { path: `/admin/catalog/systems/${id}` };
  if (segments.length === 2 && uuid.test(id) && method === "PATCH") return { path: `/admin/catalog/systems/${id}`, schema: updateRpgSystemSchema };
  if (segments.length === 3 && uuid.test(id) && (action === "publish" || action === "archive") && method === "POST") {
    return { path: `/admin/catalog/systems/${id}/${action}` };
  }
  return null;
}

async function handle(request: NextRequest, context: Context) {
  const method = request.method.toUpperCase();
  if (method !== "GET" && !isTrustedMutation(request)) {
    return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  }

  const target = resolve((await context.params).segments ?? [], method, request);
  if (!target) return NextResponse.json({ message: "Rota administrativa não encontrada." }, { status: 404 });

  try {
    let body: string | undefined;
    if (target.schema) {
      let input: unknown;
      try { input = await request.json(); } catch { input = null; }
      const parsed = target.schema.safeParse(input);
      if (!parsed.success) {
        return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
      }
      body = JSON.stringify(parsed.data);
    }

    const { response, rotated } = await authorizedApiRequest(request, target.path, {
      method,
      ...(body ? { body, headers: { "Content-Type": "application/json" } } : {}),
    });
    const text = await response.text();
    const result = new NextResponse(text || null, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        ...(text ? { "Content-Type": response.headers.get("content-type") ?? "application/json" } : {}),
      },
    });
    if (rotated) applySessionCookies(result, rotated);
    if (response.status === 401) clearSessionCookies(result);
    return result;
  } catch {
    return NextResponse.json({ message: "Não foi possível acessar a administração do catálogo." }, { status: 503 });
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
