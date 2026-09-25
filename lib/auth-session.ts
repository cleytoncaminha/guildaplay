import "server-only";

import type { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE = "guilda_access";
export const REFRESH_COOKIE = "guilda_refresh";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");
const secure = process.env.NODE_ENV === "production";

export type SessionTokens = { accessToken: string; expiresIn: number; refreshToken?: string };

export function isTrustedMutation(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.nextUrl.host; }
  catch { return false; }
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Request-Id", crypto.randomUUID());
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export function refreshTokenFrom(response: Response) {
  const setCookie = response.headers.get("set-cookie");
  const match = setCookie?.match(/(?:^|,\s*)refresh_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function applySessionCookies(response: NextResponse, tokens: SessionTokens) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokens.expiresIn,
    priority: "high",
  });
  if (tokens.refreshToken) {
    response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api",
      priority: "high",
    });
  }
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/api", maxAge: 0 });
}

export async function refreshSession(refreshToken: string, userAgent?: string | null): Promise<SessionTokens | null> {
  const response = await apiRequest("/auth/refresh", {
    method: "POST",
    headers: {
      Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
      ...(userAgent ? { "User-Agent": userAgent } : {}),
    },
  });
  if (!response.ok) return null;
  const body = await response.json() as { data: { accessToken: string; expiresIn: number } };
  return { ...body.data, refreshToken: refreshTokenFrom(response) };
}

export async function authorizedApiRequest(request: NextRequest, path: string, init: RequestInit = {}) {
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let rotated: SessionTokens | null = null;

  const call = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (request.headers.get("user-agent")) headers.set("User-Agent", request.headers.get("user-agent")!);
    return apiRequest(path, { ...init, headers });
  };

  let response = accessToken ? await call(accessToken) : null;
  if (!response || response.status === 401) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return { response: response ?? new Response(JSON.stringify({ message: "Sessão não encontrada." }), { status: 401, headers: { "Content-Type": "application/json" } }), rotated: null };
    rotated = await refreshSession(refreshToken, request.headers.get("user-agent"));
    if (!rotated) return { response: new Response(JSON.stringify({ message: "Sua sessão expirou. Entre novamente." }), { status: 401, headers: { "Content-Type": "application/json" } }), rotated: null };
    accessToken = rotated.accessToken;
    response = await call(accessToken);
  }

  return { response, rotated };
}
