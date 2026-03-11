import { describe, expect, it } from "vitest";
import { resolveDefaultAgentWorkspaceDir } from "../home-paths.js";
import {
  deriveMissingIssueUpdateFailure,
  planHeartbeatRunRecovery,
  resolveRuntimeSessionParamsForWorkspace,
  shouldUseProjectWorkspaceForRun,
  shouldResetTaskSessionForWake,
  type ResolvedWorkspaceForRun,
} from "../services/heartbeat.ts";

function buildResolvedWorkspace(overrides: Partial<ResolvedWorkspaceForRun> = {}): ResolvedWorkspaceForRun {
  return {
    cwd: "/tmp/project",
    source: "project_primary",
    projectId: "project-1",
    workspaceId: "workspace-1",
    repoUrl: null,
    repoRef: null,
    workspaceHints: [],
    warnings: [],
    ...overrides,
  };
}

describe("resolveRuntimeSessionParamsForWorkspace", () => {
  it("migrates fallback workspace sessions to project workspace when project cwd becomes available", () => {
    const agentId = "agent-123";
    const fallbackCwd = resolveDefaultAgentWorkspaceDir(agentId);

    const result = resolveRuntimeSessionParamsForWorkspace({
      agentId,
      previousSessionParams: {
        sessionId: "session-1",
        cwd: fallbackCwd,
        workspaceId: "workspace-1",
      },
      resolvedWorkspace: buildResolvedWorkspace({ cwd: "/tmp/new-project-cwd" }),
    });

    expect(result.sessionParams).toMatchObject({
      sessionId: "session-1",
      cwd: "/tmp/new-project-cwd",
      workspaceId: "workspace-1",
    });
    expect(result.warning).toContain("Attempting to resume session");
  });

  it("does not migrate when previous session cwd is not the fallback workspace", () => {
    const result = resolveRuntimeSessionParamsForWorkspace({
      agentId: "agent-123",
      previousSessionParams: {
        sessionId: "session-1",
        cwd: "/tmp/some-other-cwd",
        workspaceId: "workspace-1",
      },
      resolvedWorkspace: buildResolvedWorkspace({ cwd: "/tmp/new-project-cwd" }),
    });

    expect(result.sessionParams).toEqual({
      sessionId: "session-1",
      cwd: "/tmp/some-other-cwd",
      workspaceId: "workspace-1",
    });
    expect(result.warning).toBeNull();
  });

  it("does not migrate when resolved workspace id differs from previous session workspace id", () => {
    const agentId = "agent-123";
    const fallbackCwd = resolveDefaultAgentWorkspaceDir(agentId);

    const result = resolveRuntimeSessionParamsForWorkspace({
      agentId,
      previousSessionParams: {
        sessionId: "session-1",
        cwd: fallbackCwd,
        workspaceId: "workspace-1",
      },
      resolvedWorkspace: buildResolvedWorkspace({
        cwd: "/tmp/new-project-cwd",
        workspaceId: "workspace-2",
      }),
    });

    expect(result.sessionParams).toEqual({
      sessionId: "session-1",
      cwd: fallbackCwd,
      workspaceId: "workspace-1",
    });
    expect(result.warning).toBeNull();
  });
});

describe("shouldUseProjectWorkspaceForRun", () => {
  it("prefers an agent's configured cwd by default", () => {
    expect(
      shouldUseProjectWorkspaceForRun({
        configuredCwd: "/tmp/agent-worktree",
        useProjectWorkspace: null,
      }),
    ).toBe(false);
  });

  it("defaults to project workspace when no configured cwd exists", () => {
    expect(
      shouldUseProjectWorkspaceForRun({
        configuredCwd: null,
        useProjectWorkspace: null,
      }),
    ).toBe(true);
  });

  it("honors an explicit project-workspace opt-in", () => {
    expect(
      shouldUseProjectWorkspaceForRun({
        configuredCwd: "/tmp/agent-worktree",
        useProjectWorkspace: true,
      }),
    ).toBe(true);
  });

  it("honors an explicit project-workspace opt-out", () => {
    expect(
      shouldUseProjectWorkspaceForRun({
        configuredCwd: null,
        useProjectWorkspace: false,
      }),
    ).toBe(false);
  });
});

describe("shouldResetTaskSessionForWake", () => {
  it("resets session context on assignment wake", () => {
    expect(shouldResetTaskSessionForWake({ wakeReason: "issue_assigned" })).toBe(true);
  });

  it("resets session context on timer heartbeats", () => {
    expect(shouldResetTaskSessionForWake({ wakeSource: "timer" })).toBe(true);
  });

  it("resets session context on manual on-demand invokes", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeSource: "on_demand",
        wakeTriggerDetail: "manual",
      }),
    ).toBe(true);
  });

  it("does not reset session context on non-blocked mention wake comment", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeReason: "issue_comment_mentioned",
        wakeCommentId: "comment-1",
        issueStatus: "in_progress",
      }),
    ).toBe(false);
  });

  it("does not reset session context when commentId is present on a non-blocked issue", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeReason: "issue_commented",
        commentId: "comment-2",
        issueStatus: "in_progress",
      }),
    ).toBe(false);
  });

  it("does not reset for comment wakes on open issues", () => {
    expect(shouldResetTaskSessionForWake({ wakeReason: "issue_commented", issueStatus: "todo" })).toBe(false);
  });

  it("resets for blocked issue comment wakes", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeReason: "issue_commented",
        issueStatus: "blocked",
        wakeCommentId: "comment-3",
      }),
    ).toBe(true);
  });

  it("resets for blocked mention wakes", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeReason: "issue_comment_mentioned",
        issueStatus: "blocked",
        wakeCommentId: "comment-4",
      }),
    ).toBe(true);
  });

  it("does not reset when wake reason is missing", () => {
    expect(shouldResetTaskSessionForWake({})).toBe(false);
  });

  it("does not reset session context on callback on-demand invokes", () => {
    expect(
      shouldResetTaskSessionForWake({
        wakeSource: "on_demand",
        wakeTriggerDetail: "callback",
      }),
    ).toBe(false);
  });
});

describe("planHeartbeatRunRecovery", () => {
  it("reaps only orphaned running runs and preserves queued runs for resumption", () => {
    const now = new Date("2026-03-08T17:10:00.000Z");
    const plan = planHeartbeatRunRecovery({
      now,
      staleThresholdMs: 5 * 60 * 1000,
      runningProcessIds: ["running-live"],
      runs: [
        {
          id: "queued-stuck",
          agentId: "agent-a",
          status: "queued",
          updatedAt: new Date("2026-03-08T16:55:00.000Z"),
        },
        {
          id: "running-live",
          agentId: "agent-a",
          status: "running",
          updatedAt: new Date("2026-03-08T16:59:30.000Z"),
        },
        {
          id: "running-orphaned",
          agentId: "agent-b",
          status: "running",
          updatedAt: new Date("2026-03-08T17:00:00.000Z"),
        },
      ],
    });

    expect(plan.runsToReap.map((run) => run.id)).toEqual(["running-orphaned"]);
    expect(plan.queuedAgentIds).toEqual(["agent-a"]);
  });

  it("does not reap fresh running runs inside the staleness window", () => {
    const now = new Date("2026-03-08T17:10:00.000Z");
    const plan = planHeartbeatRunRecovery({
      now,
      staleThresholdMs: 5 * 60 * 1000,
      runs: [
        {
          id: "running-fresh",
          agentId: "agent-a",
          status: "running",
          updatedAt: new Date("2026-03-08T17:08:00.000Z"),
        },
      ],
    });

    expect(plan.runsToReap).toEqual([]);
    expect(plan.queuedAgentIds).toEqual([]);
  });
});

describe("deriveMissingIssueUpdateFailure", () => {
  it("flags checked-out in-progress runs with no issue activity", () => {
    expect(
      deriveMissingIssueUpdateFailure({
        checkedOutIssue: {
          status: "in_progress",
          assigneeAgentId: "agent-1",
          checkoutRunId: "run-1",
          executionRunId: "run-1",
        },
        agentId: "agent-1",
        runId: "run-1",
        hasIssueUpdateActivity: false,
      }),
    ).toContain("Checked out issue run exited without any issue update or comment");
  });

  it("does not flag runs that left an issue update or comment", () => {
    expect(
      deriveMissingIssueUpdateFailure({
        checkedOutIssue: {
          status: "in_progress",
          assigneeAgentId: "agent-1",
          checkoutRunId: "run-1",
          executionRunId: "run-1",
        },
        agentId: "agent-1",
        runId: "run-1",
        hasIssueUpdateActivity: true,
      }),
    ).toBeNull();
  });

  it("does not flag runs once the issue already left in-progress", () => {
    expect(
      deriveMissingIssueUpdateFailure({
        checkedOutIssue: {
          status: "in_review",
          assigneeAgentId: "agent-1",
          checkoutRunId: "run-1",
          executionRunId: "run-1",
        },
        agentId: "agent-1",
        runId: "run-1",
        hasIssueUpdateActivity: false,
      }),
    ).toBeNull();
  });
});
