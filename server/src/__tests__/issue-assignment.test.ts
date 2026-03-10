import { describe, expect, it } from "vitest";
import { deriveIssueAssignmentAnomalies } from "../services/issue-assignment.js";

describe("deriveIssueAssignmentAnomalies", () => {
  it("flags active execution without assignee agent or name key", () => {
    expect(
      deriveIssueAssignmentAnomalies(
        {
          status: "in_progress",
          assigneeAgentId: null,
          assigneeUserId: null,
          executionRunId: "run-1",
          executionAgentNameKey: null,
        },
        null,
      ),
    ).toEqual([
      "in_progress_without_assignee",
      "execution_run_without_assignee_agent",
      "execution_run_missing_agent_name_key",
    ]);
  });

  it("flags paused-agent ownership but not healthy assigned work", () => {
    expect(
      deriveIssueAssignmentAnomalies(
        {
          status: "blocked",
          assigneeAgentId: "agent-1",
          assigneeUserId: null,
          executionRunId: null,
          executionAgentNameKey: null,
        },
        { id: "agent-1", status: "paused" },
      ),
    ).toEqual(["assigned_to_paused_agent"]);
  });
});
