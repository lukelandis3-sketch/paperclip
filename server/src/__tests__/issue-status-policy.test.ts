import { describe, expect, it } from "vitest";
import { statusRequiresAssignee } from "../services/issue-status-policy.js";

describe("issue status assignee policy", () => {
  it("requires an assignee for in_progress and in_review", () => {
    expect(statusRequiresAssignee("in_progress")).toBe(true);
    expect(statusRequiresAssignee("in_review")).toBe(true);
  });

  it("does not require an assignee for backlog-like terminal states", () => {
    expect(statusRequiresAssignee("backlog")).toBe(false);
    expect(statusRequiresAssignee("todo")).toBe(false);
    expect(statusRequiresAssignee("blocked")).toBe(false);
    expect(statusRequiresAssignee("done")).toBe(false);
    expect(statusRequiresAssignee("cancelled")).toBe(false);
  });
});
