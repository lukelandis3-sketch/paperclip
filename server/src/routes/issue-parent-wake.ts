type IssueLike = {
  id: string;
  assigneeAgentId?: string | null;
};

const CHILD_STATUS_WAKE_SET = new Set(["done", "blocked", "cancelled"]);

export function resolveParentWakeOnChildStatusChange(input: {
  childStatus: string | null;
  previousChildStatus?: string | null;
  statusChanged: boolean;
  parent: IssueLike | null;
}): { agentId: string; parentIssueId: string } | null {
  if (!input.statusChanged) return null;
  const isTerminalWake = Boolean(input.childStatus && CHILD_STATUS_WAKE_SET.has(input.childStatus));
  const isReviewReturnWake =
    input.childStatus === "todo" &&
    input.previousChildStatus === "in_review";
  if (!isTerminalWake && !isReviewReturnWake) return null;
  if (!input.parent) return null;

  const agentId = input.parent.assigneeAgentId || null;
  if (!agentId) return null;

  return {
    agentId,
    parentIssueId: input.parent.id,
  };
}
