export type HttpErrorPayload = {
  code?: string;
  message?: string | string[];
  requestId?: string;
};

export class HttpClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    requestId?: string,
  ) {
    super(message);
    this.name = "HttpClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

function makeRequestId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function messageFrom(payload: HttpErrorPayload, fallback: string) {
  return Array.isArray(payload.message) ? payload.message.join(" ") : payload.message ?? fallback;
}

export async function requestJson<T>(input: RequestInfo | URL, init: RequestInit = {}) {
  const initialHeaders = new Headers(init.headers);
  const clientRequestId = initialHeaders.get("X-Request-Id") ?? makeRequestId();
  initialHeaders.set("Accept", "application/json");
  initialHeaders.set("X-Request-Id", clientRequestId);

  let response: Response;
  try {
    response = await fetch(input, { ...init, headers: initialHeaders });
  } catch {
    throw new HttpClientError(
      "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
      0,
      "NETWORK_ERROR",
      clientRequestId,
    );
  }

  const responseRequestId = response.headers.get("X-Request-Id") ?? clientRequestId;
  let payload: unknown = null;
  try { payload = await response.json(); } catch { /* Respostas 204 ou não JSON. */ }
  if (!response.ok) {
    const body = (payload && typeof payload === "object" ? payload : {}) as HttpErrorPayload;
    throw new HttpClientError(messageFrom(body, "Não foi possível concluir a solicitação."), response.status, body.code, body.requestId ?? responseRequestId);
  }
  return payload as T;
}
