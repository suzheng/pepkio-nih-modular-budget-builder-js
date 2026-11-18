// SPDX-License-Identifier: MIT
import type {
  ActionType,
  AppointmentType,
  Budget,
  BudgetCosts,
  EffortGrant,
  NIHModularBudgetInput,
  PersonnelItem,
} from "./schemas.js";

export type {
  ActionType,
  AppointmentType,
  Budget,
  BudgetCosts,
  EffortGrant,
  NIHModularBudgetInput,
  PersonnelItem,
};

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export interface YearPersonnel {
  id?: string;
  name?: string;
  role?: string;
  appointmentType?: string;
  ibs?: number;
  effortPercent?: number;
  personMonths?: number;
  fringeRatePercent?: number;
  allowableSalary?: number;
  institutionalCostShare?: number;
  fringe?: number;
  personnelCost?: number;
  warnings?: string[];
  [key: string]: unknown;
}

export interface BudgetYear {
  year: number;
  salaryCap: number;
  personnel: YearPersonnel[];
  equipment: number;
  consortiumDirect: number;
  otherDirect: number;
  totalPersonnel: number;
  directExclConsortiumFa: number;
  modularTestDirect: number;
  modularDirectRequested: number;
  consortiumFa: number;
  totalDirect: number;
  totalDirectRequested: number;
  fa: number;
  totalProject: number;
  modules: number;
  exceedsModularThreshold: boolean;
  requiresDetailedBudget: boolean;
  [key: string]: unknown;
}

export interface BudgetCalculationResult {
  fiscalYear: number;
  salaryCap: number;
  years: BudgetYear[];
  moduleVariance: boolean;
  requiresDetailedBudget: boolean;
  personnelJustification: string;
  varianceNarrative: string;
  fullJustification: string;
  warnings: string[];
  [key: string]: unknown;
}

export interface EffortResult {
  totals?: Record<string, number>;
  overCommitted?: string[];
  warnings?: string[];
  [key: string]: unknown;
}

export interface NIHModularBudgetResult {
  result?: BudgetCalculationResult;
  effort?: EffortResult;
  budget?: Budget;
  effortGrants?: EffortGrant[];
  content?: string;
  filename?: string;
  mime_type?: string;
  [key: string]: unknown;
}

export interface RunResult<T = NIHModularBudgetResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export class PepkioAPIError extends Error {
  readonly status?: number;
  readonly body?: unknown;
  readonly code?: string;
  readonly runId?: string;

  constructor(
    message: string,
    options: {
      status?: number;
      body?: unknown;
      code?: string;
      runId?: string;
    } = {},
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = options.status;
    this.body = options.body;
    this.code = options.code;
    this.runId = options.runId;
  }
}
