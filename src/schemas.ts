// SPDX-License-Identifier: MIT
import { z } from "zod";

export const appointmentTypeSchema = z.enum(["calendar", "academic"]);
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;

export const actionTypeSchema = z.enum([
  "calculate",
  "export_csv",
  "load_example",
  "effort_check",
]);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const personnelItemSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    appointmentType: appointmentTypeSchema.optional().default("calendar"),
    ibs: z.number().nonnegative("IBS must be non-negative").optional().default(0),
    effortPercent: z.number().min(0).max(100).optional().default(0),
    fringeRatePercent: z.number().min(0).max(100).optional().default(0),
  })
  .passthrough();
export type PersonnelItem = z.infer<typeof personnelItemSchema>;

export const budgetCostsSchema = z
  .object({
    faRatePercent: z.number().min(0).optional().default(0),
    equipment: z.number().min(0).optional().default(0),
    consortiumDirect: z.number().min(0).optional().default(0),
    consortiumFa: z.number().min(0).optional().default(0),
    otherDirect: z.number().min(0).optional().default(0),
    escalationRatePercent: z.number().min(0).optional().default(0),
    projectYears: z.number().int().min(1).max(5).optional().default(1),
  })
  .passthrough();
export type BudgetCosts = z.infer<typeof budgetCostsSchema>;

export const budgetSchema = z
  .object({
    fiscalYear: z.number().int().optional(),
    personnel: z.array(personnelItemSchema).optional(),
    costs: budgetCostsSchema.optional(),
  })
  .passthrough();
export type Budget = z.infer<typeof budgetSchema>;

export const effortGrantSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    efforts: z.record(z.string(), z.number()).optional().default({}),
  })
  .passthrough();
export type EffortGrant = z.infer<typeof effortGrantSchema>;

export const nihModularBudgetInputSchema = z
  .object({
    action: actionTypeSchema.optional().default("calculate"),
    budget: budgetSchema.optional(),
    effortGrants: z.array(effortGrantSchema).optional(),
  })
  .passthrough();
export type NIHModularBudgetInput = z.infer<typeof nihModularBudgetInputSchema>;

export function parseRunInput(input: unknown): NIHModularBudgetInput {
  return nihModularBudgetInputSchema.parse(input);
}
