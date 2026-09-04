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
   * The "cost of NOT using LTS" — what it costs to run the same processes by
   * hand for a given trainee count: staff time (hours × rate). All inputs
   * are caller-supplied assumptions so the user can adjust them.
   */
  function manualBaselineCost({ trainees, hoursPerTrainee, hourlyRate }) {
    const n = Math.max(1, Math.floor(Number(trainees) || 0));
    const hours = n * Math.max(0, Number(hoursPerTrainee) || 0);
    const labourCost = hours * Math.max(0, Number(hourlyRate) || 0);
    const monthly = labourCost;
    return { trainees: n, hours, labourCost, monthly, annual: monthly * 12 };
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
