import { test, expect } from "@playwright/test";

test("auth and dashboard are reachable", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Pro Studio" })).toBeVisible();
});
