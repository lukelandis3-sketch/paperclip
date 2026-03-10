import { describe, expect, it } from "vitest";
import { resolveParentWakeOnChildStatusChange } from "../routes/issue-parent-wake.js";

describe("issue parent wake", () => {
  it("wakes the parent assignee when a child is marked done", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "done",
        previousChildStatus: "in_review",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: "eng-mgr",
        },
      }),
    ).toEqual({
      agentId: "eng-mgr",
      parentIssueId: "parent-1",
    });
  });

  it("does nothing when the parent has no assignee", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "blocked",
        previousChildStatus: "in_progress",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: null,
        },
      }),
    ).toBeNull();
  });

  it("wakes the parent assignee when review returns a child to todo", () => {
    expect(
      resolveParentWakeOnChildStatusChange({
        childStatus: "todo",
        previousChildStatus: "in_review",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: "eng-mgr",
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
        previousChildStatus: "in_progress",
        statusChanged: true,
        parent: {
          id: "parent-1",
          assigneeAgentId: "eng-mgr",
        },
      }),
    ).toBeNull();
  });
});
