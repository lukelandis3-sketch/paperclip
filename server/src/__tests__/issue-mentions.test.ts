import { describe, expect, it } from "vitest";
import { buildAgentMentionKeys, extractMentionTokens, resolveMentionedAgentIds } from "../services/issue-mentions.js";

describe("issue mention helpers", () => {
  it("strips common trailing punctuation from mention tokens", () => {
    expect(extractMentionTokens("@EngineeringManager: please coordinate with @Reviewer.)")).toEqual([
      "engineeringmanager",
      "reviewer",
    ]);
  });

  it("builds name, slug, and compact title aliases", () => {
    const keys = buildAgentMentionKeys({
      name: "Reviewer",
      title: "Reviewer / QA Lead",
    });
    expect(keys.has("reviewer")).toBe(true);
    expect(keys.has("reviewer-qa-lead")).toBe(true);
    expect(keys.has("reviewerqalead")).toBe(true);
  });

  it("resolves mentions against exact names and compact aliases", () => {
    const ids = resolveMentionedAgentIds(
      [
        { id: "a", name: "EngineeringManager", title: "Engineering Manager", status: "idle" },
        { id: "b", name: "Reviewer", title: "Reviewer / QA Lead", status: "idle" },
        { id: "c", name: "LegacyReviewer", title: "Legacy Reviewer", status: "terminated" },
      ],
      "@EngineeringManager: sync with @ReviewerQALead and ignore @LegacyReviewer.",
    );
    expect(ids).toEqual(["a", "b"]);
  });
});
