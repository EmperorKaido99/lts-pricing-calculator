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

  // "Cost of NOT using LTS" — a manual/paper baseline the customer compares
  // against. These are editable ASSUMPTIONS shown to the user, not LTS charges:
  // the time and money a training office spends doing, by hand, the admin that
  // LTS automates (capturing assessments, tracking competencies, chasing
  // trainees, moderator reports, filing and audit prep).
  manualBaseline: {
    hoursPerTrainee: 2, // staff hours per trainee per month spent on manual admin
    hourlyRate: 250, // fully-loaded staff cost per hour (ZAR)
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
      name: "Online Assessment & Learner Tracking Platform",
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
      name: "Time Sheet",
      tagline: "Staff time tracking, billed separately from the assessment platform",
      description:
        "A standalone module for logging and reporting staff time. Priced per timesheet user — flat, not per trainee, with no volume brackets.",
      valueProps: [
        "One flat rate per timesheet user, regardless of trainee count",
        "Billed separately from the Online Assessment & Learner Tracking Platform",
        "Same subscription model — no installation or licensing fees",
      ],
      pricingModel: "flat",
      flatRate: null, // pricing to be confirmed by LTS
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
