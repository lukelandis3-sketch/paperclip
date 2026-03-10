import { describe, expect, it } from "vitest";
import {
  getEngineerReviewEvidenceFailure,
  requiresEngineerReviewEvidence,
} from "../routes/issue-review-evidence.js";

describe("issue review evidence guard", () => {
  const baseInput = {
    actorType: "agent" as const,
    actorAgentId: "se-a",
    actorAgent: { id: "se-a", role: "engineer" },
    existingAssigneeAgentId: "se-a",
    nextStatus: "in_review",
  };

  it("applies only to owning engineers moving work to in_review", () => {
    expect(requiresEngineerReviewEvidence(baseInput)).toBe(true);
    expect(
      requiresEngineerReviewEvidence({
        ...baseInput,
        actorAgent: { id: "reviewer", role: "qa" },
      }),
    ).toBe(false);
    expect(
      requiresEngineerReviewEvidence({
        ...baseInput,
        nextStatus: "in_progress",
      }),
    ).toBe(false);
  });

  it("rejects engineer handoff without a comment", () => {
    expect(
      getEngineerReviewEvidenceFailure({
        ...baseInput,
        commentBody: null,
      }),
    ).toMatch(/requires a comment/i);
  });

  it("rejects local-only handoff comments", () => {
    expect(
      getEngineerReviewEvidenceFailure({
        ...baseInput,
        commentBody: "Files changed and present in this workspace, still local. Validation passed.",
      }),
    ).toMatch(/cannot claim local-only or uncommitted changes/i);
  });

  it("rejects handoffs that omit commit evidence", () => {
    expect(
      getEngineerReviewEvidenceFailure({
        ...baseInput,
        commentBody: "Implemented the slice and tests passed. Ready for review.",
      }),
    ).toMatch(/requires commit evidence/i);
  });

  it("accepts handoffs that include commit evidence", () => {
    expect(
      getEngineerReviewEvidenceFailure({
        ...baseInput,
        commentBody:
          "## Update\n- Files changed: `a.ts`, `b.ts`\n- Commit SHA: `1a2b3c4`\n- Validation passed: `npm test`\n- git show --name-only --oneline 1a2b3c4",
      }),
    ).toBeNull();
  });
});
