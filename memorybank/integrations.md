# Integrations

## External APIs / Services

| Service | Purpose | Auth Method | Notes |
|---------|---------|-------------|-------|
| SheetJS (`xlsx.full.min.js`, cdnjs.cloudflare.com) | Client-side generation of the exported `.xlsx` estimate | None (public CDN script) | Loaded in `index.html` before `js/*.js`. If offline, `LTSExport.exportToExcel()` shows an alert instead of failing silently. |
| `ltsystems.co.za/login/` | External link only — "Log in" button/banner | N/A (LTS's own auth, not integrated here) | This calculator doesn't authenticate users itself |
| `ltsystems.co.za/sign-up/` | External link only — "Sign up on this plan" CTA for new customers, pre-filled via `?type_of_contract=` query param matching LTS's real sign-up URL pattern | N/A | See `ctaHtml()` in `app.js` |
| `mailto:` / `tel:` links | Support bubble and "Contact support" CTA for existing customers | N/A | Uses real LTS contact details from `LTS_DATA.contact` |

No API keys, tokens, or server-side integrations exist in this project.
