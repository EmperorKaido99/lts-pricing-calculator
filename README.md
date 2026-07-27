# LTS Pricing Calculator

A pricing / value calculator for LTS (Learner Tracking Systems), modelled on the layout of the Azure Pricing Calculator: browse the product, add it to an estimate, configure it, compare contract terms, then export/save/share the result.

**Live pricing, in Rand.** All figures come from LTS's published pricing page (https://www.ltsystems.co.za/pricing/) — trainee-volume brackets × contract term (Pay-as-you-go / 1 / 2 / 3 year). Unlike Azure, LTS sells one product — a SaaS online assessment & learner tracking platform — so "Products" is a single card, and the Azure-style "estimate templates" instead map to common firm profiles (new client, growing firm, established firm, large training office, enterprise).

## What's here

| Section | What it does |
|---|---|
| **Products** | The LTS platform, with real value props (compliance, reporting, support, uptime) pulled from the LTS features/FAQ pages. "Add to estimate" starts a new estimate. |
| **Your Estimate** | One or more line items, each with a trainee count and a contract term. Contract terms are shown side by side with their real computed savings vs. Pay-as-you-go. A New/Existing customer toggle changes the call to action (Sign Up vs. Contact Support). |
| **Estimate templates** | Five preset firm profiles you can drop straight into an estimate. |
| **Saved estimates** | Estimates saved on this device (no login required). |
| **FAQs** | Grouped, real FAQ content from ltsystems.co.za/faq. |
| **Export / Save / Share** | Export to `.xlsx`, save to this browser, or copy a link that restores the exact estimate. |
| **Contact Support bubble** | Real LTS phone numbers and email — there's no live chat, so this isn't pretending to be one. |

## Tech stack

Plain HTML/CSS/JavaScript — no framework, no build step, no backend. One CDN dependency (SheetJS, for the Excel export). See `memorybank/project-context.md` for the full rundown and `memorybank/architecture.md` for the file-by-file structure.

> **Assumption flagged:** the brief mentioned "Java" for the stack. Since this needs to run as a page on the existing LTS website with no server-side logic (it's a pure calculator), it's built in vanilla JavaScript rather than a Java backend — there's nothing here that needs a server. If a Java/Spring Boot backend was actually intended (e.g. to centrally store estimates instead of using the browser), flag it and this can be re-architected.

## Running it

No install step — open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Known assumptions to sign off on

These were filled in sensibly so the calculator is fully functional, but they're worth a look before this goes live:

1. **Colours/branding** are a placeholder navy + teal palette (not LTS's actual brand colours, which weren't available to pull from the live site's design). Swap the CSS custom properties in `css/styles.css` (`:root`) once you have the real brand palette.
2. **Save/Share have no backend** — Save writes to the visitor's browser only (not tied to their LTS account); Share encodes the estimate into a URL. If LTS wants estimates saved server-side against a login, that's a separate piece of work.
3. **No additional paid add-ons/support tiers are listed**, because the public pricing page doesn't show any — only the one platform, priced by trainee count and contract term. If LTS has other real, sellable line items (e.g. paid onsite training, custom professional-body modules) that should appear as separate products, they need to be supplied — nothing here is invented.

---

## Development Workflow (D5)

All development follows the **D5 agentic workflow** with continuous progress tracking.

| Command | Description |
|---------|-------------|
| `StartTask LTSPC-XXXX` | Start a new task through the D5 phases |
| `ReviewTasks` | Review all incomplete tasks and resume where you left off |

### Agent Configuration

| File | Purpose |
|------|--------|
| `.github/copilot-instructions.md` | D5 workflow definition, task tracking, phase gates |
| `agents.md` | Behavioral guidelines — think first, simplicity, surgical changes |
| `memorybank/project-context.md` | Tech stack rules, coding conventions, anti-patterns |

### Documentation (Memory Bank)

| File | Contents |
|------|----------|
| `memorybank/architecture.md` | Solution structure, layers, key design decisions |
| `memorybank/features.md` | Feature list and high-level behavior |
| `memorybank/integrations.md` | External services and APIs |
| `memorybank/setup.md` | Local development setup |
| `memorybank/ticket-progress.md` | Status tracker for all tickets across sessions |
| `memorybank/changelog.md` | Ad-hoc changes outside task files |
| `memorybank/components/` | Per-feature documentation (business rules, data flow, validation) |

This scaffold follows the [Agent Harness Setup Prompt](https://github.com/thompsonataccso/setup-agent-harness-prompt.md) workflow (project name: **LTS Pricing Calculator**, ticket prefix: **LTSPC**, context output: `memorybank/`).
