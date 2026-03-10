type AgentLike = {
  id: string;
  role?: string | null;
};

type EngineerReviewEvidenceInput = {
  actorType: "agent" | "board" | "user" | "none";
  actorAgentId: string | null;
  actorAgent: AgentLike | null;
  existingAssigneeAgentId: string | null;
  nextStatus: string | null;
  commentBody: string | null;
};

const LOCAL_ONLY_PATTERNS = [
  /\bstill local\b/i,
  /\bnot committed\b/i,
  /\buncommitted\b/i,
  /\bmodified\/untracked\b/i,
  /\bcommit state:\s*all claimed files are still local\b/i,
];

const COMMIT_EVIDENCE_PATTERNS = [
  /\bcommit(?:\s+sha)?\s*[:#-]?\s*`?[0-9a-f]{7,40}`?/i,
  /\bsha\s*[:#-]?\s*`?[0-9a-f]{7,40}`?/i,
  /git show --name-only --oneline\s+`?[0-9a-f]{7,40}`?/i,
];

export function requiresEngineerReviewEvidence(input: EngineerReviewEvidenceInput): boolean {
  if (input.actorType !== "agent") return false;
  if (!input.actorAgentId) return false;
  if (!input.actorAgent || input.actorAgent.role !== "engineer") return false;
  if (input.existingAssigneeAgentId !== input.actorAgentId) return false;
  return input.nextStatus === "in_review";
}

export function getEngineerReviewEvidenceFailure(input: EngineerReviewEvidenceInput): string | null {
  if (!requiresEngineerReviewEvidence(input)) return null;

  const commentBody = input.commentBody?.trim() ?? "";
  if (!commentBody) {
    return "Engineer review handoff requires a comment with commit evidence before moving to in_review.";
  }

  if (LOCAL_ONLY_PATTERNS.some((pattern) => pattern.test(commentBody))) {
    return "Engineer review handoff cannot claim local-only or uncommitted changes. Commit the implementation first and include the commit SHA in the handoff comment.";
  }

  if (!COMMIT_EVIDENCE_PATTERNS.some((pattern) => pattern.test(commentBody))) {
    return "Engineer review handoff requires commit evidence in the handoff comment (for example: commit SHA or git show --name-only --oneline <sha>) before moving to in_review.";
  }

  return null;
}
