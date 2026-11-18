// SPDX-License-Identifier: MIT
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError } from "../src/types.js";

const mockManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "NIH Modular Budget Builder",
  description: "Convert personnel effort and salary into NIH modular budget modules",
  examples: [
    {
      name: "calculate_r01",
      input: {
        action: "calculate",
        budget: {
          fiscalYear: 2026,
          personnel: [
            {
              id: "pi-1",
              name: "Dr. Elena Vasquez",
              role: "Principal Investigator",
              appointmentType: "calendar",
              ibs: 285000,
              effortPercent: 20,
              fringeRatePercent: 28,
            },
          ],
          costs: {
            faRatePercent: 55,
            projectYears: 1,
          },
        },
      },
      output: {
        result: {
          years: [],
        },
      },
    },
    {
      name: "effort_check",
      input: {
        action: "effort_check",
        effortGrants: [
          { id: "g1", name: "R01", efforts: { "pi-1": 60 } },
        ],
      },
      output: {
        effort: {
          overCommitted: [],
        },
      },
    },
  ],
};

const mockRunResponse = {
  run_id: "test-run-nih-budget-123",
  status: "completed",
  result: {
    result: {
      fiscalYear: 2026,
      salaryCap: 228000,
      years: [
        {
          year: 1,
          salaryCap: 228000,
          personnel: [
            {
              id: "pi-1",
              name: "Dr. Elena Vasquez",
              role: "Principal Investigator",
              appointmentType: "calendar",
              ibs: 285000,
              effortPercent: 20,
              personMonths: 2.4,
              fringeRatePercent: 28,
              allowableSalary: 45600,
              institutionalCostShare: 11400,
              fringe: 12768,
              personnelCost: 58368,
              warnings: [],
            },
          ],
          equipment: 0,
          consortiumDirect: 0,
          otherDirect: 0,
          totalPersonnel: 58368,
          directExclConsortiumFa: 58368,
          modularTestDirect: 58368,
          modularDirectRequested: 50000,
          consortiumFa: 0,
          totalDirect: 58368,
          totalDirectRequested: 50000,
          fa: 32102.4,
          totalProject: 90470.4,
          modules: 2,
          exceedsModularThreshold: false,
          requiresDetailedBudget: false,
        },
      ],
      moduleVariance: false,
      requiresDetailedBudget: false,
      personnelJustification: "Dr. Elena Vasquez...",
      varianceNarrative: "",
      fullJustification: "Dr. Elena Vasquez...",
      warnings: [],
    },
  },
  error: null,
  duration_ms: 15,
};

describe("config utilities", () => {
  const origBase = process.env.PEPKIO_API_BASE_URL;
  const origLocal = process.env.LOCAL_PEPKIO_API_KEY;
  const origProd = process.env.PEPKIO_API_KEY;

  beforeEach(() => {
    delete process.env.PEPKIO_API_BASE_URL;
    delete process.env.LOCAL_PEPKIO_API_KEY;
    delete process.env.PEPKIO_API_KEY;
  });

  afterEach(() => {
    if (origBase) process.env.PEPKIO_API_BASE_URL = origBase;
    if (origLocal) process.env.LOCAL_PEPKIO_API_KEY = origLocal;
    if (origProd) process.env.PEPKIO_API_KEY = origProd;
  });

  it("resolves default production URL", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("prefers explicit override over env var", () => {
    process.env.PEPKIO_API_BASE_URL = "https://env.pepkio.com/";
    expect(resolveBaseUrl("https://override.pepkio.com/")).toBe(
      "https://override.pepkio.com",
    );
  });

  it("detects local URLs", () => {
    expect(isLocalUrl("https://tools.localtest.me")).toBe(true);
    expect(isLocalUrl("http://localhost:8000")).toBe(true);
    expect(isLocalUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalUrl("https://tools.pepkio.com")).toBe(false);
  });

  it("resolves local vs production api keys correctly", () => {
    process.env.LOCAL_PEPKIO_API_KEY = "local-secret";
    process.env.PEPKIO_API_KEY = "prod-secret";

    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-secret");
    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-secret");
    expect(resolveApiKey("https://tools.pepkio.com", "override-key")).toBe("override-key");
  });
});

describe("schemas validation", () => {
  it("validates and parses valid NIHModularBudgetInput", () => {
    const input = {
      action: "calculate",
      budget: {
        fiscalYear: 2026,
        personnel: [
          {
            name: "Dr. Test",
            ibs: 100000,
            effortPercent: 25,
            fringeRatePercent: 30,
          },
        ],
        costs: {
          projectYears: 3,
        },
      },
    };
    const parsed = parseRunInput(input);
    expect(parsed.action).toBe("calculate");
    expect(parsed.budget?.fiscalYear).toBe(2026);
    expect(parsed.budget?.personnel?.[0].appointmentType).toBe("calendar");
    expect(parsed.budget?.costs?.projectYears).toBe(3);
  });

  it("rejects invalid projectYears", () => {
    expect(() =>
      parseRunInput({
        action: "calculate",
        budget: {
          costs: {
            projectYears: 6, // max is 5
          },
        },
      }),
    ).toThrow();
  });
});

describe("PepkioClient unit tests with mock fetch", () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("fetches manifest and caches it", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const cached = await client.getManifest();
    expect(cached.tool_id).toBe(TOOL_ID);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Refresh option should bypass cache
    await client.getManifest({ refresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lists examples from manifest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockManifest),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = await client.getExamples();
    expect(examples).toHaveLength(2);
    expect(examples[0].name).toBe("calculate_r01");

    const input = await client.getExampleInput("calculate_r01");
    expect(input.action).toBe("calculate");
    expect(input.budget?.fiscalYear).toBe(2026);
  });

  it("executes run successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.run({
      action: "calculate",
      budget: {
        fiscalYear: 2026,
      },
    });

    expect(res.status).toBe("completed");
    expect(res.run_id).toBe("test-run-nih-budget-123");
    expect(res.result?.result?.fiscalYear).toBe(2026);
    expect(res.result?.result?.years[0].modules).toBe(2);
  });

  it("convenience helpers calculate, exportCsv, checkEffort call run", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockRunResponse),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.calculate({ fiscalYear: 2026 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await client.exportCsv({ fiscalYear: 2026 });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await client.checkEffort([{ id: "g1", efforts: { "pi-1": 50 } }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws PepkioAPIError when HTTP error occurs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: async () => JSON.stringify({ error: { message: "Invalid budget input" } }),
    });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({ action: "calculate" }),
    ).rejects.toThrowError(PepkioAPIError);
  });

  it("requires API key for run()", async () => {
    const client = new PepkioClient({ apiKey: "" });
    await expect(client.run({ action: "calculate" })).rejects.toThrow(PepkioAPIError);
    await expect(client.run({ action: "calculate" })).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining("API key required"),
    });
  });

  it("polls waitForRun until completion", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ run_id: "async-1", status: "running" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ run_id: "async-1", status: "completed", result: {} }),
      });
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.waitForRun("async-1", { intervalMs: 10, timeoutMs: 1000 });
    expect(res.status).toBe("completed");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
