type AgentLike = {
  id: string;
  name?: string | null;
  title?: string | null;
  role?: string | null;
};

function looksLikeReviewAgent(agent: AgentLike | null | undefined): boolean {
  if (!agent) return false;
  const titleOrName = `${agent.title ?? ""} ${agent.name ?? ""}`.toLowerCase();
  return agent.role === "qa" || titleOrName.includes("review");
}

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

  return looksLikeReviewAgent(input.targetAgent);
}

type RejectReturnInput = {
  actorType: "agent" | "board" | "user" | "none";
  actorAgentId: string | null;
  existingStatus: string | null;
  existingAssigneeAgentId: string | null;
  nextStatus: string | null;
  nextAssigneeAgentId: string | null;
  nextAssigneeUserId: string | null;
  actorAgent: AgentLike | null;
  targetAgent: AgentLike | null;
  creatorAgentId: string | null;
};

export function isReviewerRejectReturn(input: RejectReturnInput): boolean {
  if (input.actorType !== "agent") return false;
  if (!input.actorAgentId) return false;
  if (input.existingStatus !== "in_review") return false;
  if (input.existingAssigneeAgentId !== input.actorAgentId) return false;
  if (input.nextStatus !== "todo") return false;
  if (!input.nextAssigneeAgentId || input.nextAssigneeUserId) return false;
  if (input.nextAssigneeAgentId !== input.creatorAgentId) return false;
  if (!input.targetAgent || input.targetAgent.id !== input.nextAssigneeAgentId) return false;
  if (!looksLikeReviewAgent(input.actorAgent)) return false;
  return !looksLikeReviewAgent(input.targetAgent);
}
