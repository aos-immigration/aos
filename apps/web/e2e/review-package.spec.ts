import { test, expect } from "@playwright/test";

test.describe("Verify and preview", () => {
  test("uses current draft data and opens PDF preview modal", async ({ page }) => {
    let capturedPayload: unknown = null;

    await page.route("**/fill/i-130", async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "application/pdf",
        },
        body: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
      });
    });

    await page.goto("/sections/petitioner");

    await page.evaluate(() => {
      window.sessionStorage.setItem(
        "aos.reviewDraft.petitionerBasics",
        JSON.stringify({
          givenName: "Alex",
          middleName: "Q",
          familyName: "Rivera",
          relationship: "spouse",
          dateOfBirth: {
            month: "01",
            day: "10",
            year: "1990",
          },
        }),
      );
    });

    const verifyButton = page.getByRole("button", {
      name: /Verify & Preview|Review Package/,
    });
    await expect(verifyButton).toBeEnabled();
    await verifyButton.click();

    await expect(page.getByRole("heading", { name: "PDF preview" })).toBeVisible();
    await expect(page.locator('iframe[title="I-130 preview"]')).toBeVisible();

    const payload = capturedPayload as {
      fields?: Record<string, string>;
    } | null;
    expect(payload?.fields?.["form1[0].#subform[0].Pt2Line4a_FamilyName[0]"]).toBe(
      "Rivera",
    );
    expect(payload?.fields?.["form1[0].#subform[0].Pt2Line4b_GivenName[0]"]).toBe(
      "Alex",
    );
  });
});
