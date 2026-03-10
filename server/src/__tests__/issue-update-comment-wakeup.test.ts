import { describe, expect, it } from "vitest";
import {
  mergeIssueUpdateCommentIntoWakeup,
  shouldWakeAssigneeOnIssueUpdateComment,
} from "../routes/issue-update-comment-wakeup.js";

describe("shouldWakeAssigneeOnIssueUpdateComment", () => {
  it("wakes the assignee for non-self comments on open issues", () => {
    expect(
      shouldWakeAssigneeOnIssueUpdateComment({
        assigneeAgentId: "agent-1",
        actorType: "agent",
        actorAgentId: "agent-2",
        issueStatus: "blocked",
      }),
    ).toBe(true);
  });

  it("skips self-comments from the assignee", () => {
    expect(
      shouldWakeAssigneeOnIssueUpdateComment({
        assigneeAgentId: "agent-1",
        actorType: "agent",
        actorAgentId: "agent-1",
        issueStatus: "in_progress",
      }),
    ).toBe(false);
  });

  it("skips closed issues", () => {
    expect(
      shouldWakeAssigneeOnIssueUpdateComment({
        assigneeAgentId: "agent-1",
        actorType: "board",
        actorAgentId: null,
        issueStatus: "done",
      }),
    ).toBe(false);
  });

  it("skips when there is no assignee", () => {
    expect(
      shouldWakeAssigneeOnIssueUpdateComment({
        assigneeAgentId: null,
        actorType: "board",
        actorAgentId: null,
        issueStatus: "todo",
      }),
    ).toBe(false);
  });

  it("merges comment context into an existing assignee wakeup", () => {
    const merged = mergeIssueUpdateCommentIntoWakeup(
      {
        reason: "issue_assigned",
        payload: { issueId: "issue-1", mutation: "update" },
        contextSnapshot: { issueId: "issue-1", source: "issue.update" },
      },
      {
        issueId: "issue-1",
        commentId: "comment-1",
        commentBody: "Please reconcile the reviewer note.",
        issueStatus: "todo",
        source: "issue.update.assignment_comment",
      },
    );

    expect(merged.payload).toMatchObject({
      issueId: "issue-1",
      mutation: "update",
      commentId: "comment-1",
      commentBody: "Please reconcile the reviewer note.",
    });
    expect(merged.contextSnapshot).toMatchObject({
      issueId: "issue-1",
      taskId: "issue-1",
      commentId: "comment-1",
      wakeCommentId: "comment-1",
      commentBody: "Please reconcile the reviewer note.",
      issueStatus: "todo",
      source: "issue.update.assignment_comment",
    });
  });
});
