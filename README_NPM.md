# Pepkio NIH Modular Budget Builder

Typed TypeScript and Node.js SDK with CLI for planning NIH modular grant direct costs, personnel person-months, salary caps, and indirect F&A budgets via the Pepkio Tools API.

# What It Does

Applying for National Institutes of Health (NIH) modular grants (such as R01, R21, R03, and R15 awards) requires converting personnel appointments, base salaries, and effort allocations into direct cost requests grouped into standard $25,000 modules up to $250,000 per year. Investigators and research administrators must enforce federal Executive Level II salary caps, distinguish between 9-month academic and 12-month calendar person-months, calculate fringe benefits, factor in multi-year cost escalation, and determine Modified Total Direct Cost (MTDC) indirect cost bases while excluding capital equipment and subaward costs exceeding $25,000.

This package provides a typed Node.js/ESM client and command-line interface to model and calculate NIH modular grant budgets via the Pepkio Tools REST API. It handles multi-year project projections (up to 5 years), cross-grant effort compliance audits, automated PHS 398 personnel justification drafting, and consortium subaward accounting.

Programmatic runs require an active network connection and a Pepkio API key. Calculations are processed via the Pepkio Tools REST API.

# Features

- **Executive Level II Salary Cap Enforcement**: Caps institutional base salaries exceeding federal limits before calculating direct salary requests
- **Effort & Person-Month Conversion**: Accurately computes calendar, academic, and summer person-months from appointment type and effort percentage
- **Modular Direct Cost Rounding**: Automatically rounds raw personnel, operating costs, and consortium direct requests into $25,000 module increments
- **F&A & MTDC Indirect Engine**: Computes institutional indirect costs while properly excluding capital equipment (≥ $5,000) and subaward direct costs beyond $25,000
- **Consortium & Subaward Allocation**: Separates consortium direct costs and subaward F&A costs according to PHS 398 guidelines
- **Multi-Year Project Escalation**: Models multi-year project periods (up to 5 years) with configurable annual salary escalation rates
- **Effort Compliance Audit**: Audits total investigator effort across active and pending awards to prevent over-commitment (>12 person-months or >100%)
- **Manifest and Example Inspection**: Typed helper methods `getManifest`, `listExamples`, and `getExampleInput`
- **Command-Line Interface (CLI)**: Inspect API manifests and execute budget calculations directly with `npx pepkio-nih-modular-budget-builder`
- **TypeScript & ESM Native**: Fully typed with runtime validation powered by Zod

# Installation

```bash
npm install pepkio-nih-modular-budget-builder
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before calling `run()`:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create an API key in your [Pepkio account settings](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (for remote API calls) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```typescript
import { PepkioClient } from "pepkio-nih-modular-budget-builder";

const client = new PepkioClient({ apiKey: process.env.PEPKIO_API_KEY });

// Retrieve the pre-configured 5-year R01 modular grant example input
const input = await client.getExampleInput("calculate_r01");
const response = await client.run(input);

if (response.result?.result) {
  const { fiscalYear, years, cumulativeSummary, personnelJustification } = response.result.result;
  console.log(`NIH Modular Budget (Base FY${fiscalYear}):`);
  for (const year of years) {
    console.log(
      `Year ${year.year}: Modules Requested: ${year.modulesRequested} ($${year.modularDirectCost.toLocaleString()}), F&A: $${year.faCost.toLocaleString()}`
    );
  }
  console.log(`Total Project Funding: $${cumulativeSummary.totalProjectFunding.toLocaleString()}`);
  console.log("\nPersonnel Justification Snippet:\n", personnelJustification.slice(0, 300));
}
```

# CLI

```bash
# Inspect available manifest examples
npx pepkio-nih-modular-budget-builder manifest --examples

# Run a pre-configured manifest example
npx pepkio-nih-modular-budget-builder run --example calculate_r01
```

# Typical Use Cases

- **5-Year NIH R01 Research Grant**: Model multi-year personnel effort, annual salary escalation (e.g. 3%), fringe rates, and $25,000 modular direct cost increments
- **2-Year NIH R21 Exploratory Grant**: Structure variable annual modular requests ($175,000 in Year 1, $100,000 in Year 2) and verify module limits
- **Multi-Center Subaward Allocation**: Separate consortium direct costs and subaward F&A according to MTDC exclusion rules ($25,000 subaward limit)
- **Investigator Effort Ledger Audit**: Verify cross-grant effort commitments across calendar and academic appointments to prevent over-commitment (>100% or >12 person-months)
- **PHS 398 Personnel Justification Drafting**: Generate standardized justification narratives detailing role, person-months, and project responsibilities

# Scientific Background

Grant financial planning for NIH modular awards follows federal accounting standards defined in the NIH Grants Policy Statement and 2 CFR 200 (Uniform Guidance):

- **Person-Months**: Dedicated project time based on appointment type: $\text{Person-Months} = \text{Appointment Months} \times (\text{Effort Percent} / 100)$.
- **Executive Level II Salary Cap**: Direct salary requested is capped at federal mandates: $\text{Direct Salary} = \min(\text{IBS}, \, \text{Cap}) \times (\text{Effort Percent} / 100)$.
- **Modular Direct Costs**: Direct costs are requested in $25,000 increments up to the $250,000/year ceiling: $\text{Modules} = \text{ceil}(\text{Direct Costs} / 25000)$.
- **MTDC & F&A Indirect Costs**: Facilities & Administrative rates apply to Modified Total Direct Costs, excluding capital equipment (≥ $5,000) and subaward direct costs beyond $25,000.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/nih-modular-budget-builder

The web application provides interactive personnel rosters, visual modular tier graphs, instant salary cap alerts, and exportable PHS 398 budget justification documents.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-nih-modular-budget-builder-js

Web Application: https://www.pepkio.com/tools/nih-modular-budget-builder

Python client (PyPI): https://pypi.org/project/pepkio-nih-modular-budget-builder/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/fb13302c8ad2498a3958c2583f683c80c9b5f09674b7900ddda9add274588c36)
