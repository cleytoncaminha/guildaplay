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
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: new URL(`${route.name}-${viewport.name}.png`, outputDirectory).pathname.slice(1), fullPage: true });
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
      title: document.title,
    }));
    results.push({ route: route.path, viewport: viewport.name, ...dimensions, errors });
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
