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
      const calc = LTSCalculator.calcLine(line);
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
