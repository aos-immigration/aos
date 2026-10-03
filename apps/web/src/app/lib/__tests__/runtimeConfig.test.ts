import { describe, expect, it, vi } from "vitest";
import { DEV_FILL_SECRET, fillSecret, unconfiguredGate } from "../runtimeConfig";

describe("unconfigured gate", () => {
  it("lets the demo couple through and stops real intake", () => {
    expect(unconfiguredGate("/", false)).toBe("allow");
    expect(unconfiguredGate("/demo", false)).toBe("allow");
    expect(unconfiguredGate("/sections/petitioner", true)).toBe("allow");
    expect(unconfiguredGate("/sections", false)).toBe("allow");
    expect(unconfiguredGate("/start", false)).toBe("allow");
    expect(unconfiguredGate("/forms/i-130/petitioner", false)).toBe("allow");
    expect(unconfiguredGate("/account", false)).toBe("auth-required");
    expect(unconfiguredGate("/sign-in", false)).toBe("auth-required");
    expect(unconfiguredGate("/api/preview-intake", false)).toBe("allow");
    expect(unconfiguredGate("/api/packet", false)).toBe("allow");
    expect(unconfiguredGate("/api/fill/i-130", false)).toBe("allow");
  });
});

describe("fill secret", () => {
  it("uses the local default outside production and refuses it in production", () => {
    vi.stubEnv("PDF_FILL_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(fillSecret()).toBe(DEV_FILL_SECRET);
    vi.stubEnv("NODE_ENV", "production");
    expect(fillSecret()).toBeUndefined();
    vi.stubEnv("PDF_FILL_SECRET", "explicit");
    expect(fillSecret()).toBe("explicit");
    vi.unstubAllEnvs();
  });
});
