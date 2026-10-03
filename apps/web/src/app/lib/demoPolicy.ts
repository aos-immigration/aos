export function isPublicDemo(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_ONLY === "1" || process.env.DEMO_ONLY === "1";
}
