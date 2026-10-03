export type PrivacyLevel = "allow" | "mask-user-input" | "mask";

export function sessionReplayCanRecordText(
  sessionReplaySampleRate: number,
  defaultPrivacyLevel: PrivacyLevel,
): boolean {
  if (sessionReplaySampleRate <= 0) {
    return false;
  }
  return defaultPrivacyLevel !== "mask";
}

export const rumPrivacy = {
  sessionReplaySampleRate: 0,
  defaultPrivacyLevel: "mask" as const,
};

export function replayRecordsVisibleText(): boolean {
  return sessionReplayCanRecordText(
    rumPrivacy.sessionReplaySampleRate,
    rumPrivacy.defaultPrivacyLevel,
  );
}
