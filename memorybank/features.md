# Features

## Active Features

| Feature | Description | Status |
|---------|-------------|--------|
| Products catalog | Single LTS platform product card with real value props from ltsystems.co.za/features | ✅ Live |
| New vs. existing customer toggle | Changes the estimate CTA (Sign Up link vs. Contact Support to upgrade) | ✅ Live |
| Estimate builder | Add one or more line items, each with trainee count + contract term, auto-detects the correct pricing bracket | ✅ Live |
| Contract term comparison | Per line item, compares Pay-as-you-go / 1yr / 2yr / 3yr side by side with real computed savings % | ✅ Live |
| Estimate templates | Five preset firm profiles (New Client, Growing Firm, Established, Large Training Office, Enterprise) | ✅ Live |
| VAT toggle | Switches all displayed prices between excl./incl. 15% VAT | ✅ Live |
| Export to Excel | Generates a `.xlsx` with a line-item breakdown + totals, via SheetJS, no backend | ✅ Live |
| Save | Persists the current estimate to the browser (localStorage, with in-memory fallback) | ✅ Live |
| Share | Encodes the estimate into a shareable URL; loading that URL restores the estimate | ✅ Live |
| Saved estimates tab | Lists everything saved on this device, with a "load into estimate" action | ✅ Live |
| FAQs tab | Grouped, accordion FAQ content sourced from ltsystems.co.za/faq | ✅ Live |
| Contact Support bubble | Fixed bottom-right bubble showing real LTS phone numbers/email (no live chat widget) | ✅ Live |

## Not Included (by design)

- No login/authentication — "Log in" links out to the real LTS login page.
- No server-side estimate storage — Save is device-local only.
- No additional paid products/support tiers — LTS's public pricing page lists exactly one product, so the calculator reflects that honestly rather than inventing SKUs.
