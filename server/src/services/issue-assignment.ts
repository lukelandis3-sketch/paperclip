export interface IssueAssignmentSnapshot {
  status: string;
  assigneeAgentId: string | null;
  assigneeUserId: string | null;
  executionRunId: string | null;
  executionAgentNameKey: string | null;
}

export interface IssueAssignmentAgentSummary {
  id: string;
  status: string;
}

export function deriveIssueAssignmentAnomalies(
  issue: IssueAssignmentSnapshot,
  assigneeAgent: IssueAssignmentAgentSummary | null,
): string[] {
  const anomalies: string[] = [];
  if (issue.status === "in_progress" && !issue.assigneeAgentId && !issue.assigneeUserId) {
    anomalies.push("in_progress_without_assignee");
  }
  if (issue.executionRunId && !issue.assigneeAgentId) {
    anomalies.push("execution_run_without_assignee_agent");
  }
  if (issue.executionRunId && !issue.executionAgentNameKey) {
    anomalies.push("execution_run_missing_agent_name_key");
  }
  if (issue.assigneeAgentId && !assigneeAgent) {
    anomalies.push("assignee_agent_missing");
  }
  if (
    issue.assigneeAgentId &&
    assigneeAgent &&
    assigneeAgent.status === "paused" &&
    !["done", "cancelled", "backlog"].includes(issue.status)
  ) {
    anomalies.push("assigned_to_paused_agent");
  }
  return anomalies;
}
