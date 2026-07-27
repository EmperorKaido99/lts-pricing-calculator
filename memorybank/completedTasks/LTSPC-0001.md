# LTSPC-0001: Build the initial LTS Pricing Calculator

## Define

- **Goal**: A pricing/value calculator for LTS, in the visual/interaction style of the Azure Pricing Calculator, showing new and existing customers what they get and what it costs, in ZAR.
- **Constraints**: LTS sells SaaS, not many discrete products like Azure — the catalog side had to reflect that honestly rather than inventing SKUs. No backend. Static site the LTS team can drop onto their existing website.
- **Definition of Done**: Products tab, estimate builder with trainee/contract configuration, estimate templates, saved estimates, FAQs, Export to Excel, Save, Share, and a "Contact Support" bubble (not live chat) — all using real published LTS pricing and content.

## Discover

### Findings

- `https://www.ltsystems.co.za/pricing/` publishes one product: a per-trainee/month SaaS fee, banded by trainee-volume tier (1-29 / 30-99 / 100-249 / 250-499 / 500+) × contract term (Pay-as-you-go / 1yr / 2yr / 3yr). Prices valid until 31 March 2027, excl. VAT, with annual CPI-linked escalation each 1 April.
- `https://www.ltsystems.co.za/features/` and `https://www.ltsystems.co.za/faq/` supplied real value-proposition and FAQ copy (compliance with SAICA/CIMA/ACCA/IIA/Compliance Institute/SAIGA/SAIPA, 99.99% uptime, help-desk hours, no licensing/installation fees, sign-up process).
- South Africa's standard VAT rate is confirmed at 15% for the 2026 tax year (the proposed increase to 16% was reversed).
- The real sign-up URLs use a `?type_of_contract=` query parameter (`Pay-as-you-go`, `1-Year-Contract`, etc.) — reused for the "Sign up on this plan" CTA.

### Affected Files

| File | Role | Notes |
| ---- | ---- | ----- |
| `js/data.js` | Pricing/content source of truth | All rates transcribed from the live pricing page |
| `js/calculator.js` | Pricing math | Verified against published figures via Node sanity checks |
| `js/export.js` | Export/Save/Share | SheetJS export, localStorage save w/ fallback, URL-hash share |
| `js/app.js` | UI wiring | All tabs, estimate builder, templates, FAQs, support bubble |
| `index.html`, `css/styles.css` | Page shell + styling | Azure-calculator-style layout, LTS navy/teal palette (placeholder) |

### Root Cause / Area of Change

New project — no prior codebase.

### External Research

- Confirmed current SA VAT rate (15%) via SARS and independent tax-advisory sources, since the rate was subject to a reversed proposed increase.
- Read the referenced Agent Harness Setup Prompt in full to scaffold `agents.md`, `.github/copilot-instructions.md`, and `memorybank/`.

### Discovery Summary

LTS's real commercial model is simpler than Azure's — one product, priced by a two-axis table (trainee tier × contract term). The Azure-calculator UI pattern (products → estimate → templates → saved → export/save/share) maps cleanly onto it without needing invented services.

## Deliver

### Implementation Plan

- [x] Data model (`js/data.js`) transcribed from the live pricing/features/FAQ pages
- [x] Pure calculation engine (`js/calculator.js`) with Node-verified tier lookup, cost, and savings-% math
- [x] Export/Save/Share helpers (`js/export.js`)
- [x] Page shell + styling mirroring the Azure calculator's structure (`index.html`, `css/styles.css`)
- [x] UI wiring for all five tabs + support bubble (`js/app.js`)
- [x] D5 agent harness scaffold (`agents.md`, `.github/`, `memorybank/`)

### Approval

- **Status**: ✅ Approved (initial build delivered directly per user request)
- **Approved by**: Kai
- **Notes**: First pass — see "Known assumptions to sign off on" in `README.md` for open items (brand colours, backend-less save/share, no extra SKUs).

### Changes Made

- All files listed under Affected Files above — initial creation.

## Demonstrate

### Test Results

- Build: ✅ (static site, nothing to compile)
- Tests: ✅ — `js/data.js` + `js/calculator.js` sanity-checked in Node against the published rate table (tier boundaries, monthly cost, savings %, currency formatting all verified)
- Output: see `memorybank/setup.md` for the exact commands used

### Human Verification

- **Status**: ⏳ Awaiting — Kai to open `index.html` and confirm the UI/UX and numbers before this goes live on the LTS site.
- **Feedback**: —

## Document

- **Summary**: Initial functional build of the LTS Pricing Calculator, in ZAR, styled after the Azure Pricing Calculator, using LTS's real published pricing and content.
- **Documentation Updated**: `memorybank/features.md`, `memorybank/architecture.md`, `memorybank/integrations.md`, `memorybank/setup.md`, `memorybank/project-context.md`, `README.md`, `memorybank/ticket-progress.md`.
