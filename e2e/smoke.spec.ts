import { test, expect } from "@playwright/test";

test.describe("public shell", () => {
  test("health endpoint", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /email/i }),
    ).toBeVisible();
    await expect(
      page.getByLabel(/password/i),
    ).toBeVisible();
  });

  test("login page redirects unauthenticated home to login", async ({
    page,
  }) => {
    await page.goto("/inventory");
    await expect(page).toHaveURL(/\/login/);
  });
});
