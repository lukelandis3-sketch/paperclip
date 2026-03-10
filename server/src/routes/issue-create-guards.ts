const MANAGER_LIKE_ROLES = new Set(["ceo", "general", "pm", "cto", "devops"]);

const PROCESS_CONTROL_PATTERNS = [
  /^auto-\d+/i,
  /^auto-stall/i,
  /^unblock\b/i,
  /\bwatchdog\b/i,
  /\bdetector\b/i,
  /\bno[- ]?op\b/i,
  /\bcontrol[- ]?loop\b/i,
  /\bcontroller\b/i,
  /\bburst throttle\b/i,
  /\bheartbeat dedup\b/i,
  /\breview gate\b/i,
];

export function normalizeIssueTitleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .replace(/\blie-\d+-[a-z0-9]+\b/g, " ")
    .replace(/\b[a-z]{2,6}-\d+(?:-[a-z0-9]+)?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isProcessControlTitle(title: string): boolean {
  return PROCESS_CONTROL_PATTERNS.some((pattern) => pattern.test(title));
}

export function isEvergreenReviewControllerTitle(title: string): boolean {
  return /^m\d+-review-\d+/i.test(title) || /\bmandatory review gate\b/i.test(title);
}

export function isManagerLikeAgent(actorAgent: {
  role: string;
  permissions?: Record<string, unknown> | null;
}): boolean {
  if (MANAGER_LIKE_ROLES.has(actorAgent.role)) return true;
  if (!actorAgent.permissions || typeof actorAgent.permissions !== "object") return false;
  return Boolean((actorAgent.permissions as Record<string, unknown>).canCreateAgents);
}
