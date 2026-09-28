import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { formatDate, formatRating } from "../lib/formatters.ts";
import { HttpClientError, requestJson } from "../lib/http-client.ts";

test("formatDate returns a readable pt-BR date and preserves empty values", () => {
  assert.equal(formatDate(null), null);
  assert.equal(formatDate(undefined), null);
  assert.equal(formatDate("2026-09-25T12:00:00.000Z"), "25 de setembro de 2026");
});

test("formatRating formats decimal ratings for pt-BR", () => {
  assert.equal(formatRating(null), null);
  assert.equal(formatRating(4.25), "4,3");
  assert.equal(formatRating(10), "10,0");
});

test("requestJson sends a request id and returns JSON", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("accept"), "application/json");
    assert.match(headers.get("x-request-id") ?? "", /.+/);
    return new Response(JSON.stringify({ data: { ok: true } }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const result = await requestJson<{ data: { ok: boolean } }>("https://example.test/data");
  assert.deepEqual(result, { data: { ok: true } });
  assert.equal(fetchMock.mock.callCount(), 1);
  fetchMock.mock.restore();
});

test("requestJson exposes API status, code and request id", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ code: "NOPE", message: "Falhou" }), { status: 422, headers: { "Content-Type": "application/json", "X-Request-Id": "req-test-422" } }));
  await assert.rejects(
    () => requestJson("https://example.test/failure"),
    (error: unknown) => error instanceof HttpClientError && error.status === 422 && error.code === "NOPE" && error.requestId === "req-test-422" && error.message === "Falhou",
  );
  fetchMock.mock.restore();
});

test("requestJson turns network failures into a supportable error", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => { throw new TypeError("offline"); });
  await assert.rejects(
    () => requestJson("https://example.test/offline"),
    (error: unknown) => error instanceof HttpClientError && error.status === 0 && error.code === "NETWORK_ERROR" && Boolean(error.requestId),
  );
  fetchMock.mock.restore();
});
