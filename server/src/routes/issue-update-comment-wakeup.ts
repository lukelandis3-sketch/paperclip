type ShouldWakeAssigneeOnIssueUpdateCommentInput = {
  assigneeAgentId: string | null;
  actorType: "agent" | "user" | "board";
  actorAgentId: string | null;
  issueStatus: string | null;
};

type IssueWakeupLike = {
  payload?: Record<string, unknown> | null;
  contextSnapshot?: Record<string, unknown>;
};

export function shouldWakeAssigneeOnIssueUpdateComment(
  input: ShouldWakeAssigneeOnIssueUpdateCommentInput,
): boolean {
  if (!input.assigneeAgentId) return false;
  if (input.issueStatus === "done" || input.issueStatus === "cancelled") return false;
  if (input.actorType === "agent" && input.actorAgentId === input.assigneeAgentId) return false;
  return true;
}

export function mergeIssueUpdateCommentIntoWakeup<T extends IssueWakeupLike>(
  wakeup: T,
  input: {
    issueId: string;
    commentId: string;
    commentBody: string;
    issueStatus: string | null;
    source: string;
  },
): T {
  const payload = {
    ...(wakeup.payload ?? {}),
    issueId: input.issueId,
    commentId: input.commentId,
    commentBody: input.commentBody,
  };
  const contextSnapshot = {
    ...(wakeup.contextSnapshot ?? {}),
    issueId: input.issueId,
    taskId:
      (typeof wakeup.contextSnapshot?.taskId === "string" && wakeup.contextSnapshot.taskId) ||
      input.issueId,
    commentId: input.commentId,
    wakeCommentId: input.commentId,
    commentBody: input.commentBody,
    issueStatus: input.issueStatus,
    source: input.source,
  };
  return {
    ...wakeup,
    payload,
    contextSnapshot,
  };
}
