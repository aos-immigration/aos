import { test, expect } from "@playwright/test";

const TINY_JPEG =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6VooooA//2Q==";

test.describe("Preview", () => {
  test("shows page images and keeps the PDF behind the acknowledgements", async ({ page }) => {
    const captured: { acknowledged?: boolean; intake?: { petitioner?: { familyName?: string } } } = {};

    await page.route("**/preview-intake", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          forms: [{ slug: "i-130", title: "Form I-130", pages: [TINY_JPEG] }],
          notes: [],
        }),
      });
    });
    await page.route("**/packet", async (route) => {
      Object.assign(captured, route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/zip" },
        body: Buffer.from("PK"),
      });
    });

    await page.goto("/sections/petitioner");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Given name").fill("Alex");
    await page.getByLabel("Family name").fill("Rivera");

    await expect(page.getByRole("link", { name: "Download my forms (PDF)" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Download my forms (PDF)" })).toHaveCount(0);

    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.getByRole("heading", { name: "Before you download" })).toBeVisible();
    await expect(page.getByText("AOS did not review them for legal accuracy.")).toBeVisible();
    await expect(page.getByRole("img", { name: "Form I-130 page 1" })).toBeVisible();
    await expect(page.locator("iframe")).toHaveCount(0);

    const download = page.getByRole("button", { name: "Download my forms (PDF)" });
    await expect(download).toBeDisabled();
    const boxes = page.getByRole("dialog").getByRole("checkbox");
    await expect(boxes).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      await boxes.nth(index).check();
    }
    await expect(download).toBeEnabled();
    await download.click();
    await expect.poll(() => captured.acknowledged).toBe(true);
    expect(captured.intake?.petitioner?.familyName).toBe("Rivera");
  });
});
