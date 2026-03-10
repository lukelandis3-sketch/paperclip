import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeContext } from "../client/context.js";
import { PaperclipApiClient } from "../client/http.js";
import { resolveAuthenticatedAgentIdentity, resolveCommandContext } from "../commands/client/common.js";

const ORIGINAL_ENV = { ...process.env };

function createTempPath(name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-cli-common-"));
  return path.join(dir, name);
}

describe("resolveCommandContext", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PAPERCLIP_API_URL;
    delete process.env.PAPERCLIP_API_KEY;
    delete process.env.PAPERCLIP_COMPANY_ID;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("uses profile defaults when options/env are not provided", () => {
    const contextPath = createTempPath("context.json");

    writeContext(
      {
        version: 1,
        currentProfile: "ops",
        profiles: {
          ops: {
            apiBase: "http://127.0.0.1:9999",
            companyId: "company-profile",
            apiKeyEnvVarName: "AGENT_KEY",
          },
        },
      },
      contextPath,
    );
    process.env.AGENT_KEY = "key-from-env";

    const resolved = resolveCommandContext({ context: contextPath }, { requireCompany: true });
    expect(resolved.api.apiBase).toBe("http://127.0.0.1:9999");
    expect(resolved.companyId).toBe("company-profile");
    expect(resolved.api.apiKey).toBe("key-from-env");
  });

  it("prefers explicit options over profile values", () => {
    const contextPath = createTempPath("context.json");
    writeContext(
      {
        version: 1,
        currentProfile: "default",
        profiles: {
          default: {
            apiBase: "http://profile:3100",
            companyId: "company-profile",
          },
        },
      },
      contextPath,
    );

    const resolved = resolveCommandContext(
      {
        context: contextPath,
        apiBase: "http://override:3200",
        apiKey: "direct-token",
        companyId: "company-override",
      },
      { requireCompany: true },
    );

    expect(resolved.api.apiBase).toBe("http://override:3200");
    expect(resolved.companyId).toBe("company-override");
    expect(resolved.api.apiKey).toBe("direct-token");
  });

  it("throws when company is required but unresolved", () => {
    const contextPath = createTempPath("context.json");
    writeContext(
      {
        version: 1,
        currentProfile: "default",
        profiles: { default: {} },
      },
      contextPath,
    );

    expect(() =>
      resolveCommandContext({ context: contextPath, apiBase: "http://localhost:3100" }, { requireCompany: true }),
    ).toThrow(/Company ID is required/);
  });

  it("resolves authenticated agent identity from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "agent-1",
          companyId: "company-1",
          name: "EngineeringManager",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new PaperclipApiClient({ apiBase: "http://localhost:3100", apiKey: "token-123" });
    const identity = await resolveAuthenticatedAgentIdentity(client);

    expect(identity).toEqual({
      id: "agent-1",
      companyId: "company-1",
      name: "EngineeringManager",
    });
  });

  it("returns null when authenticated agent identity is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Agent authentication required" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new PaperclipApiClient({ apiBase: "http://localhost:3100" });
    const identity = await resolveAuthenticatedAgentIdentity(client);

    expect(identity).toBeNull();
  });
});
