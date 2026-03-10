type IssueLike = {
  id: string;
  assigneeAgentId?: string | null;
  createdByAgentId?: string | null;
};

const CHILD_STATUS_WAKE_SET = new Set(["done", "blocked", "cancelled"]);

export function resolveParentWakeOnChildStatusChange(input: {
  childStatus: string | null;
  statusChanged: boolean;
  parent: IssueLike | null;
}): { agentId: string; parentIssueId: string } | null {
  if (!input.statusChanged) return null;
  if (!input.childStatus || !CHILD_STATUS_WAKE_SET.has(input.childStatus)) return null;
  if (!input.parent) return null;

  const agentId = input.parent.assigneeAgentId || input.parent.createdByAgentId || null;
  if (!agentId) return null;

  return {
    agentId,
    parentIssueId: input.parent.id,
  };
}
