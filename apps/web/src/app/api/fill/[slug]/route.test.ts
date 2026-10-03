import { auth } from "@clerk/nextjs/server";
import { fetchAction } from "convex/nextjs";
import { cookies } from "next/headers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

vi.mock("convex/nextjs", () => ({
  fetchAction: vi.fn(),
}));

const authMock = vi.mocked(auth);
const fetchActionMock = vi.mocked(fetchAction);

function enableClerk() {
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_example");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_example");
}

function callFill(slug = "i-130", body = '{"fields":{"injected":"hostile"}}') {
  return POST(new Request(`http://localhost/api/fill/${slug}`, { method: "POST", body }), {
    params: Promise.resolve({ slug }),
  });
}

function demoCookie() {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === "aos_demo" ? { value: "1" } : undefined),
  } as never);
}

describe("POST /api/fill/[slug]", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects a signed-out caller", async () => {
    enableClerk();
    authMock.mockResolvedValue({ userId: null } as never);
    const response = await callFill();
    expect(response.status).toBe(401);
  });

  it("refuses to call the PDF service without a shared secret", async () => {
    authMock.mockResolvedValue({ userId: null } as never);
    demoCookie();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PDF_FILL_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await callFill();
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fills a signed-in caller from their Convex application and drops the body", async () => {
    enableClerk();
    authMock.mockResolvedValue({
      userId: "user_123",
      getToken: async () => "convex-token",
    } as never);
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://example.convex.cloud");
    fetchActionMock.mockResolvedValue(btoa("%PDF-owned"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await callFill(
      "i-130",
      JSON.stringify({
        fields: {
          "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": "Lovelace",
          "form1[0].#subform[0].Pt2Line11_SSN[0]": "123-45-6789",
        },
        checkboxes: {},
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("%PDF-owned");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fetchActionMock).toHaveBeenCalledWith(
      expect.anything(),
      { slug: "i-130" },
      { token: "convex-token" },
    );
  });

  it("builds the demo I-130 on the server and ignores the client body", async () => {
    authMock.mockResolvedValue({ userId: null } as never);
    demoCookie();
    vi.stubEnv("PDF_FILL_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response("%PDF", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await callFill(
      "i-130",
      JSON.stringify({
        fields: {
          "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": "Lovelace",
          "form1[0].#subform[0].Pt2Line11_SSN[0]": "123-45-6789",
          sample: "A123456789",
        },
        checkboxes: {},
      }),
    );
    expect(response.status).toBe(200);
    const forwardedBody = fetchMock.mock.calls[0]?.[1]?.body;
    const forwarded = JSON.parse(String(forwardedBody)) as {
      intake: { petitioner: { familyName: string; givenName: string } };
      acknowledged: boolean;
    };
    expect(forwarded.acknowledged).toBe(true);
    expect(forwarded.intake.petitioner.familyName).toBe("Sampleton");
    expect(forwarded.intake.petitioner.givenName).toBe("Jordan");
    expect(JSON.stringify(forwarded)).not.toContain("Lovelace");
    expect(JSON.stringify(forwarded)).not.toContain("123-45-6789");
    expect(JSON.stringify(forwarded)).not.toContain("A123456789");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/fill-intake/i-130",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Fill-Secret": "test-secret",
          "X-Fill-Caller": "demo",
        }),
      }),
    );
  });

  it("returns the service 404 for an unmapped slug and still ignores the body", async () => {
    authMock.mockResolvedValue({ userId: null } as never);
    demoCookie();
    vi.stubEnv("PDF_FILL_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await callFill("g-1145", '{"intake":{"petitioner":{"ssn":"123-45-6789"}}}');
    expect(response.status).toBe(404);
    const forwarded = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      intake: { petitioner: { familyName: string; ssn: string } };
    };
    expect(forwarded.intake.petitioner.familyName).toBe("Sampleton");
    expect(forwarded.intake.petitioner.ssn).not.toBe("123-45-6789");
  });
});
