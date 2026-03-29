import { test, expect } from "@playwright/test";

const email = process.env.E2E_EMAIL?.trim();
const password = process.env.E2E_PASSWORD?.trim();

test.describe("seed login (optional)", () => {
  test.skip(
    !email || !password,
    "Set E2E_EMAIL and E2E_PASSWORD to run (e.g. admin@lab.local + labnexus123 on a seeded DB).",
  );

  test("sign in reaches inventory", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill(email!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/inventory/);
    await expect(
      page.getByRole("link", { name: /inventory/i }).first(),
    ).toBeVisible();
  });
});
