import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000/api/v1";
  const upstreamUrl = new URL(`${apiBaseUrl.replace(/\/$/, "")}/catalog/items`);
  request.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.append(key, value));

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json", "X-Request-Id": requestId },
      cache: "no-store",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "X-Request-Id": response.headers.get("x-request-id") ?? requestId },
    });
  } catch {
    return NextResponse.json(
      { statusCode: 503, code: "API_UNAVAILABLE", message: "Não foi possível acessar o catálogo agora.", requestId },
      { status: 503, headers: { "X-Request-Id": requestId } },
    );
  }
}
