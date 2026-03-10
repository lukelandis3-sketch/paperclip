const ASSIGNEE_REQUIRED_STATUSES = new Set(["in_progress", "in_review"]);

export function statusRequiresAssignee(status: string | null | undefined): boolean {
  if (!status) return false;
  return ASSIGNEE_REQUIRED_STATUSES.has(status);
}
