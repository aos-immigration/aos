import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

const authMock = vi.mocked(auth);

function callFill(body = "{}") {
  return POST(new Request("http://localhost/api/fill/i-130", { method: "POST", body }), {
    params: Promise.resolve({ slug: "i-130" }),
  });
}

describe("POST /api/fill/[slug]", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rejects a signed-out caller", async () => {
    authMock.mockResolvedValue({ userId: null } as never);
    const response = await callFill();
    expect(response.status).toBe(401);
  });

  it("refuses to call the PDF service without a shared secret", async () => {
    authMock.mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("PDF_FILL_SECRET", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await callFill();
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the shared secret for a signed-in caller", async () => {
    authMock.mockResolvedValue({ userId: "user_123" } as never);
    vi.stubEnv("PDF_FILL_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("%PDF", {
        status: 200,
        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="i-130-filled.pdf"' },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await callFill(
      JSON.stringify({
        fields: {
          "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": "Lovelace",
          "form1[0].#subform[0].Pt2Line11_SSN[0]": "123-45-6789",
        },
        checkboxes: {},
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    const forwardedBody = fetchMock.mock.calls[0]?.[1]?.body;
    const forwarded = JSON.parse(String(forwardedBody)) as {
      fields: Record<string, string>;
    };
    expect(forwarded.fields["form1[0].#subform[0].Pt2Line11_SSN[0]"]).toBe("");
    expect(forwarded.fields["form1[0].#subform[0].Pt2Line4a_FamilyName[0]"]).toBe("Lovelace");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/fill/i-130",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Fill-Secret": "test-secret" }),
      }),
    );
  });

  it("lets the demo cookie through and still strips an SSN", async () => {
    authMock.mockResolvedValue({ userId: null } as never);
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === "aos_demo" ? { value: "1" } : undefined),
    } as never);
    vi.stubEnv("PDF_FILL_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue(new Response("%PDF", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await callFill(
      JSON.stringify({ fields: { sample: "A123456789" }, checkboxes: {} }),
    );
    expect(response.status).toBe(200);
    const forwardedBody = fetchMock.mock.calls[0]?.[1]?.body;
    const forwarded = JSON.parse(String(forwardedBody)) as {
      fields: Record<string, string>;
    };
    expect(forwarded.fields.sample).toBe("");
  });
});
