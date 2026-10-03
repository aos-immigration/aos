import { datadogRum } from "@datadog/browser-rum";
import { reactPlugin } from "@datadog/browser-rum-react";
import { datadogLogs } from "@datadog/browser-logs";
import { rumPrivacy } from "./app/lib/rumPrivacy";
import { redactUnknown } from "./lib/redactTelemetry";

datadogRum.init({
  applicationId: "4f21fd8b-4a01-4234-85f1-bfd17a2766a9",
  clientToken: "pubc4ab71f67047b2b985731299e8e82664",
  site: "us5.datadoghq.com",
  service: "aos-web",
  env: process.env.NODE_ENV || "development",
  version: "0.1.0",
  sessionSampleRate: 100,
  sessionReplaySampleRate: rumPrivacy.sessionReplaySampleRate,
  defaultPrivacyLevel: rumPrivacy.defaultPrivacyLevel,
  trackResources: true,
  trackUserInteractions: false,
  trackLongTasks: true,
  plugins: [reactPlugin({ router: false })],
  beforeSend: (event) => {
    Object.assign(event, redactUnknown(event) as typeof event);
    return true;
  },
});

datadogLogs.init({
  clientToken: "pubc4ab71f67047b2b985731299e8e82664",
  site: "us5.datadoghq.com",
  service: "aos-web",
  env: process.env.NODE_ENV || "development",
  version: "0.1.0",
  forwardErrorsToLogs: true,
  forwardConsoleLogs: ["error"],
  forwardReports: "all",
  sessionSampleRate: 100,
  beforeSend: (event) => {
    Object.assign(event, redactUnknown(event) as typeof event);
    return true;
  },
});
