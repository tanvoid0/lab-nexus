import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD?.trim();

test.describe("seed login (optional)", () => {
  test.skip(
    !email || !password,
    "Set E2E_EMAIL and E2E_PASSWORD to run (match SEED_DEMO_PASSWORD or prisma/.seed-demo-credentials.json after seed).",
  );

  test("sign in reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /^Dashboard$/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /inventory/i }).first(),
    ).toBeVisible();
  });
});
