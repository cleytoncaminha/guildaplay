import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.route("**/api/auth/session", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: { id: "00000000-0000-4000-8000-000000000001", name: "Admin", email: "admin@example.com", emailVerified: true, roles: ["ADMIN"] } }) }));
await page.route("**/api/admin/catalog/reviews/pending**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [{ id: "00000000-0000-4000-8000-000000000002", rating: 9, content: "Excelente porta de entrada.", createdAt: "2026-09-25T12:00:00.000Z", updatedAt: "2026-09-25T12:00:00.000Z", author: { id: "u1", name: "Aventureira" }, catalogItem: { id: "i1", title: "Crônicas da Aurora", slug: "cronicas-da-aurora" } }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } }) }));
await page.route("**/api/admin/catalog/reviews/*/moderate", async (route) => {
  assert.equal(route.request().method(), "POST");
  const body = route.request().postDataJSON();
  assert.equal(body.status, "PUBLISHED");
  await route.fulfill({ contentType: "application/json", body: JSON.stringify({ data: { id: "review-1", status: "PUBLISHED", moderationReason: null, moderatedAt: "2026-09-27T12:00:00.000Z" } }) });
});

await page.goto(`${baseUrl}/admin/moderation/reviews`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: "Avaliações" }).waitFor();
await page.getByRole("button", { name: "Publicar" }).click();
await page.getByRole("button", { name: "Publicar avaliação" }).click();
await page.getByRole("status").filter({ hasText: "Decisão registrada" }).waitFor();

const publicPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await publicPage.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
assert.equal(await publicPage.locator(".skip-link").count(), 1);
await publicPage.locator(".skip-link").focus();
assert.equal(await publicPage.locator(".skip-link").innerText(), "Pular para o conteúdo principal");
await publicPage.evaluate(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  window.dispatchEvent(new Event("offline"));
});
await publicPage.getByRole("status").filter({ hasText: "Você está offline" }).waitFor();

console.log("E2E smoke passed: moderation decision, keyboard entry point and responsive public shell.");
await browser.close();
