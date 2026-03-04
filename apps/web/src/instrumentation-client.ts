import * as Sentry from "@sentry/nextjs";
import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";
import { datadogLogs } from "@datadog/browser-logs";

// ── Sentry ──────────────────────────────────────────────
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: false,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// ── Datadog RUM ─────────────────────────────────────────
datadogRum.init({
    applicationId: "4f21fd8b-4a01-4234-85f1-bfd17a2766a9",
    clientToken: "pubc4ab71f67047b2b985731299e8e82664",
    site: "us5.datadoghq.com",
    service: "aos-web",
    env: process.env.NODE_ENV || "development",
    version: "0.1.0",
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackResources: true,
    trackUserInteractions: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
});

// ── Datadog Browser Logs ────────────────────────────────
datadogLogs.init({
    clientToken: "pubc4ab71f67047b2b985731299e8e82664",
    site: "us5.datadoghq.com",
    service: "aos-web",
    env: process.env.NODE_ENV || "development",
    version: "0.1.0",
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ["error", "warn", "info"],
    forwardReports: "all",
    sessionSampleRate: 100,
});
