# Architecture

## Project Structure

```
lts-pricing-calculator/
├── index.html              # Page shell: header, tabs, all panels, support bubble
├── css/
│   └── styles.css          # All styling, custom-property design tokens
├── js/
│   ├── data.js              # LTS_DATA — pricing table, tiers, contracts, templates, FAQs, contact info
│   ├── calculator.js        # LTSCalculator — pure pricing math (no DOM access)
│   ├── export.js            # LTSExport — Excel export (SheetJS), Save (localStorage), Share (URL hash)
│   └── app.js                # UI wiring: tabs, product card, estimate builder, templates, FAQs, bubble
├── agents.md                 # Agent behavioral guidelines
├── .github/
│   ├── copilot-instructions.md   # D5 workflow definition
│   └── skills/generate-project-context/  # Sub-agent: (re)generates project-context.md
└── memorybank/                # This folder — persistent project knowledge for AI agents
```

## Key Modules

| Module | Responsibility |
|--------|---------------|
| `LTS_DATA` (data.js) | Single source of truth for every number and piece of copy shown in the UI |
| `LTSCalculator` (calculator.js) | Tier lookup, rate lookup, per-line cost math, savings %, currency/percent formatting, totals across multiple line items |
| `LTSExport` (export.js) | Excel export via SheetJS, Save to localStorage (with in-memory fallback), Share via URL-encoded estimate |
| `app.js` | Owns UI state (`{ audience, lines[], showVat }`), renders every tab, wires all event listeners |

## Data Flow

```
User input (trainees, contract term, audience)
        ↓
  app.js state.lines[]
        ↓
  LTSCalculator.calcLine() / totalEstimate()  ← reads LTS_DATA
        ↓
  DOM render (product card / line items / totals / savings)
        ↓
  Export / Save / Share  →  LTSExport (SheetJS / localStorage / URL hash)
```

There is no backend and no build step. Everything runs client-side once `index.html` is loaded.
