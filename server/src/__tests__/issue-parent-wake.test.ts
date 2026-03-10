import { describe, expect, it } from "vitest";
import { resolveParentWakeOnChildStatusChange } from "../routes/issue-parent-wake.js";

describe("issue parent wake", () => {
  it("wakes the parent assignee when a child is marked done", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "done",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: "eng-mgr",
          createdByAgentId: "prog-dir",
        },
      }),
    ).toEqual({
      agentId: "eng-mgr",
      parentIssueId: "parent-1",
    });
  });

  it("falls back to the parent creator when there is no parent assignee", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "blocked",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: null,
          createdByAgentId: "eng-mgr",
        },
      }),
    ).toEqual({
      agentId: "eng-mgr",
      parentIssueId: "parent-1",
    });
  });

  it("does nothing when the child status is not a terminal handoff state", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "in_review",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: "eng-mgr",
          createdByAgentId: "prog-dir",
        },
      }),
    ).toBeNull();
  });
});
