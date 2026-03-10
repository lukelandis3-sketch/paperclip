import { Command } from "commander";
import type { ActivityEvent } from "@paperclipai/shared";
import {
  addCommonClientOptions,
  formatInlineRecord,
  handleCommandError,
  printOutput,
  resolveCommandContext,
  resolveAuthenticatedAgentIdentity,
  type BaseClientOptions,
} from "./common.js";

interface ActivityListOptions extends BaseClientOptions {
  companyId?: string;
  agentId?: string;
  entityType?: string;
  entityId?: string;
}

export function registerActivityCommands(program: Command): void {
  const activity = program.command("activity").description("Activity log operations");

  addCommonClientOptions(
    activity
      .command("list")
      .description("List company activity log entries")
      .option("-C, --company-id <id>", "Company ID")
      .option("--agent-id <id>", "Filter by agent ID")
      .option("--entity-type <type>", "Filter by entity type")
      .option("--entity-id <id>", "Filter by entity ID")
      .action(async (opts: ActivityListOptions) => {
        try {
          const ctx = resolveCommandContext(opts, { requireCompany: false });
          const authedAgent = ctx.companyId ? null : await resolveAuthenticatedAgentIdentity(ctx.api);
          const companyId = ctx.companyId ?? authedAgent?.companyId;
          if (!companyId) {
            throw new Error(
              "Company ID is required. Pass --company-id, set PAPERCLIP_COMPANY_ID, set context profile companyId, or use an agent-authenticated API key.",
            );
          }
          const params = new URLSearchParams();
          if (opts.agentId) params.set("agentId", opts.agentId);
          if (opts.entityType) params.set("entityType", opts.entityType);
          if (opts.entityId) params.set("entityId", opts.entityId);

          const query = params.toString();
          const path = `/api/companies/${companyId}/activity${query ? `?${query}` : ""}`;
          const rows = (await ctx.api.get<ActivityEvent[]>(path)) ?? [];

          if (ctx.json) {
            printOutput(rows, { json: true });
            return;
          }

          if (rows.length === 0) {
            printOutput([], { json: false });
            return;
          }

          for (const row of rows) {
            console.log(
              formatInlineRecord({
                id: row.id,
                action: row.action,
                actorType: row.actorType,
                actorId: row.actorId,
                entityType: row.entityType,
                entityId: row.entityId,
                createdAt: String(row.createdAt),
              }),
            );
          }
        } catch (err) {
          handleCommandError(err);
        }
      }),
    { includeCompany: false },
  );
}
