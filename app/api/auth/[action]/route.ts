import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema, tokenSchema } from "@/lib/auth-schemas";
import {
  REFRESH_COOKIE,
  apiRequest,
  applySessionCookies,
  authorizedApiRequest,
  clearSessionCookies,
  isTrustedMutation,
  refreshSession,
  refreshTokenFrom,
} from "@/lib/auth-session";
import type { ApiEnvelope, AuthUser } from "@/lib/auth-types";

type RouteContext = { params: Promise<{ action: string }> };

const publicActions: Record<string, { path: string; schema: ZodType }> = {
  register: { path: "/auth/register", schema: registerSchema },
  "verify-email": { path: "/auth/verify-email", schema: tokenSchema },
  "resend-verification": { path: "/auth/resend-verification", schema: emailSchema },
  "forgot-password": { path: "/auth/forgot-password", schema: emailSchema },
  "reset-password": { path: "/auth/reset-password", schema: resetPasswordSchema },
};

function upstreamResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function jsonBody(request: NextRequest) {
  try { return await request.json() as unknown; }
  catch { return null; }
}

function validationFailure(issues: { path: PropertyKey[]; message: string }[]) {
  return NextResponse.json({ code: "VALIDATION_ERROR", message: issues[0]?.message ?? "Dados inválidos.", fields: issues.reduce<Record<string, string>>((fields, issue) => {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
    return fields;
  }, {}) }, { status: 400 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  if (action !== "session") return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });

  try {
    const { response, rotated } = await authorizedApiRequest(request, "/auth/me");
    const body = await response.json();
    const result = response.status === 401
      ? upstreamResponse({ data: null }, 200)
      : upstreamResponse(body, response.status);
    if (rotated) applySessionCookies(result, rotated);
    if (response.status === 401) clearSessionCookies(result);
    return result;
  } catch {
    return NextResponse.json({ message: "Não foi possível consultar a sessão." }, { status: 503 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isTrustedMutation(request)) return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  const { action } = await context.params;

  try {
    if (action === "login") {
      const parsed = loginSchema.safeParse(await jsonBody(request));
      if (!parsed.success) return validationFailure(parsed.error.issues);
      const upstream = await apiRequest("/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") ?? "GuildaPlay Web" }, body: JSON.stringify(parsed.data) });
      const body = await upstream.json() as ApiEnvelope<{ accessToken: string; expiresIn: number; user: AuthUser }>;
      if (!upstream.ok) return upstreamResponse(body, upstream.status);
      const refreshToken = refreshTokenFrom(upstream);
      if (!refreshToken) return NextResponse.json({ message: "A API não iniciou a sessão corretamente." }, { status: 502 });
      const result = upstreamResponse({ data: { user: body.data.user } }, 200);
      applySessionCookies(result, { accessToken: body.data.accessToken, expiresIn: body.data.expiresIn, refreshToken });
      return result;
    }

    if (action === "refresh") {
      const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
      if (!refreshToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
      const tokens = await refreshSession(refreshToken, request.headers.get("user-agent"));
      if (!tokens) {
        const expired = NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
        clearSessionCookies(expired);
        return expired;
      }
      const result = NextResponse.json({ data: { refreshed: true } });
      applySessionCookies(result, tokens);
      return result;
    }

    if (action === "logout" || action === "logout-all") {
      const { response, rotated } = await authorizedApiRequest(request, action === "logout" ? "/auth/logout" : "/auth/logout-all", { method: "POST" });
      await response.text();
      const result = NextResponse.json({ data: null }, { status: response.ok ? 200 : response.status });
      if (rotated) applySessionCookies(result, rotated);
      clearSessionCookies(result);
      return result;
    }

    const publicAction = publicActions[action];
    if (!publicAction) return NextResponse.json({ message: "Rota não encontrada." }, { status: 404 });
    const parsed = publicAction.schema.safeParse(await jsonBody(request));
    if (!parsed.success) return validationFailure(parsed.error.issues);
    const upstream = await apiRequest(publicAction.path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const body = await upstream.json();
    const result = upstreamResponse(body, upstream.status);
    const verificationToken = upstream.headers.get("x-development-verification-token");
    const resetToken = upstream.headers.get("x-development-reset-token");
    if (verificationToken) result.headers.set("X-Development-Verification-Token", verificationToken);
    if (resetToken) result.headers.set("X-Development-Reset-Token", resetToken);
    return result;
  } catch {
    const result = NextResponse.json({ message: "Não foi possível acessar o serviço de autenticação." }, { status: 503 });
    if (action === "logout" || action === "logout-all") clearSessionCookies(result);
    return result;
  }
}
