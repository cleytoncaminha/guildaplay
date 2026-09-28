import { NextRequest, NextResponse } from "next/server";
import { applySessionCookies, authorizedApiRequest, clearSessionCookies } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const params = new URLSearchParams();
  for (const name of ["page", "limit", "eventType", "actorUserId", "from", "to"]) {
    const value = request.nextUrl.searchParams.get(name);
    if (value) params.set(name, value);
  }

  try {
    const { response, rotated } = await authorizedApiRequest(
      request,
      `/admin/audit-logs${params.size ? `?${params.toString()}` : ""}`,
      { headers: { "X-Request-Id": requestId } },
    );
    const text = await response.text();
    const result = new NextResponse(text || null, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": response.headers.get("x-request-id") ?? requestId,
        ...(text ? { "Content-Type": response.headers.get("content-type") ?? "application/json" } : {}),
      },
    });
    if (rotated) applySessionCookies(result, rotated);
    if (response.status === 401) clearSessionCookies(result);
    return result;
  } catch {
    return NextResponse.json({ message: "Não foi possível consultar a auditoria agora.", requestId }, { status: 503, headers: { "X-Request-Id": requestId } });
  }
}
