import { NextRequest, NextResponse } from "next/server";
import { profileSchema } from "@/lib/auth-schemas";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies, isTrustedMutation } from "@/lib/auth-session";

async function finish(request: NextRequest, path: string, init?: RequestInit) {
  const { response, rotated } = await authorizedApiRequest(request, path, init);
  const body = await response.json();
  const result = NextResponse.json(body, { status: response.status, headers: { "Cache-Control": "no-store" } });
  if (rotated) applySessionCookies(result, rotated);
  if (response.status === 401) clearSessionCookies(result);
  return result;
}

export async function GET(request: NextRequest) {
  try { return await finish(request, "/users/me"); }
  catch { return NextResponse.json({ message: "Não foi possível carregar o perfil." }, { status: 503 }); }
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });
  try {
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    const data = { ...parsed.data, country: parsed.data.country || undefined };
    return await finish(request, "/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  } catch { return NextResponse.json({ message: "Não foi possível atualizar o perfil." }, { status: 503 }); }
}
