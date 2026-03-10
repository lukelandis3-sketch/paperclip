type ShouldWakeAssigneeOnIssueUpdateCommentInput = {
  assigneeAgentId: string | null;
  actorType: "agent" | "user" | "board";
  actorAgentId: string | null;
  issueStatus: string | null;
};

export function shouldWakeAssigneeOnIssueUpdateComment(
  input: ShouldWakeAssigneeOnIssueUpdateCommentInput,
): boolean {
  if (!input.assigneeAgentId) return false;
  if (input.issueStatus === "done" || input.issueStatus === "cancelled") return false;
  if (input.actorType === "agent" && input.actorAgentId === input.assigneeAgentId) return false;
  return true;
}
