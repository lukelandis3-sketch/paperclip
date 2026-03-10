import { describe, expect, it } from "vitest";
import {
  isEvergreenReviewControllerTitle,
  isManagerLikeAgent,
  isProcessControlTitle,
  normalizeIssueTitleFingerprint,
} from "../routes/issue-create-guards.js";

describe("issue create guards", () => {
  it("normalizes title fingerprints across punctuation and embedded issue ids", () => {
    expect(normalizeIssueTitleFingerprint("UNBLOCK-LIE-100-A — Fix page export failures"))
      .toBe("unblock fix page export failures");
  });

  it("detects process-control titles", () => {
    expect(isProcessControlTitle("AUTO-STALL-10 — Management-agent bootstrap stall detector")).toBe(true);
    expect(isProcessControlTitle("UNBLOCK-LIE-91 — Clear stale execution lock")).toBe(true);
    expect(isProcessControlTitle("P6-01 - Lead and company model")).toBe(false);
  });

  it("detects evergreen review controllers", () => {
    expect(isEvergreenReviewControllerTitle("M2-REVIEW-01 — mandatory review gate for all M2 engineering tickets")).toBe(true);
    expect(isEvergreenReviewControllerTitle("Review concrete fix for P6-01")).toBe(false);
  });

  it("treats manager-like roles and canCreateAgents grants as manager actors", () => {
    expect(isManagerLikeAgent({ role: "general", permissions: null })).toBe(true);
    expect(isManagerLikeAgent({ role: "engineer", permissions: { canCreateAgents: true } })).toBe(true);
    expect(isManagerLikeAgent({ role: "engineer", permissions: { canCreateAgents: false } })).toBe(false);
  });
});
