import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { ciEnvironment } from "../scripts/ci/env.mjs";
import trMessages from "../messages/tr.json";
import enMessages from "../messages/en.json";
import { cleanupSearchOutcomeEvents, observeSearchOutcomeEvents } from "./helpers/search-outcomes";

for (const locale of ["tr", "en"] as const) {
  test(`${locale}: submitted search is measured and admin latency chart is usable`, async ({ page }, testInfo) => {
    // Only the fixed disposable CI database is used by this suite.
    const database = postgres(ciEnvironment().DATABASE_URL, { max: 1 });
    const sampleIds: string[] = [];
    const outcomeIds = observeSearchOutcomeEvents(page);
    let userId: string | undefined;
    await page.route(/^https:\/\//, route => route.abort());
    const messages = locale === "tr" ? trMessages : enMessages;
    const copy = messages.Dashboard.overview.queryLatency;
    const searchPath = `/${locale}/${locale === "tr" ? "arama" : "search"}/kitap`;
    const ip = `10.42.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    await page.context().setExtraHTTPHeaders({ "x-forwarded-for": ip });
    try {
      await page.goto(`/${locale}`);
      await page.route(new RegExp(`/${locale}/${locale === "tr" ? "arama" : "search"}/kitap(?:\\?|$)`), async route => {
        // The telemetry should include this real network/navigation wait.
        await new Promise(resolve => setTimeout(resolve, 350));
        await route.continue();
      });
      const input = page.getByRole("searchbox", { name: messages.Home.hero.searchPlaceholder, exact: true });
      await input.fill("kitap");
      const measured = page.waitForResponse(response => response.url().includes("searchTelemetry.recordWordQueryLatency") && response.request().method() === "POST");
      await input.press("Enter");
      await expect(page).toHaveURL(searchPath);
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      const report = await measured;
      expect(report.ok()).toBe(true);
      const requestData = report.request().postDataJSON();
      const sample = requestData["0"]?.json ?? requestData.json;
      expect(Object.keys(sample).sort()).toEqual(["durationMs", "eventId", "source"]);
      expect(sample.durationMs).toBeGreaterThanOrEqual(350);
      sampleIds.push(sample.eventId);
      const [persisted] = await database`SELECT duration_ms FROM word_query_latencies WHERE event_id = ${sample.eventId}`;
      expect(persisted.duration_ms).toBe(sample.durationMs);
      let repeatReports = 0;
      page.on("request", request => { if (request.url().includes("searchTelemetry.recordWordQueryLatency")) repeatReports++; });
      await page.reload();
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      expect(repeatReports).toBe(0);

      const identity = `latency_${randomUUID().replaceAll("-", "")}`;
      const email = `${identity}@example.invalid`;
      const password = "ci-only-latency-test-password";
      const signup = await page.request.post("/api/auth/sign-up/email", {
        headers: { origin: "http://localhost:3100" },
        data: { email, name: "Latency Test", username: identity, password },
      });
      expect(signup.ok(), await signup.text()).toBe(true);
      userId = (await signup.json()).user.id;
      await database`UPDATE users SET role = 'admin' WHERE id = ${userId!}`;
      await page.request.post("/api/auth/sign-out", { headers: { origin: "http://localhost:3100" } });
      const signin = await page.request.post("/api/auth/sign-in/email", { headers: { origin: "http://localhost:3100" }, data: { email, password } });
      expect(signin.ok()).toBe(true);

      // Persist known historical fixtures to verify lines and unsampled gaps.
      for (let daysAgo = 1; daysAgo <= 29; daysAgo++) {
        if (daysAgo % 7 === 0) continue;
        const eventId = randomUUID();
        sampleIds.push(eventId);
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - daysAgo);
        await database`INSERT INTO word_query_latencies (event_id, duration_ms, source, received_at)
          VALUES (${eventId}, ${120 + daysAgo * 16 + (daysAgo % 3) * 95}, 'online', ${date})`;
      }
      await page.goto(locale === "tr" ? "/tr/panel" : "/en/dashboard");
      const chart = page.getByRole("heading", { name: copy.title, exact: true }).locator("../../..");
      await expect(page.getByRole("img", { name: copy.chartLabel, exact: true })).toBeVisible();
      const details = page.locator("details").filter({ hasText: copy.viewData });
      await details.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(details.getByRole("table")).toBeVisible();
      expect(await details.locator("tbody tr").count()).toBe(30);
      await details.locator("summary").press("Enter");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.screenshot({ path: testInfo.outputPath("dashboard.png"), fullPage: true });
      await chart.screenshot({ path: testInfo.outputPath("latency-chart.png") });
      await expect(chart).toBeVisible();
      if (testInfo.project.name === "desktop") {
        const navbarInput = page.locator('form input[name="word"]');
        const navbarReport = page.waitForResponse(response => response.url().includes("searchTelemetry.recordWordQueryLatency") && response.request().method() === "POST");
        await navbarInput.fill("kitap");
        await navbarInput.press("Enter");
        await expect(page).toHaveURL(searchPath);
        const reported = await navbarReport;
        expect(reported.ok()).toBe(true);
        const body = reported.request().postDataJSON();
        sampleIds.push((body["0"]?.json ?? body.json).eventId);
      }
    } finally {
      await cleanupSearchOutcomeEvents(database, outcomeIds);
      if (sampleIds.length) await database`DELETE FROM word_query_latencies WHERE event_id IN ${database(sampleIds)}`;
      if (userId) await database`DELETE FROM users WHERE id = ${userId}`;
      await database.end({ timeout: 5 });
    }
  });
}
