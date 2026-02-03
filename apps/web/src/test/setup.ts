// Mock crypto.randomUUID for tests
if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () => `test-${Math.random().toString(36).slice(2)}`,
    },
  });
}
