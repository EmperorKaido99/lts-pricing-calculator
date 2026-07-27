# Setup

## Prerequisites

- Any modern browser. No Node.js, npm, or build tools are required to run the site.
- Node.js is only useful during development, for sanity-checking `js/calculator.js` from the command line (no test framework is installed).

## Environment Variables

None — this project has no backend and no secrets.

## Getting Started

```bash
# Clone, then just open it — no install step
cd lts-pricing-calculator
open index.html          # macOS
# or serve it locally so relative asset paths behave the same as production:
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Running Tests

There's no test framework installed. To sanity-check pricing math after editing `js/calculator.js` or `js/data.js`:

```bash
cat js/data.js js/calculator.js > /tmp/combined.js
cat >> /tmp/combined.js << 'EOF'
console.log(LTSCalculator.calcLine({ trainees: 15, contractId: 'payg' }));
console.log(LTSCalculator.calcSavingsVsPayg(500, '1yr'));
EOF
node /tmp/combined.js
```

Compare the output against the published rates in `js/data.js` (sourced from https://www.ltsystems.co.za/pricing/).
