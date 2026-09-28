import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.FRONTEND_URL ?? "http://localhost:3001";
const outputDirectory = new URL("../.qa/", import.meta.url);

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const routes = [
  { name: "home", path: "/" },
  { name: "catalog", path: "/catalog" },
  { name: "lists", path: "/lists" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "library", path: "/library", mockAccount: true },
  { name: "my-collections", path: "/my-collections", mockAccount: true },
  { name: "my-reviews", path: "/my-reviews", mockAccount: true },
  { name: "contributions", path: "/contributions", mockAccount: true },
  { name: "new-contribution", path: "/contributions/new", mockAccount: true },
  { name: "contribution-detail", path: "/contributions/00000000-0000-4000-8000-000000000002", mockAccount: true, mockContribution: true },
  { name: "admin", path: "/admin", mockAdmin: true },
  { name: "admin-systems", path: "/admin/catalog/systems", mockAdmin: true },
  { name: "admin-items", path: "/admin/catalog/items", mockAdmin: true },
  { name: "admin-item-new", path: "/admin/catalog/items/new", mockAdmin: true },
  { name: "admin-publishers", path: "/admin/catalog/publishers", mockAdmin: true },
  { name: "admin-editions", path: "/admin/catalog/editions", mockAdmin: true },
  { name: "admin-curated-lists", path: "/admin/curated-lists", mockAdmin: true },
  { name: "admin-moderation-submissions", path: "/admin/moderation/submissions", mockAdmin: true },
  { name: "admin-moderation-reports", path: "/admin/moderation/reports", mockAdmin: true },
  { name: "admin-moderation-reviews", path: "/admin/moderation/reviews", mockAdmin: true },
  { name: "admin-audit", path: "/admin/audit", mockAdmin: true },
  { name: "not-found", path: "/catalog/missing-item" },
];

for (const viewport of [{ name: "desktop", width: 1680, height: 1050 }, { name: "mobile", width: 390, height: 844 }]) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    if (route.mockAccount) {
      await page.route("**/api/auth/session", (requestRoute) => requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify({ data: { id: "00000000-0000-4000-8000-000000000001", name: "Aventureira", email: "aventureira@example.com", emailVerified: true, roles: ["USER"] } }) }));
      await page.route("**/api/me/catalog/**", (requestRoute) => {
        const url = requestRoute.request().url();
        const body = url.includes("/collections") ? { data: [] } : { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
        return requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
      });
      await page.route("**/api/me/contributions**", (requestRoute) => {
        const contribution = {
          id: "00000000-0000-4000-8000-000000000002",
          type: "CREATE_ITEM",
          catalogItemId: null,
          catalogItem: null,
          payload: { title: "Crônicas da Aurora", slug: "cronicas-da-aurora", type: "SETTING", summary: "Um cenário fantástico sugerido pela comunidade." },
          status: "PENDING",
          reviewReason: null,
          reviewedAt: null,
          createdAt: "2026-09-25T12:00:00.000Z",
          updatedAt: "2026-09-25T12:00:00.000Z",
        };
        const body = route.mockContribution ? { data: contribution } : { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
        return requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
      });
    }
    if (route.mockAdmin) {
      await page.route("**/api/auth/session", (requestRoute) => requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify({ data: { id: "00000000-0000-4000-8000-000000000001", name: "Mestra da Guilda", email: "admin@example.com", emailVerified: true, roles: ["ADMIN"] } }) }));
      await page.route("**/api/admin/catalog/**", (requestRoute) => {
        const url = new URL(requestRoute.request().url());
        const resource = url.pathname.split("/").at(-1);
        const data = resource === "systems" ? [{
          id: "00000000-0000-4000-8000-000000000003",
          name: "Crônicas da Aurora",
          slug: "cronicas-da-aurora",
          description: "Sistema de fantasia heroica.",
          releaseYear: 2026,
          status: "DRAFT",
          publisher: { id: "00000000-0000-4000-8000-000000000004", name: "Editora da Guilda", slug: "editora-da-guilda", websiteUrl: null, countryCode: "BR", createdAt: "2026-09-25T12:00:00.000Z", updatedAt: "2026-09-25T12:00:00.000Z" },
          createdAt: "2026-09-25T12:00:00.000Z",
          updatedAt: "2026-09-25T12:00:00.000Z",
        }] : resource === "publishers" ? [{ id: "00000000-0000-4000-8000-000000000004", name: "Editora da Guilda", slug: "editora-da-guilda", websiteUrl: null, countryCode: "BR", createdAt: "2026-09-25T12:00:00.000Z", updatedAt: "2026-09-25T12:00:00.000Z" }] : [];
        return requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify({ data, meta: { page: 1, limit: Number(url.searchParams.get("limit") ?? 20), total: data.length, totalPages: data.length ? 1 : 0 } }) });
      });
      await page.route("**/api/admin/audit-logs**", (requestRoute) => requestRoute.fulfill({ contentType: "application/json", body: JSON.stringify({ data: [], meta: { page: 1, limit: 30, total: 0, totalPages: 0 } }) }));
    }
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: new URL(`${route.name}-${viewport.name}.png`, outputDirectory).pathname.slice(1), fullPage: true });
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
      title: document.title,
    }));
    if (dimensions.contentWidth > dimensions.viewportWidth + 1) errors.push(`Horizontal overflow: ${dimensions.contentWidth}px > ${dimensions.viewportWidth}px`);
    results.push({ route: route.path, viewport: viewport.name, ...dimensions, errors });
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
