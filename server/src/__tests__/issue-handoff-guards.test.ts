import { describe, expect, it } from "vitest";
import { isAgentSelfReviewHandoff, isReviewerRejectReturn } from "../routes/issue-handoff-guards.js";

describe("issue handoff guards", () => {
  it("allows an owning agent to move a ticket in_review to a qa reviewer", () => {
    expect(
      isAgentSelfReviewHandoff({
        actorType: "agent",
        actorAgentId: "se-a",
        existingAssigneeAgentId: "se-a",
        nextStatus: "in_review",
        nextAssigneeAgentId: "reviewer",
        nextAssigneeUserId: null,
        targetAgent: {
          id: "reviewer",
          name: "Reviewer",
          title: "Reviewer / QA Lead",
          role: "qa",
        },
      }),
    ).toBe(true);
  });

  it("rejects reassignment when the next status is not in_review", () => {
    expect(
      isAgentSelfReviewHandoff({
        actorType: "agent",
        actorAgentId: "se-a",
        existingAssigneeAgentId: "se-a",
        nextStatus: "in_progress",
        nextAssigneeAgentId: "reviewer",
        nextAssigneeUserId: null,
        targetAgent: {
          id: "reviewer",
          name: "Reviewer",
          title: "Reviewer / QA Lead",
          role: "qa",
        },
      }),
    ).toBe(false);
  });

  it("rejects reassignment to a non-review target", () => {
    expect(
      isAgentSelfReviewHandoff({
        actorType: "agent",
        actorAgentId: "se-a",
        existingAssigneeAgentId: "se-a",
        nextStatus: "in_review",
        nextAssigneeAgentId: "eng-mgr",
        nextAssigneeUserId: null,
        targetAgent: {
          id: "eng-mgr",
          name: "EngineeringManager",
          title: "Engineering Manager",
          role: "general",
        },
      }),
    ).toBe(false);
  });

  it("allows a reviewer to return a rejected ticket to the creating manager", () => {
    expect(
      isReviewerRejectReturn({
        actorType: "agent",
        actorAgentId: "reviewer",
        existingStatus: "in_review",
        existingAssigneeAgentId: "reviewer",
        nextStatus: "todo",
        nextAssigneeAgentId: "eng-mgr",
        nextAssigneeUserId: null,
        actorAgent: {
          id: "reviewer",
          name: "Reviewer",
          title: "Reviewer / QA Lead",
          role: "qa",
        },
        targetAgent: {
          id: "eng-mgr",
          name: "EngineeringManager",
          title: "Engineering Manager",
          role: "general",
        },
        creatorAgentId: "eng-mgr",
      }),
    ).toBe(true);
  });

  it("rejects reviewer return when the target is not the creating manager", () => {
    expect(
      isReviewerRejectReturn({
        actorType: "agent",
        actorAgentId: "reviewer",
        existingStatus: "in_review",
        existingAssigneeAgentId: "reviewer",
        nextStatus: "todo",
        nextAssigneeAgentId: "se-a",
        nextAssigneeUserId: null,
        actorAgent: {
          id: "reviewer",
          name: "Reviewer",
          title: "Reviewer / QA Lead",
          role: "qa",
        },
        targetAgent: {
          id: "se-a",
          name: "SoftwareEngineerA",
          title: "Software Engineer A",
          role: "engineer",
        },
        creatorAgentId: "eng-mgr",
      }),
    ).toBe(false);
  });
});
