import { execFileSync } from "node:child_process";

type AssignableAgent = {
  name?: string | null;
  role?: string | null;
  title?: string | null;
  adapterConfig?: Record<string, unknown> | null;
};

const STRICT_WORKSPACE_AGENT_NAMES = new Set([
  "SoftwareEngineerA",
  "SoftwareEngineerB",
  "InfraTestEngineer",
  "Reviewer",
  "ReviewerQALead",
]);

const STRICT_WORKSPACE_ROLES = new Set(["engineer", "reviewer", "qa", "devops"]);

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function requiresCleanWorkspaceForAssignment(agent: AssignableAgent | null | undefined): boolean {
  if (!agent) return false;
  if (STRICT_WORKSPACE_AGENT_NAMES.has(readNonEmptyString(agent.name) ?? "")) return true;
  return STRICT_WORKSPACE_ROLES.has(readNonEmptyString(agent.role) ?? "");
}

export function getDirtyWorkspaceAssignmentFailure(agent: AssignableAgent | null | undefined): string | null {
  if (!requiresCleanWorkspaceForAssignment(agent)) return null;
  const cwd = readNonEmptyString(agent?.adapterConfig?.cwd);
  if (!cwd) return null;

  let statusOutput = "";
  try {
    statusOutput = execFileSync("git", ["-C", cwd, "status", "--short", "--untracked-files=all"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 4000,
    }).trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Target workspace "${cwd}" could not be verified clean before assignment: ${message}`;
  }

  if (!statusOutput) return null;

  const lines = statusOutput.split("\n").filter((line) => line.trim().length > 0);
  const preview = lines.slice(0, 5).join("; ");
  const suffix = lines.length > 5 ? " ..." : "";
  return `Target workspace "${cwd}" is dirty and cannot accept a new assignment (${lines.length} path(s): ${preview}${suffix})`;
}
