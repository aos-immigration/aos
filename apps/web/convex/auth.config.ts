import type { AuthConfig } from "convex/server";

export default {
  providers: [
    {
      // Set on the Convex deployment, not in Next.js.
      // Clerk Dashboard → Configure → Integrations → Convex → Frontend API URL.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
