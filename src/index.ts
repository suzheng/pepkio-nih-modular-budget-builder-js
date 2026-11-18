// SPDX-License-Identifier: MIT

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  isLocalUrl,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  actionTypeSchema,
  appointmentTypeSchema,
  budgetCostsSchema,
  budgetSchema,
  effortGrantSchema,
  nihModularBudgetInputSchema,
  parseRunInput,
  personnelItemSchema,
  type ActionType,
  type AppointmentType,
  type Budget,
  type BudgetCosts,
  type EffortGrant,
  type NIHModularBudgetInput,
  type PersonnelItem,
} from "./schemas.js";

export {
  PepkioAPIError,
  type BudgetCalculationResult,
  type BudgetYear,
  type EffortResult,
  type ExampleMeta,
  type ManifestExample,
  type NIHModularBudgetResult,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
  type YearPersonnel,
} from "./types.js";

export {
  PepkioClient,
  type PepkioClientOptions,
} from "./client.js";

import { PepkioClient } from "./client.js";
export default PepkioClient;
