import { describe, expect, it } from "vitest";
import {
  buildIssueGetPath,
  toCompactIssueCommentRecord,
  toCompactIssueRecord,
} from "../commands/client/issue.js";

describe("issue CLI helpers", () => {
  it("builds the compact issue path when requested", () => {
    expect(buildIssueGetPath("LIE-170", false)).toBe("/api/issues/LIE-170");
    expect(buildIssueGetPath("LIE-170", true)).toBe("/api/issues/LIE-170?compact=1");
  });

  it("renders a compact issue record for non-json output", () => {
    expect(
      toCompactIssueRecord({
        id: "issue-1",
        companyId: "company-1",
        projectId: "project-1",
        goalId: "goal-1",
        parentId: "parent-1",
        title: "Reconcile observed facts",
        description: "Tighten the observed facts derivation flow.",
        status: "in_progress",
        priority: "high",
        assigneeAgentId: "agent-1",
        assigneeUserId: null,
        checkoutRunId: "run-1",
        executionRunId: "run-2",
        executionAgentNameKey: null,
        executionLockedAt: null,
        createdByAgentId: null,
        createdByUserId: null,
        issueNumber: 170,
        identifier: "LIE-170",
        requestDepth: 1,
        billingCode: "ENG",
        assigneeAdapterOverrides: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        hiddenAt: null,
        createdAt: new Date("2026-03-10T12:00:00.000Z"),
        updatedAt: new Date("2026-03-10T12:05:00.000Z"),
      }),
    ).toEqual({
      identifier: "LIE-170",
      id: "issue-1",
      status: "in_progress",
      priority: "high",
      title: "Reconcile observed facts",
      projectId: "project-1",
      goalId: "goal-1",
      parentId: "parent-1",
      assigneeAgentId: "agent-1",
      assigneeUserId: null,
      requestDepth: 1,
      billingCode: "ENG",
      executionRunId: "run-2",
      checkoutRunId: "run-1",
      description: "Tighten the observed facts derivation flow.",
    });
  });

  it("renders a compact issue comment record", () => {
    expect(
      toCompactIssueCommentRecord({
        id: "comment-1",
        companyId: "company-1",
        issueId: "issue-1",
        authorAgentId: "agent-1",
        authorUserId: null,
        body: "Please rerun from the infra workspace.",
        createdAt: new Date("2026-03-10T12:00:00.000Z"),
        updatedAt: new Date("2026-03-10T12:01:00.000Z"),
      }),
    ).toEqual({
      id: "comment-1",
      authorAgentId: "agent-1",
      authorUserId: null,
      createdAt: new Date("2026-03-10T12:00:00.000Z"),
      updatedAt: new Date("2026-03-10T12:01:00.000Z"),
      body: "Please rerun from the infra workspace.",
    });
  });
});
