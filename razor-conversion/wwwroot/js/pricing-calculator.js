/**
 * LTS Pricing Calculator — client-side app bundle
 *
 * This file is the original site's four JS files concatenated, in their
 * original <script> load order, with no logic changes:
 *   1. data.js        — pricing/product/FAQ data (edit HERE for rate changes)
 *   2. calculator.js  — pure pricing/escalation math, no DOM access
 *   3. export.js      — Excel export, save/share-link helpers
 *   4. app.js         — DOM wiring: tabs, forms, rendering (runs on load)
 * Each section below is marked so you can still jump to the right file.
 *
 * Loaded from Index.cshtml's @section Scripts, after the SheetJS (xlsx)
 * CDN script that export.js's Excel export depends on.
 */

/* ===== 1/4: data.js — pricing & content ===== */
/* ===== 1/4: data.js — pricing & content ===== */
/**
 * LTS Pricing Calculator — data model
 *
 * Source of truth: https://www.ltsystems.co.za/pricing/
 * All rates are ZAR, per trainee, per month, EXCLUDING VAT, valid until 31 Mar 2027.
 * LTS escalates prices on 1 April each year by ~previous year's average CPI (SARB figure).
 *
 * IMPORTANT: these figures were pulled from the live public pricing page. If LTS
 * updates the published rates, update ONLY this file — nothing else needs to change.
 */

const LTS_DATA = {
  companyName: "LTS",
  fullName: "Learner Tracking Systems",
  currency: "ZAR",
  currencySymbol: "R",
  vatRate: 0.15, // South Africa standard VAT rate, unchanged in the 2026 Budget
  pricesValidUntil: "31 March 2027",
  escalationNote:
    "LTS escalates prices on 1 April each year by an amount that approximates the previous year's average CPI inflation figure issued by the South African Reserve Bank.",
  annualEscalationPct: 6.6, // confirmed CPI-based increase applying from 1 April

  // "Cost of NOT using LTS" — a manual/paper baseline the customer compares
  // against. These are editable ASSUMPTIONS shown to the user, not LTS charges.
  // Structure follows Susan's four hidden-cost categories (2026-09-14 feedback):
  //   1. Learner & Training Programme Administration
  //   2. Monitoring, Follow-Up & Exception Handling
  //   3. Reporting, Status Updates & Compliance
  //   4. Management Time & Ad-hoc Information Requests
  // "trainees" is a plain editable number (not auto-summed from estimate
  // lines) so the figure stays correct once add-on products like Time Sheet
  // are added to the estimate.
  manualBaseline: {
    trainees: 50, // number of active trainees/employees being assessed
    adminHoursPerTrainee: 0.75, // category 1: hours/trainee/month on learner & programme admin
    adminRate: 220, // category 1 & 2: administrator cost per hour (ZAR)
    monitorHours: 8, // category 2: hours/month monitoring, following up, handling exceptions
    reportingHours: 6, // category 3: hours/month on reports, status updates, compliance/audit info
    ldRate: 280, // category 3: L&D / Compliance administrator cost per hour (ZAR)
    managementHours: 5, // category 4: management hours/month on queries & programme review
    managementRate: 450, // category 4: management cost per hour (ZAR)
  },

  contact: {
    phone1: "086 110 5966",
    phone2: "012 253 0017",
    email: "info@LTSystems.co.za",
  },

  // Everything LTS sells. The core platform is priced by trainee count
  // (tiered); add-on services like Time Sheet are billed separately, flat
  // per user, with no volume brackets.
  products: [
    {
      id: "platform",
      name: "LTS - Practical Experience and Learner Tracking Platform",
      tagline: "The preferred electronic assessment solution for training offices",
      description:
        "A web-based platform for managing trainee assessments, competency tracking and reporting — accessible anywhere, with no software to install and no per-user licensing fees.",
      valueProps: [
        "24/7 web-based access — no installation, works on any device",
        "Full compliance with SAICA, CIMA, ACCA, IIA, Compliance Institute, SAIGA and SAIPA requirements",
        "Extensive reporting: outcome status, progress, score grid, moderator review reports",
        "Help desk support 07:00–19:00 on business days, 10:00–13:00 weekends & holidays",
        "99.99% average uptime",
        "No licensing fees, no installation fees — only the ongoing per-trainee subscription",
        "Records retained for at least 5 years after a trainee is signed off",
      ],
      pricingModel: "tiered",
    },
    {
      id: "timesheet",
      name: "TS - Timesheet Tracking",
      tagline: "Staff time tracking, billed separately from the assessment platform",
      description:
        "A standalone module for logging and reporting staff time. Priced per timesheet user — flat, not per trainee, with no volume brackets.",
      valueProps: [
        "One flat rate per timesheet user, regardless of trainee count",
        "Billed separately from the LTS - Practical Experience and Learner Tracking Platform",
        "Same subscription model — no installation or licensing fees",
      ],
      pricingModel: "flat",
      flatRate: 59.24, // ZAR per timesheet user per month, excl. VAT
    },
  ],

  // Trainee volume brackets — the published price applies to ALL trainees once a firm
  // falls in a bracket (not a marginal/graduated rate).
  tiers: [
    { id: "1-29", label: "1 – 29 trainees", min: 1, max: 29, sample: 15 },
    { id: "30-99", label: "30 – 99 trainees", min: 30, max: 99, sample: 60 },
    { id: "100-249", label: "100 – 249 trainees", min: 100, max: 249, sample: 150 },
    { id: "250-499", label: "250 – 499 trainees", min: 250, max: 499, sample: 350 },
    { id: "500+", label: "500+ trainees", min: 500, max: Infinity, sample: 600 },
  ],

  // Contract terms — locking in a longer term unlocks a lower monthly rate.
  contracts: [
    { id: "payg", label: "Pay-as-you-go", years: 0, badge: null },
    { id: "1yr", label: "1 Year Contract", years: 1, badge: null },
    { id: "2yr", label: "2 Year Contract", years: 2, badge: "Popular" },
    { id: "3yr", label: "3 Year Contract", years: 3, badge: "Best value" },
  ],

  // Rate per trainee per month, excl. VAT (ZAR) — [contractId][tierId]
  rates: {
    payg: { "1-29": 418.23, "30-99": 350.61, "100-249": 250.69, "250-499": 223.77, "500+": 209.41 },
    "1yr": { "1-29": 330.27, "30-99": 286.59, "100-249": 223.77, "250-499": 198.05, "500+": 195.65 },
    "2yr": { "1-29": 266.25, "30-99": 223.77, "100-249": 209.41, "250-499": 181.29, "500+": 169.92 },
    "3yr": { "1-29": 223.77, "30-99": 209.41, "100-249": 198.05, "250-499": 169.92, "500+": 160.94 },
  },

  // Ready-made estimate templates — mirrors Azure's "estimate templates" concept.
  // Each groups a representative trainee count + contract term for a common firm profile.
  templates: [
    {
      id: "new-small-firm",
      name: "New Client — Small Firm",
      description: "Just switching to LTS or starting out. Flexible, no long-term commitment.",
      trainees: 15,
      contractId: "payg",
      audience: "new",
    },
    {
      id: "growing-firm",
      name: "Growing Firm",
      description: "A firm with a growing trainee intake, ready to lock in a better rate.",
      trainees: 60,
      contractId: "1yr",
      audience: "both",
    },
    {
      id: "established-firm",
      name: "Established Training Office",
      description: "A firm with a steady trainee base looking for predictable costs.",
      trainees: 150,
      contractId: "2yr",
      audience: "both",
    },
    {
      id: "large-training-office",
      name: "Large Training Office",
      description: "Multiple offices or a large annual intake, committing for maximum savings.",
      trainees: 350,
      contractId: "3yr",
      audience: "existing",
    },
    {
      id: "enterprise-national",
      name: "Enterprise / National Firm",
      description: "500+ trainees across regions — LTS's best available rate.",
      trainees: 600,
      contractId: "3yr",
      audience: "existing",
    },
  ],

  faqs: [
    {
      category: "Becoming an LTS subscriber",
      items: [
        {
          q: "How do I subscribe to LTS?",
          a: "Three steps: LTS signs a Client Service Level Agreement with you (including a system walkthrough and pricing), your company details and payment option are confirmed and captured, then all users are registered — larger clients can bulk-upload their user list.",
        },
        {
          q: "Can I see a demo first?",
          a: "Yes — contact the LTS team to arrange a free demo before you commit.",
        },
      ],
    },
    {
      category: "What's included in the price",
      items: [
        {
          q: "What do I actually get for the monthly fee?",
          a: "A 24/7 web-based assessment platform, compliance with your professional body's rules, help-desk support, self-help manuals and video tutorials, and initial onboarding training. The fee only depends on trainee count and features — there's no extra charge for adding other staff/reviewer users.",
        },
        {
          q: "Are there setup, licensing or installation fees?",
          a: "No — LTS charges only the ongoing per-trainee subscription. There are no licensing fees and nothing to install.",
        },
        {
          q: "Is training included?",
          a: "Self-help guides, manuals and tutorial videos are included. Once-off onboarding training can be arranged for new clients; ongoing training for newly added trainees can be arranged at an additional cost, which LTS keeps low by grouping sessions across clients.",
        },
      ],
    },
    {
      category: "Support & reliability",
      items: [
        {
          q: "What are your support hours?",
          a: "Help desk support runs 07:00–19:00 on business days, and 10:00–13:00 on weekends and public holidays. Average response time on business days is around 27 minutes.",
        },
        {
          q: "How reliable is the platform?",
          a: "Average uptime during business hours is 99.99%.",
        },
      ],
    },
    {
      category: "Compliance",
      items: [
        {
          q: "Which professional bodies does LTS support?",
          a: "LTS has been the SAICA-preferred electronic assessment solution provider since 2010, and also supports CIMA, ACCA, IIA, the Compliance Institute, SAIGA and SAIPA.",
        },
      ],
    },
  ],
};

/* ===== 2/4: calculator.js — pricing math ===== */
/**
 * LTS Pricing Calculator — calculation engine
 * Pure functions, no DOM access, so this file is unit-testable on its own.
 */

const LTSCalculator = (() => {
  function getTierForCount(count) {
    const n = Math.max(1, Math.floor(Number(count) || 0));
    return LTS_DATA.tiers.find((t) => n >= t.min && n <= t.max) || LTS_DATA.tiers[LTS_DATA.tiers.length - 1];
  }

  function getTier(tierId) {
    return LTS_DATA.tiers.find((t) => t.id === tierId);
  }

  function getContract(contractId) {
    return LTS_DATA.contracts.find((c) => c.id === contractId);
  }

  function getProduct(productId) {
    return LTS_DATA.products.find((p) => p.id === productId);
  }

  function getRate(contractId, tierId) {
    const row = LTS_DATA.rates[contractId];
    return row ? row[tierId] : undefined;
  }

  /**
   * Compute the estimate for a single line item.
   * @param {{trainees:number, contractId:string}} input
   */
  function calcLine({ trainees, contractId }) {
    const tier = getTierForCount(trainees);
    const rate = getRate(contractId, tier.id);
    const n = Math.max(1, Math.floor(Number(trainees) || 0));
    const monthlyExclVat = n * rate;
    const annualExclVat = monthlyExclVat * 12;
    return {
      trainees: n,
      tier,
      contract: getContract(contractId),
      ratePerTrainee: rate,
      monthlyExclVat,
      annualExclVat,
      monthlyInclVat: monthlyExclVat * (1 + LTS_DATA.vatRate),
      annualInclVat: annualExclVat * (1 + LTS_DATA.vatRate),
    };
  }

  /**
   * % saved on the per-trainee rate vs. Pay-as-you-go, for the same trainee count.
   */
  function calcSavingsVsPayg(trainees, contractId) {
    if (contractId === "payg") return 0;
    const tier = getTierForCount(trainees);
    const paygRate = getRate("payg", tier.id);
    const rate = getRate(contractId, tier.id);
    if (!paygRate || !rate) return 0;
    return ((paygRate - rate) / paygRate) * 100;
  }

  /**
   * Full breakdown across every contract term for a given trainee count —
   * powers the "Savings Options" comparison panel.
   */
  function calcAllContracts(trainees) {
    return LTS_DATA.contracts.map((c) => ({
      ...calcLine({ trainees, contractId: c.id }),
      savingsPct: calcSavingsVsPayg(trainees, c.id),
    }));
  }

  /**
   * The "cost of NOT using LTS" — four categories of hidden admin cost a
   * training office carries doing this by hand (Susan's 2026-09-14 spec):
   *   1. Learner & Training Programme Administration — trainees x hours/trainee x admin rate
   *   2. Monitoring, Follow-Up & Exception Handling — hours x admin rate
   *   3. Reporting, Status Updates & Compliance — hours x L&D/Compliance rate
   *   4. Management Time & Ad-hoc Information Requests — hours x management rate
   * All inputs are caller-supplied assumptions so the user can adjust them;
   * "trainees" is a plain number the user sets directly, not derived from the
   * estimate lines, so the figure stays correct once add-ons (e.g. Time
   * Sheet) are in the estimate too.
   */
  function manualBaselineCost(a) {
    const n = Math.max(0, Math.floor(Number(a.trainees) || 0));
    const adminHoursPerTrainee = Math.max(0, Number(a.adminHoursPerTrainee) || 0);
    const adminRate = Math.max(0, Number(a.adminRate) || 0);
    const monitorHours = Math.max(0, Number(a.monitorHours) || 0);
    const reportingHours = Math.max(0, Number(a.reportingHours) || 0);
    const ldRate = Math.max(0, Number(a.ldRate) || 0);
    const managementHours = Math.max(0, Number(a.managementHours) || 0);
    const managementRate = Math.max(0, Number(a.managementRate) || 0);

    const adminHours = n * adminHoursPerTrainee;
    const admin = adminHours * adminRate;
    const monitor = monitorHours * adminRate;
    const reporting = reportingHours * ldRate;
    const management = managementHours * managementRate;

    const hours = adminHours + monitorHours + reportingHours + managementHours;
    const monthly = admin + monitor + reporting + management;

    return {
      trainees: n,
      hours,
      monthly,
      annual: monthly * 12,
      breakdown: { admin, monitor, reporting, management },
    };
  }

  /**
   * Estimate a single line item regardless of which product it's for.
   * The core platform is tiered (trainees x contract term, via calcLine);
   * flat-rate add-ons (e.g. Time Sheet) are priced per unit and contribute
   * R0 to totals until LTS confirms the rate.
   */
  function calcEstimateLine(line) {
    const product = getProduct(line.productId) || LTS_DATA.products[0];
    if (product.pricingModel === "flat") {
      const n = Math.max(1, Math.floor(Number(line.units) || 0));
      const rate = typeof product.flatRate === "number" ? product.flatRate : null;
      const pricingConfirmed = rate !== null;
      const monthlyExclVat = pricingConfirmed ? n * rate : 0;
      const annualExclVat = monthlyExclVat * 12;
      return {
        product,
        pricingConfirmed,
        units: n,
        ratePerUnit: rate,
        monthlyExclVat,
        annualExclVat,
        monthlyInclVat: monthlyExclVat * (1 + LTS_DATA.vatRate),
        annualInclVat: annualExclVat * (1 + LTS_DATA.vatRate),
      };
    }
    return Object.assign({ product, pricingConfirmed: true }, calcLine(line));
  }

  /**
   * How many of the next 12 months fall before LTS's next 1-April escalation
   * (0 if the escalation date has already passed this cycle, meaning every
   * month ahead is at the new rate).
   */
  function monthsUntilNextEscalation(fromDate) {
    const month = fromDate.getMonth(); // 0-based; April = 3
    return (3 - month + 12) % 12;
  }

  /**
   * "Estimated Annual" for a monthly rate — 12 months forward from today,
   * blended across LTS's confirmed 1-April CPI escalation so the annual
   * figure isn't just today's rate x 12.
   */
  function estimatedAnnual(monthlyExclVat, fromDate = new Date()) {
    const pct = Number(LTS_DATA.annualEscalationPct) || 0;
    const monthsBefore = monthsUntilNextEscalation(fromDate);
    const monthsAfter = 12 - monthsBefore;
    const exclVat = monthlyExclVat * monthsBefore + monthlyExclVat * (1 + pct / 100) * monthsAfter;
    return { exclVat, inclVat: exclVat * (1 + LTS_DATA.vatRate) };
  }

  function formatCurrency(amount, { decimals = 2 } = {}) {
    return (
      LTS_DATA.currencySymbol +
      Number(amount).toLocaleString("en-ZA", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    );
  }

  function formatPercent(value) {
    return `${value >= 0 ? "" : "-"}${Math.abs(value).toFixed(0)}%`;
  }

  /**
   * Sum a list of estimate line items (an "estimate" can hold more than one
   * line — e.g. separate cost centres or offices — same idea as Azure letting
   * you combine several products into one estimate).
   */
  function totalEstimate(lines) {
    return lines.reduce(
      (acc, line) => {
        const calc = calcEstimateLine(line);
        acc.monthlyExclVat += calc.monthlyExclVat;
        acc.annualExclVat += calc.annualExclVat;
        acc.monthlyInclVat += calc.monthlyInclVat;
        acc.annualInclVat += calc.annualInclVat;
        return acc;
      },
      { monthlyExclVat: 0, annualExclVat: 0, monthlyInclVat: 0, annualInclVat: 0 }
    );
  }

  return {
    getTierForCount,
    getTier,
    getContract,
    getProduct,
    getRate,
    calcLine,
    calcEstimateLine,
    calcSavingsVsPayg,
    calcAllContracts,
    manualBaselineCost,
    estimatedAnnual,
    formatCurrency,
    formatPercent,
    totalEstimate,
  };
})();

/* ===== 3/4: export.js — Excel export & save/share ===== */
/**
 * LTS Pricing Calculator — export / save / share helpers
 * No backend required: Export uses SheetJS (client-side .xlsx generation),
 * Save uses browser storage (falls back to in-memory if storage is blocked),
 * Share encodes the estimate into a URL so it can be pasted/emailed.
 */

const LTSExport = (() => {
  const STORAGE_KEY = "lts_pricing_estimates";

  // In-memory fallback so Save never throws, even in sandboxed/embedded contexts
  // where localStorage is unavailable (e.g. an iframe preview).
  let memoryFallback = null;

  function storageAvailable() {
    try {
      const testKey = "__lts_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveEstimate(estimateName, lines) {
    const record = { name: estimateName, savedAt: new Date().toISOString(), lines };
    if (storageAvailable()) {
      const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      all.push(record);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return { ok: true, mode: "local" };
    }
    memoryFallback = memoryFallback || [];
    memoryFallback.push(record);
    return { ok: true, mode: "memory" };
  }

  function loadSavedEstimates() {
    if (storageAvailable()) {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    }
    return memoryFallback || [];
  }

  function buildShareUrl(lines, meta) {
    const payload = { lines, meta };
    const encoded = encodeURIComponent(btoa(JSON.stringify(payload)));
    const url = new URL(window.location.href);
    url.hash = "estimate=" + encoded;
    return url.toString();
  }

  function readShareUrl() {
    const hash = window.location.hash || "";
    const match = hash.match(/estimate=([^&]+)/);
    if (!match) return null;
    try {
      const json = atob(decodeURIComponent(match[1]));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function exportToExcel(lines, meta) {
    if (typeof XLSX === "undefined") {
      alert("Export library did not load — check your internet connection and try again.");
      return;
    }

    const rows = lines.map((line) => {
      const calc = LTSCalculator.calcEstimateLine(line);
      if (calc.product.pricingModel === "flat") {
        return {
          "Line item": line.label || calc.product.name,
          "Trainees": calc.units + " timesheet user(s)",
          "Bracket": "",
          "Contract term": "",
          "Rate per trainee / month (excl. VAT)": calc.pricingConfirmed ? calc.ratePerUnit : "To be confirmed",
          "Monthly (excl. VAT)": calc.pricingConfirmed ? Number(calc.monthlyExclVat.toFixed(2)) : "To be confirmed",
          "Monthly (incl. VAT)": calc.pricingConfirmed ? Number(calc.monthlyInclVat.toFixed(2)) : "To be confirmed",
          "Annual (excl. VAT)": calc.pricingConfirmed ? Number(calc.annualExclVat.toFixed(2)) : "To be confirmed",
          "Annual (incl. VAT)": calc.pricingConfirmed ? Number(calc.annualInclVat.toFixed(2)) : "To be confirmed",
        };
      }
      return {
        "Line item": line.label || calc.tier.label,
        "Trainees": calc.trainees,
        "Bracket": calc.tier.label,
        "Contract term": calc.contract.label,
        "Rate per trainee / month (excl. VAT)": calc.ratePerTrainee,
        "Monthly (excl. VAT)": Number(calc.monthlyExclVat.toFixed(2)),
        "Monthly (incl. VAT)": Number(calc.monthlyInclVat.toFixed(2)),
        "Annual (excl. VAT)": Number(calc.annualExclVat.toFixed(2)),
        "Annual (incl. VAT)": Number(calc.annualInclVat.toFixed(2)),
      };
    });

    const totals = LTSCalculator.totalEstimate(lines);
    rows.push({});
    rows.push({
      "Line item": "TOTAL",
      "Monthly (excl. VAT)": Number(totals.monthlyExclVat.toFixed(2)),
      "Monthly (incl. VAT)": Number(totals.monthlyInclVat.toFixed(2)),
      "Annual (excl. VAT)": Number(totals.annualExclVat.toFixed(2)),
      "Annual (incl. VAT)": Number(totals.annualInclVat.toFixed(2)),
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LTS Estimate");

    const infoRows = [
      ["LTS Pricing Estimate"],
      ["Estimate name", meta?.name || "Untitled estimate"],
      ["Generated", new Date().toLocaleString("en-ZA")],
      ["Prices valid until", LTS_DATA.pricesValidUntil],
      ["Currency", LTS_DATA.currency + " — excludes VAT unless marked otherwise"],
      ["Contact", `${LTS_DATA.contact.phone1} / ${LTS_DATA.contact.email}`],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.book_append_sheet(wb, wsInfo, "Info");

    const filename = `LTS-Estimate-${(meta?.name || "untitled").replace(/[^a-z0-9]+/gi, "-")}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return { saveEstimate, loadSavedEstimates, buildShareUrl, readShareUrl, exportToExcel };
})();

/* ===== 4/4: app.js — DOM wiring ===== */
/**
 * LTS Pricing Calculator — app wiring
 * Talks to LTS_DATA (data.js), LTSCalculator (calculator.js) and LTSExport (export.js).
 */

(function () {
  const state = {
    audience: "new", // 'new' | 'existing'
    lines: [], // [{ id, label, trainees, contractId }]
    showVat: false,
    baseline: Object.assign({}, LTS_DATA.manualBaseline), // "cost of not using LTS" assumptions
  };

  let lineSeq = 0;
  let traineesTouched = false; // true once the user edits "cost of not using LTS" trainee count directly

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const fmt = LTSCalculator.formatCurrency;
  const fmtPct = LTSCalculator.formatPercent;

  function newLine(overrides = {}) {
    lineSeq += 1;
    return Object.assign(
      {
        id: "line-" + lineSeq,
        label: "Line " + lineSeq,
        productId: "platform",
        trainees: 15,
        contractId: "3yr", // LTS's best-value term is the default for a new platform line
        units: 15, // same default as trainees, so a new Time Sheet line isn't just "1"
      },
      overrides
    );
  }

  // ---------- tabs ----------
  function goToTab(tabId) {
    $$(".tabs__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabId));
    $$(".tabpanel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + tabId));
  }

  $$(".tabs__btn").forEach((btn) => btn.addEventListener("click", () => goToTab(btn.dataset.tab)));
  $$("[data-goto-tab]").forEach((btn) => btn.addEventListener("click", () => goToTab(btn.dataset.gotoTab)));

  // ---------- Azure-style "calculator" loading transition ----------
  const calcLoader = {
    el: $("#calc-loader"),
    busy: false,
    show(next) {
      const el = this.el;
      if (!el || this.busy) return;
      this.busy = true;
      el.hidden = false;
      el.classList.remove("is-done");
      void el.offsetWidth; // reflow so the fade-in / progress restart
      el.classList.add("is-visible");
      setTimeout(() => {
        if (typeof next === "function") next(); // swap the page underneath the overlay
        el.classList.add("is-done");
        el.classList.remove("is-visible");
        setTimeout(() => {
          el.hidden = true;
          el.classList.remove("is-done");
          this.busy = false;
        }, 320);
      }, 1150);
    },
  };

  function loadEstimatePage() {
    calcLoader.show(() => goToTab("estimate"));
  }

  function wireLoaderTrigger(el, title) {
    if (!el) return;
    el.classList.add("is-clickable");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.title = title;
    el.addEventListener("click", loadEstimatePage);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        loadEstimatePage();
      }
    });
  }

  // The estimate price — in the top bar AND the bottom totals card — opens the
  // estimate page through the loading transition.
  $$(".topbar__stat").forEach((stat) => wireLoaderTrigger(stat, "Open your estimate"));
  ["#total-upfront", "#total-monthly", "#total-annual"].forEach((sel) =>
    wireLoaderTrigger($(sel), "Recalculate your estimate")
  );

  // ---------- product tab ----------
  function productPriceBlockHtml(product) {
    if (product.pricingModel === "flat") {
      if (typeof product.flatRate !== "number") {
        return `
          <div class="product-card__from">Flat rate</div>
          <div class="product-card__price product-card__price--tbc">Pricing to be confirmed</div>
          <div class="product-card__per">per timesheet user / month, excl. VAT</div>`;
      }
      return `
        <div class="product-card__price">${fmt(product.flatRate)}</div>
        <div class="product-card__per">per Timesheet User / month, excl VAT</div>`;
    }
    // "On average" — the 3-year rate for the smallest/starting bracket, a
    // more honest baseline than the absolute cheapest rate across all tiers.
    const onAverageRate = LTS_DATA.rates["3yr"]["1-29"];
    return `
      <div class="product-card__from">On average</div>
      <div class="product-card__price">${fmt(onAverageRate)}</div>
      <div class="product-card__per">per Trainee / month, excl. VAT</div>`;
  }

  // Build (but don't add) a fresh line for a product, with the line item
  // name defaulting to the product's own name.
  function buildLineForProduct(productId) {
    const product = LTSCalculator.getProduct(productId);
    if (product.pricingModel === "flat") {
      return newLine({ label: product.name, productId, trainees: null, contractId: null });
    }
    return newLine({ label: product.name, productId });
  }

  // Add a product to the estimate once (used by Products-tab "Add to
  // estimate" buttons and the hero CTA) — clicking twice doesn't duplicate.
  function addToEstimateIdempotent(productId) {
    const alreadyAdded = state.lines.some((l) => l.productId === productId);
    if (!alreadyAdded) state.lines.push(buildLineForProduct(productId));
  }

  function productCardHtml(product) {
    const icon = product.pricingModel === "flat" ? "⏱️" : "📋";
    return `
      <div class="product-card">
        <div class="product-card__main">
          <div class="product-card__icon" aria-hidden="true">${icon}</div>
          <div>
            <h2>${product.name}</h2>
            <p class="product-card__tagline">${product.tagline}</p>
            <p class="product-card__desc">${product.description}</p>
            <ul class="product-card__props">${product.valueProps.map((v) => `<li>${v}</li>`).join("")}</ul>
          </div>
        </div>
        <div class="product-card__action">
          ${productPriceBlockHtml(product)}
          <button class="btn btn--primary" data-add-product="${product.id}" type="button">Add to estimate</button>
        </div>
      </div>`;
  }

  function renderProducts() {
    $("#product-list").innerHTML = LTS_DATA.products.map(productCardHtml).join("");

    $$("[data-add-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToEstimateIdempotent(btn.dataset.addProduct);
        renderEstimate();
        goToTab("estimate");
      });
    });
  }

  // Hero "Get started with LTS" — adds the core platform (3-year default)
  // and jumps straight to the estimate.
  $("#btn-hero-get-started").addEventListener("click", () => {
    addToEstimateIdempotent("platform");
    renderEstimate();
    goToTab("estimate");
  });

  // ---------- estimate tab ----------
  function contractOptionHtml(line, contract) {
    const calc = LTSCalculator.calcLine({ trainees: line.trainees, contractId: contract.id });
    const savings = LTSCalculator.calcSavingsVsPayg(line.trainees, contract.id);
    const selected = line.contractId === contract.id;
    return `
      <button type="button" class="contract-option ${selected ? "is-selected" : ""}" data-line="${line.id}" data-contract="${contract.id}">
        <div class="contract-option__label">
          <span>${contract.label}</span>
          ${contract.badge ? `<span class="contract-option__badge">${contract.badge}</span>` : ""}
        </div>
        <div class="contract-option__rate">${fmt(calc.ratePerTrainee)} <span style="font-weight:400;font-size:11px;color:var(--text-muted)">/trainee/month</span></div>
        ${savings > 0 ? `<div class="contract-option__save">Save ${fmtPct(savings)} vs pay-as-you-go</div>` : `<div class="contract-option__save" style="color:var(--text-muted)">Reference rate</div>`}
      </button>`;
  }

  function lineHtml(line) {
    const product = LTSCalculator.getProduct(line.productId) || LTS_DATA.products[0];
    return product.pricingModel === "flat" ? flatLineHtml(line, product) : tieredLineHtml(line);
  }

  function tieredLineHtml(line) {
    const calc = LTSCalculator.calcLine({ trainees: line.trainees, contractId: line.contractId });
    const annualEst = LTSCalculator.estimatedAnnual(calc.monthlyExclVat);
    const removeBtn = state.lines.length > 1 ? `<button class="line-item__remove" data-remove="${line.id}" title="Remove line" type="button">✕</button>` : "";
    return `
      <div class="card line-item" data-line-card="${line.id}">
        ${removeBtn}
        <div class="line-item__grid">
          <div class="field">
            <label for="name-${line.id}">Line item name</label>
            <input type="text" id="name-${line.id}" data-field="label" data-line="${line.id}" value="${line.label}" />
          </div>
          <div class="field">
            <label for="trainees-${line.id}">Number of trainees</label>
            <input type="number" min="1" id="trainees-${line.id}" data-field="trainees" data-line="${line.id}" value="${line.trainees}" />
            <div class="line-item__tier">Bracket: ${calc.tier.label}</div>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div class="line-item__result">
              <span>Monthly<br/><b>${fmt(state.showVat ? calc.monthlyInclVat : calc.monthlyExclVat)}</b></span>
              <span>Estimated Annual<br/><b>${fmt(state.showVat ? annualEst.inclVat : annualEst.exclVat)}</b></span>
            </div>
          </div>
        </div>
        <div class="contract-options">
          ${LTS_DATA.contracts.map((c) => contractOptionHtml(line, c)).join("")}
        </div>
      </div>`;
  }

  function flatLineHtml(line, product) {
    const calc = LTSCalculator.calcEstimateLine(line);
    const removeBtn = state.lines.length > 1 ? `<button class="line-item__remove" data-remove="${line.id}" title="Remove line" type="button">✕</button>` : "";

    if (!calc.pricingConfirmed) {
      const subject = encodeURIComponent(`${product.name} pricing for ${line.label}`);
      return `
        <div class="card line-item line-item--tbc" data-line-card="${line.id}">
          ${removeBtn}
          <div class="line-item__grid">
            <div class="field">
              <label for="name-${line.id}">Line item name</label>
              <input type="text" id="name-${line.id}" data-field="label" data-line="${line.id}" value="${line.label}" />
            </div>
            <div class="field">
              <label for="units-${line.id}">Number of timesheet users</label>
              <input type="number" min="1" id="units-${line.id}" data-field="units" data-line="${line.id}" value="${line.units}" />
            </div>
            <div class="field">
              <label>&nbsp;</label>
              <div class="line-item__tbc">
                <strong>Pricing to be confirmed</strong>
                <span>Not included in your totals yet.</span>
                <a class="linklike" href="mailto:${LTS_DATA.contact.email}?subject=${subject}">Contact LTS for a quote</a>
              </div>
            </div>
          </div>
        </div>`;
    }

    const annualEst = LTSCalculator.estimatedAnnual(calc.monthlyExclVat);
    return `
      <div class="card line-item" data-line-card="${line.id}">
        ${removeBtn}
        <div class="line-item__grid">
          <div class="field">
            <label for="name-${line.id}">Line item name</label>
            <input type="text" id="name-${line.id}" data-field="label" data-line="${line.id}" value="${line.label}" />
          </div>
          <div class="field">
            <label for="units-${line.id}">Number of timesheet users</label>
            <input type="number" min="1" id="units-${line.id}" data-field="units" data-line="${line.id}" value="${line.units}" />
            <div class="line-item__tier">Flat rate: ${fmt(calc.ratePerUnit)}/user/month</div>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div class="line-item__result">
              <span>Monthly<br/><b>${fmt(state.showVat ? calc.monthlyInclVat : calc.monthlyExclVat)}</b></span>
              <span>Estimated Annual<br/><b>${fmt(state.showVat ? annualEst.inclVat : annualEst.exclVat)}</b></span>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderEstimate() {
    const hasLines = state.lines.length > 0;
    $("#estimate-empty").hidden = hasLines;
    $("#estimate-builder").hidden = !hasLines;
    $("#tab-line-count").hidden = !hasLines;
    $("#tab-line-count").textContent = state.lines.length;

    $("#estimate-lines").innerHTML = state.lines.map(lineHtml).join("");

    // wire per-line inputs
    $$('[data-field="trainees"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const line = state.lines.find((l) => l.id === e.target.dataset.line);
        line.trainees = Math.max(1, parseInt(e.target.value, 10) || 1);
        renderEstimate();
      });
    });
    $$('[data-field="units"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const line = state.lines.find((l) => l.id === e.target.dataset.line);
        line.units = Math.max(1, parseInt(e.target.value, 10) || 1);
        renderEstimate();
      });
    });
    $$('[data-field="label"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        const line = state.lines.find((l) => l.id === e.target.dataset.line);
        line.label = e.target.value || line.label;
      });
    });
    $$(".contract-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const line = state.lines.find((l) => l.id === btn.dataset.line);
        line.contractId = btn.dataset.contract;
        renderEstimate();
      });
    });
    $$("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lines = state.lines.filter((l) => l.id !== btn.dataset.remove);
        renderEstimate();
      });
    });

    renderTotals();
  }

  // Populate the "+ Add line" product picker once, from the product catalogue.
  LTS_DATA.products.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    $("#add-line-select").appendChild(opt);
  });
  $("#add-line-select").addEventListener("change", (e) => {
    const productId = e.target.value;
    if (!productId) return;
    state.lines.push(buildLineForProduct(productId));
    e.target.value = "";
    renderEstimate();
  });

  $("#btn-clear-estimate").addEventListener("click", () => {
    if (confirm("Clear the whole estimate?")) {
      state.lines = [];
      renderEstimate();
      goToTab("products");
    }
  });

  $("#toggle-vat").addEventListener("change", (e) => {
    state.showVat = e.target.checked;
    renderEstimate();
  });

  // "Cost of not using LTS" assumption inputs — Susan's 4-category model
  // (2026-09-14 feedback). "trainees" is auto-filled from the estimate's
  // total trainee count until the user edits it directly, at which point it
  // stops auto-syncing — this is what fixes the old bug where adding a
  // non-trainee-priced line (e.g. Time Sheet) threw the figure off.
  const baselineInputs = {
    "#assume-trainees": "trainees",
    "#assume-admin-hours": "adminHoursPerTrainee",
    "#assume-admin-rate": "adminRate",
    "#assume-monitor-hours": "monitorHours",
    "#assume-reporting-hours": "reportingHours",
    "#assume-ld-rate": "ldRate",
    "#assume-management-hours": "managementHours",
    "#assume-management-rate": "managementRate",
  };
  Object.entries(baselineInputs).forEach(([sel, key]) => {
    const input = $(sel);
    if (!input) return;
    input.value = state.baseline[key];
    input.addEventListener("input", () => {
      if (sel === "#assume-trainees") traineesTouched = true;
      const v = parseFloat(input.value);
      state.baseline[key] = isNaN(v) || v < 0 ? 0 : v;
      renderTotals();
    });
  });

  function ctaHtml() {
    if (state.lines.length === 0) return "";
    const primaryLine = state.lines.find((l) => l.contractId);
    if (!primaryLine) {
      // No priced line yet (e.g. only a "pricing to be confirmed" add-on) —
      // there's no plan to sign up on, so point them at a quote instead.
      return `<a class="btn btn--primary" target="_blank" rel="noopener" href="mailto:${LTS_DATA.contact.email}?subject=LTS pricing enquiry">Contact LTS for a quote</a>`;
    }
    const contract = LTSCalculator.getContract(primaryLine.contractId);
    if (state.audience === "new") {
      const signupParam = contract.id === "payg" ? "Pay-as-you-go" : contract.years + "-Year-Contract";
      return `<a class="btn btn--primary" target="_blank" rel="noopener" href="https://www.ltsystems.co.za/sign-up/?type_of_contract=${encodeURIComponent(signupParam)}">Sign up on this plan</a>`;
    }
    return `<a class="btn btn--primary" target="_blank" rel="noopener" href="mailto:${LTS_DATA.contact.email}?subject=Update our LTS plan">Contact support to update your plan</a>`;
  }

  // Update a cost figure and pulse it when the value actually changes, so the
  // running estimate is visibly "live" at both the top bar and the totals card.
  function setCost(sel, text) {
    const el = $(sel);
    if (!el) return;
    if (el.textContent !== text) {
      el.textContent = text;
      el.classList.remove("cost-pulse");
      void el.offsetWidth; // restart the animation
      el.classList.add("cost-pulse");
    }
  }

  function renderTotals() {
    const totals = state.lines.length
      ? LTSCalculator.totalEstimate(state.lines)
      : { monthlyExclVat: 0, annualExclVat: 0, monthlyInclVat: 0, annualInclVat: 0 };
    const monthly = state.showVat ? totals.monthlyInclVat : totals.monthlyExclVat;
    const annualEst = LTSCalculator.estimatedAnnual(totals.monthlyExclVat);
    const annual = state.showVat ? annualEst.inclVat : annualEst.exclVat;

    // LTS charges no setup / installation / licensing fee, so the upfront cost
    // is always R0.00 — shown live at the top and bottom for transparency.
    setCost("#stat-upfront", fmt(0));
    setCost("#total-upfront", fmt(0));
    setCost("#stat-monthly", fmt(monthly));
    setCost("#total-monthly", fmt(monthly));
    setCost("#total-annual", fmt(annual));

    $("#totals-cta").innerHTML = state.lines.length ? ctaHtml() : "";

    renderComparison(monthly);
  }

  // "The cost of NOT using LTS" — compare the manual baseline against the
  // currently displayed LTS monthly cost, live. Trainee count auto-fills
  // from the estimate's lines until the user overrides it directly (see
  // baselineInputs wiring above) — kept editable rather than silently
  // summed, per Susan's feedback, since some products (e.g. Time Sheet)
  // aren't priced per trainee and shouldn't skew the figure.
  function renderComparison(ltsMonthly) {
    if (state.lines.length === 0) return;
    if (!traineesTouched) {
      const totalTrainees = state.lines.reduce((sum, l) => sum + (parseInt(l.trainees, 10) || 0), 0);
      if (totalTrainees > 0) {
        state.baseline.trainees = totalTrainees;
        const traineesInput = $("#assume-trainees");
        if (traineesInput && document.activeElement !== traineesInput) {
          traineesInput.value = totalTrainees;
        }
      }
    }
    const base = LTSCalculator.manualBaselineCost(state.baseline);

    setCost("#cmp-without-monthly", fmt(base.monthly));
    setCost("#cmp-with-monthly", fmt(ltsMonthly));
    setCost("#cmp-admin", fmt(base.breakdown.admin));
    setCost("#cmp-monitor", fmt(base.breakdown.monitor));
    setCost("#cmp-reporting", fmt(base.breakdown.reporting));
    setCost("#cmp-management", fmt(base.breakdown.management));

    const saveMonthly = base.monthly - ltsMonthly;
    const saveAnnual = saveMonthly * 12;
    const hoursLabel = `<b>${base.hours.toLocaleString("en-ZA", { maximumFractionDigits: 1 })}</b> hours`;
    const savingsEl = $("#cmp-savings");
    if (saveMonthly >= 0) {
      savingsEl.classList.remove("is-negative");
      savingsEl.innerHTML =
        `With LTS you save <b>${fmt(saveMonthly)}</b> a month — that's <b>${fmt(saveAnnual)}</b> a year ` +
        `and ${hoursLabel} of staff time handed back every month.`;
    } else {
      savingsEl.classList.add("is-negative");
      savingsEl.innerHTML =
        `At these settings LTS is about <b>${fmt(-saveMonthly)}</b> a month more than doing it by hand — ` +
        `but it still frees up ${hoursLabel} every month and removes the compliance, filing and audit risk.`;
    }
  }

  // ---------- export ----------
  $("#btn-export").addEventListener("click", () => {
    if (state.lines.length === 0) return;
    LTSExport.exportToExcel(state.lines, { name: $("#input-estimate-name").value });
  });

  function renderSavedList() {
    const saved = LTSExport.loadSavedEstimates();
    const container = $("#saved-list");
    if (saved.length === 0) {
      container.innerHTML = `<p class="empty-note">No saved estimates yet. Build an estimate and click Save.</p>`;
      return;
    }
    container.innerHTML = saved
      .map((s, i) => {
        const totals = LTSCalculator.totalEstimate(s.lines);
        return `
        <div class="saved-item">
          <div>
            <div><strong>${s.name}</strong></div>
            <div class="saved-item__meta">Saved ${new Date(s.savedAt).toLocaleString("en-ZA")} · ${s.lines.length} line item(s)</div>
          </div>
          <div>
            <div><strong>${fmt(totals.monthlyExclVat)}</strong> /month excl. VAT</div>
            <button class="linklike" data-load-saved="${i}" type="button">Load into estimate</button>
          </div>
        </div>`;
      })
      .join("");

    $$("[data-load-saved]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = saved[parseInt(btn.dataset.loadSaved, 10)];
        state.lines = s.lines.map((l) => newLine(l));
        $("#input-estimate-name").value = s.name;
        renderEstimate();
        goToTab("estimate");
      });
    });
  }

  // ---------- templates ----------
  function renderTemplates() {
    $("#template-grid").innerHTML = LTS_DATA.templates
      .map((t) => {
        const calc = LTSCalculator.calcLine({ trainees: t.trainees, contractId: t.contractId });
        return `
        <div class="template-card">
          <h3>${t.name}</h3>
          <p>${t.description}</p>
          <div class="template-card__meta">${t.trainees} trainees · ${LTSCalculator.getContract(t.contractId).label}</div>
          <div><strong>${fmt(calc.monthlyExclVat)}</strong> <span style="font-size:12px;color:var(--text-muted)">/month excl. VAT</span></div>
          <button class="btn btn--outline" data-use-template="${t.id}" type="button">Use this template</button>
        </div>`;
      })
      .join("");

    $$("[data-use-template]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = LTS_DATA.templates.find((x) => x.id === btn.dataset.useTemplate);
        state.lines = [newLine({ label: t.name, trainees: t.trainees, contractId: t.contractId })];
        $("#input-estimate-name").value = t.name;
        renderEstimate();
        goToTab("estimate");
      });
    });
  }

  // ---------- FAQs ----------
  function renderFaqs() {
    $("#faq-list").innerHTML = LTS_DATA.faqs
      .map(
        (cat) => `
        <div class="faq-category">
          <h3>${cat.category}</h3>
          ${cat.items
            .map(
              (item) => `
            <details class="faq-item">
              <summary>${item.q}</summary>
              <p>${item.a}</p>
            </details>`
            )
            .join("")}
        </div>`
      )
      .join("");
  }

  // ---------- shared-link restore ----------
  function restoreFromShareUrl() {
    const payload = LTSExport.readShareUrl();
    if (!payload || !payload.lines || !payload.lines.length) return false;
    state.lines = payload.lines.map((l) => newLine(l));
    if (payload.meta?.name) $("#input-estimate-name").value = payload.meta.name;
    if (payload.meta?.audience) {
      state.audience = payload.meta.audience;
    }
    return true;
  }

  // ---------- init ----------
  function init() {
    $("#prices-valid-until").textContent = LTS_DATA.pricesValidUntil;
    renderProducts();
    renderTemplates();
    renderFaqs();
    renderSavedList();

    const restored = restoreFromShareUrl();
    renderEstimate();
    if (restored) goToTab("estimate");
  }

  init();
})();
