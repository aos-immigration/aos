import { test, expect } from "@playwright/test";

test.describe("Preview my forms", () => {
  test("sends the intake and opens the I-130 draft", async ({ page }) => {
    const captured: { intake?: { petitioner?: { familyName?: string; givenName?: string } } } = {};

    await page.route("**/fill-intake/i-130", async (route) => {
      Object.assign(captured, route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/pdf" },
        body: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
      });
    });

    await page.goto("/sections/petitioner");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Given name").fill("Alex");
    await page.getByLabel("Family name").fill("Rivera");

    const preview = page.getByRole("button", { name: /Preview my forms/ });
    await expect(preview).toBeEnabled();
    await preview.click();

    await expect(page.getByRole("heading", { name: "Preview: Form I-130" })).toBeVisible();
    await expect(page.locator('iframe[title="I-130 preview"]')).toBeVisible();
    expect(captured?.intake?.petitioner?.familyName).toBe("Rivera");
    expect(captured?.intake?.petitioner?.givenName).toBe("Alex");
  });
});
