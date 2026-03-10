type AgentLike = {
  id: string;
  name?: string | null;
  title?: string | null;
  role?: string | null;
};

type ReviewHandoffInput = {
  actorType: "agent" | "board" | "user" | "none";
  actorAgentId: string | null;
  existingAssigneeAgentId: string | null;
  nextStatus: string | null;
  nextAssigneeAgentId: string | null;
  nextAssigneeUserId: string | null;
  targetAgent: AgentLike | null;
};

export function isAgentSelfReviewHandoff(input: ReviewHandoffInput): boolean {
  if (input.actorType !== "agent") return false;
  if (!input.actorAgentId) return false;
  if (input.existingAssigneeAgentId !== input.actorAgentId) return false;
  if (input.nextStatus !== "in_review") return false;
  if (!input.nextAssigneeAgentId || input.nextAssigneeUserId) return false;
  if (!input.targetAgent || input.targetAgent.id !== input.nextAssigneeAgentId) return false;

  const titleOrName = `${input.targetAgent.title ?? ""} ${input.targetAgent.name ?? ""}`.toLowerCase();
  return input.targetAgent.role === "qa" || titleOrName.includes("review");
}
