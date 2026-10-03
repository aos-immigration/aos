import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicDemoBanner } from "@/components/PublicDemoBanner";
import { isPublicDemo } from "../demoPolicy";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public demo flag", () => {
  it("is off unless NEXT_PUBLIC_DEMO_ONLY or DEMO_ONLY is 1", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ONLY", "");
    vi.stubEnv("DEMO_ONLY", "");
    expect(isPublicDemo()).toBe(false);
    expect(renderToStaticMarkup(<PublicDemoBanner />)).toBe("");

    vi.stubEnv("NEXT_PUBLIC_DEMO_ONLY", "1");
    expect(isPublicDemo()).toBe(true);
    const html = renderToStaticMarkup(<PublicDemoBanner />);
    expect(html).toContain("Demo, fictional data only, don&#x27;t enter real information.");
    expect(html).toContain("Jordan Sampleton");
    expect(html).toContain("Avery Exampleton");

    vi.stubEnv("NEXT_PUBLIC_DEMO_ONLY", "");
    vi.stubEnv("DEMO_ONLY", "1");
    expect(isPublicDemo()).toBe(true);
  });
});
