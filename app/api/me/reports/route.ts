import { NextRequest, NextResponse } from "next/server";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies, isTrustedMutation } from "@/lib/auth-session";
import { reportSchema } from "@/lib/report-schema";

export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ message: "Origem da requisição não permitida." }, { status: 403 });

  let input: unknown;
  try { input = await request.json(); } catch { input = null; }
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });

  try {
    const { response, rotated } = await authorizedApiRequest(request, "/catalog/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const text = await response.text();
    const result = new NextResponse(text || null, {
      status: response.status,
      headers: { "Cache-Control": "no-store", ...(text ? { "Content-Type": response.headers.get("content-type") ?? "application/json" } : {}) },
    });
    if (rotated) applySessionCookies(result, rotated);
    if (response.status === 401) clearSessionCookies(result);
    return result;
  } catch {
    return NextResponse.json({ message: "Não foi possível enviar a denúncia." }, { status: 503 });
  }
}

