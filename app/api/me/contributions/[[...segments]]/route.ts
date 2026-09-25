import { NextRequest, NextResponse } from "next/server";
import { contributionSchema } from "@/lib/contribution-schemas";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies, isTrustedMutation } from "@/lib/auth-session";

type RouteContext = { params: Promise<{ segments?: string[] }> };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function paginationQuery(request: NextRequest) {
  const query = new URLSearchParams();
  for (const name of ["page", "limit"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value !== null) query.set(name, value);
  }
  return query.size ? `?${query}` : "";
}

async function proxyResponse(request: NextRequest, path: string, init: RequestInit = {}) {
  const { response, rotated } = await authorizedApiRequest(request, path, init);
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
}

export async function GET(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).segments ?? [];
  try {
    if (segments.length === 0) {
      return proxyResponse(request, `/catalog/submissions/mine${paginationQuery(request)}`);
    }
    if (segments.length === 1 && uuidPattern.test(segments[0])) {
      return proxyResponse(request, `/catalog/submissions/mine/${segments[0]}`);
    }
    return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });
  } catch {
    return NextResponse.json({ message: "Não foi possível acessar suas contribuições." }, { status: 503 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).segments ?? [];
  if (segments.length !== 0) return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });
  if (!isTrustedMutation(request)) return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });

  let input: unknown;
  try { input = await request.json(); } catch { input = null; }
  const parsed = contributionSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    return proxyResponse(request, "/catalog/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível enviar sua contribuição." }, { status: 503 });
  }
}

