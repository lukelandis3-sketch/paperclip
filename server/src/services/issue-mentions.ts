import { normalizeAgentUrlKey } from "@paperclipai/shared";

interface MentionableAgent {
  name: string;
  title?: string | null;
}

function normalizeMentionToken(raw: string): string | null {
  const trimmed = raw
    .trim()
    .replace(/^[([{]+/g, "")
    .replace(/[)\]}:;,.!?]+$/g, "")
    .toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function compactMentionKey(value: string | null | undefined): string | null {
  const slug = normalizeAgentUrlKey(value);
  if (!slug) return null;
  const compact = slug.replace(/-/g, "");
  return compact.length > 0 ? compact : null;
}

export function extractMentionTokens(body: string): string[] {
  const re = /\B@([^\s@]+)/g;
  const tokens = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const normalized = normalizeMentionToken(match[1]);
    if (normalized) tokens.add(normalized);
  }
  return [...tokens];
}

export function buildAgentMentionKeys(agent: MentionableAgent): Set<string> {
  const keys = new Set<string>();
  const rawName = agent.name.trim().toLowerCase();
  if (rawName.length > 0) keys.add(rawName);

  const nameSlug = normalizeAgentUrlKey(agent.name);
  if (nameSlug) keys.add(nameSlug);

  const nameCompact = compactMentionKey(agent.name);
  if (nameCompact) keys.add(nameCompact);

  const titleSlug = normalizeAgentUrlKey(agent.title);
  if (titleSlug) keys.add(titleSlug);

  const titleCompact = compactMentionKey(agent.title);
  if (titleCompact) keys.add(titleCompact);

  return keys;
}

export function resolveMentionedAgentIds<T extends MentionableAgent & { id: string; status?: string | null }>(
  agents: T[],
  body: string,
): string[] {
  const tokens = new Set(extractMentionTokens(body));
  if (tokens.size === 0) return [];
  return agents
    .filter((agent) => agent.status !== "terminated")
    .filter((agent) => {
      const keys = buildAgentMentionKeys(agent);
      return [...tokens].some((token) => keys.has(token));
    })
    .map((agent) => agent.id);
}
