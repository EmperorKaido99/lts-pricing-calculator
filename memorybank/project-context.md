---
date: '2026-07-27'
sections_completed: [stack, language, framework, testing, style, workflow, gotchas]
status: 'complete'
---

# Project Context for AI Agents

_This file contains the unobvious rules and patterns AI agents must follow when implementing code in this project. It is not a tutorial or onboarding doc — it captures the things an agent would otherwise get wrong._

---

## Technology Stack & Versions

- Plain HTML5 + CSS3 + vanilla JavaScript (ES2017+). **No framework, no bundler, no npm build step.**
- One external dependency, loaded via CDN in `index.html`: SheetJS (`xlsx.full.min.js`) for the Export-to-Excel button. Nothing else is installed.
- Runs as static files. Deployable by copying the folder onto any web host (including inside the existing WordPress site as a standalone page/embed) or serving via any static file server.

## Critical Implementation Rules

### Language-Specific Rules

- Use `const`/`let`, never `var`.
- All modules are IIFEs or plain objects attached as `const X = (() => {...})()` — there is no module bundler, so `<script>` load order in `index.html` matters: `data.js` → `calculator.js` → `export.js` → `app.js`.
- No TypeScript. Keep functions small and named clearly instead of relying on types.

### Framework-Specific Rules

- N/A — no framework. Don't introduce React/Vue/etc. without an explicit request; it would require a build step this project deliberately doesn't have.

### Testing Rules

- `js/data.js` and `js/calculator.js` are pure (no DOM access) by design, specifically so they can be sanity-checked with plain Node — no test framework is installed. Pattern used during development:
  ```bash
  cat js/data.js js/calculator.js > /tmp/combined.js
  echo "console.log(LTSCalculator.calcLine({trainees:15, contractId:'payg'}))" >> /tmp/combined.js
  node /tmp/combined.js
  ```
- Any change to pricing math in `calculator.js` must be re-checked against the published rates in `data.js` before merging.

### Code Quality & Style Rules

- Money values: always run through `LTSCalculator.formatCurrency()` for display — never hand-format currency strings.
- Never hardcode a rand amount, VAT rate, or trainee bracket anywhere outside `js/data.js`. If a number changes, only `data.js` should need to change.
- CSS uses custom properties defined in `:root` in `css/styles.css` (`--navy-900`, `--teal-500`, etc.) — reuse these tokens rather than introducing new hex values inline.

### Development Workflow Rules

- No CI/CD is configured yet. Verify changes by opening `index.html` directly in a browser (or a local static server) and by re-running the Node sanity checks above for any calculator change.
- Keep `README.md`'s "what LTS actually sells" framing in sync with `js/data.js` if LTS's real pricing page changes.

### Critical "Don't-Miss" Rules

- **`js/data.js` rates are sourced from the live public pricing page** (`https://www.ltsystems.co.za/pricing/`) as of 2026-07-27. They are real published figures, not placeholders — do not treat them as sample/dummy data, and do not invent additional paid products or support tiers that aren't on that page without checking with a human first.
- Pricing is **bracket-based, not marginal**: once a trainee count falls in a bracket, the bracket's rate applies to *all* trainees in that line, not just the trainees above the previous bracket boundary. See `getTierForCount()` in `calculator.js`.
- VAT is 15% (South Africa standard rate, confirmed unchanged in the 2026 Budget). It's a display toggle only (`state.showVat`) — published rates are stored excl. VAT.
- Save/Share have **no backend**: Save writes to `localStorage` (with an in-memory fallback if storage is blocked, e.g. inside a sandboxed preview), and Share encodes the estimate into a URL hash. Don't assume a database exists.
- The "Contact Support" bubble intentionally does **not** open a live chat widget — LTS doesn't have one; it just surfaces the real phone numbers and email from `LTS_DATA.contact`.

---

## Usage Guidelines

**For AI agents:** Read this file before implementing. When a rule applies, follow it exactly. When in doubt between this file and a generic best practice, prefer this file.

**For humans maintaining this file:** Keep it lean. Every rule consumes context budget on every future invocation. If a rule has become obvious from the code itself, remove it. Update when the tech stack or conventions change.

Last Updated: 2026-07-27
