import { describe, expect, it } from "vitest";
import { replayRecordsVisibleText, sessionReplayCanRecordText } from "../rumPrivacy";

describe("session replay privacy", () => {
  it("records visible text only when replay is sampled and text is not masked", () => {
    expect(sessionReplayCanRecordText(20, "allow")).toBe(true);
    expect(sessionReplayCanRecordText(20, "mask-user-input")).toBe(true);
    expect(sessionReplayCanRecordText(20, "mask")).toBe(false);
    expect(sessionReplayCanRecordText(0, "allow")).toBe(false);
  });

  it("ships a configuration that does not record visible text", () => {
    expect(replayRecordsVisibleText()).toBe(false);
  });
});
