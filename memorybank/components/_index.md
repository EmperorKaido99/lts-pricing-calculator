# Component Documentation

This folder contains detailed documentation for each feature/component in the system. Each file documents one logical component — its business rules, data flow, UI interactions, validation, and integration points.

## Purpose

When an agent needs to modify a feature, it reads the relevant component doc to understand:
- **What** the feature does (business rules, user-facing behavior)
- **How** data flows through the system (UI → calculator → render, or UI → export/save/share)
- **Where** the code lives (files, modules, layers involved)
- **Why** certain decisions were made (constraints, edge cases, gotchas)

## File Naming

Use kebab-case matching the feature name, e.g.:
- `estimate-builder.md` — the line-item builder and contract-term selector
- `pricing-calculator.md` — tier/rate lookup and cost math
- `export-save-share.md` — Excel export, local save, share links

## Template

Each component doc should follow this structure:

---

# [Component/Feature Name]

## Overview
_(1–2 sentences: what this feature does from the user's perspective)_

## Business Rules
- Rule 1: ...
- Rule 2: ...
- Rule 3: ...

## Data Flow
```
[Trigger] → [UI element] → [JS function] → [render]
```
### Step-by-step:
1. User does X in the UI
2. Event handler in `app.js` calls ...
3. `LTSCalculator` computes ...
4. DOM is re-rendered with the result

## Validation Rules

| Field | Rule | Where Enforced | Error Message |
|-------|------|----------------|---------------|
| trainees | Must be ≥ 1 | Client (`app.js`) | N/A — clamps to 1 |

## Key Files

| File | Role |
|------|------|
| `js/app.js` | UI wiring |
| `js/calculator.js` | Pricing math |

## Edge Cases & Gotchas
- _(Things that have caused bugs or confusion before)_

## Related Components
- [Link to related component doc]

---
