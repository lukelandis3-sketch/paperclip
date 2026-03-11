import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  getDirtyWorkspaceAssignmentFailure,
  requiresCleanWorkspaceForAssignment,
} from "../routes/issue-workspace-guards.js";

const tempDirs: string[] = [];

function createGitWorkspace() {
  const dir = mkdtempSync(join(tmpdir(), "paperclip-workspace-guard-"));
  tempDirs.push(dir);
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Codex"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "codex@example.com"], { cwd: dir });
  writeFileSync(join(dir, "README.md"), "hello\n");
  execFileSync("git", ["add", "README.md"], { cwd: dir });
  execFileSync("git", ["commit", "-qm", "init"], { cwd: dir });
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("issue workspace guards", () => {
  it("requires clean assignment enforcement for engineering workspaces", () => {
    expect(requiresCleanWorkspaceForAssignment({ name: "SoftwareEngineerB", role: "engineer" })).toBe(true);
    expect(requiresCleanWorkspaceForAssignment({ name: "ProgramDirector", role: "general" })).toBe(false);
  });

  it("allows assignment into a clean engineer workspace", () => {
    const cwd = createGitWorkspace();
    expect(
      getDirtyWorkspaceAssignmentFailure({
        name: "SoftwareEngineerB",
        role: "engineer",
        adapterConfig: { cwd },
      }),
    ).toBeNull();
  });

  it("blocks assignment into a dirty engineer workspace", () => {
    const cwd = createGitWorkspace();
    writeFileSync(join(cwd, "notes.txt"), "dirty\n");
    expect(
      getDirtyWorkspaceAssignmentFailure({
        name: "SoftwareEngineerB",
        role: "engineer",
        adapterConfig: { cwd },
      }),
    ).toContain('is dirty and cannot accept a new assignment');
  });
});
