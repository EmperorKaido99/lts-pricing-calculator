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
        contractId: "payg",
        units: 1,
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

  // ---------- audience toggle ----------
  $$(".segmented__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.audience = btn.dataset.audience;
      $$(".segmented__btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderTotals(); // CTA copy depends on audience
    });
  });

  // ---------- product tab ----------
  function productPriceBlockHtml(product) {
    if (product.pricingModel === "flat") {
      const priceHtml =
        typeof product.flatRate === "number"
          ? `<div class="product-card__price">${fmt(product.flatRate)}</div>`
          : `<div class="product-card__price product-card__price--tbc">Pricing to be confirmed</div>`;
      return `
        <div class="product-card__from">Flat rate</div>
        ${priceHtml}
        <div class="product-card__per">per timesheet user / month, excl. VAT</div>`;
    }
    const cheapestRate = Math.min(...Object.values(LTS_DATA.rates["3yr"]));
    return `
      <div class="product-card__from">From</div>
      <div class="product-card__price">${fmt(cheapestRate)}</div>
      <div class="product-card__per">per trainee / month, excl. VAT</div>`;
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
        const productId = btn.dataset.addProduct;
        const alreadyAdded = state.lines.some((l) => l.productId === productId);
        if (!alreadyAdded) {
          const product = LTSCalculator.getProduct(productId);
          if (product.pricingModel === "flat") {
            state.lines.push(newLine({ label: product.name, productId, trainees: null, contractId: null, units: 1 }));
          } else {
            state.lines.push(newLine({ label: "LTS Platform", productId }));
          }
        }
        renderEstimate();
        goToTab("estimate");
      });
    });
  }

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
        <div class="contract-option__rate">${fmt(calc.ratePerTrainee)} <span style="font-weight:400;font-size:11px;color:var(--text-muted)">/trainee/mo</span></div>
        ${savings > 0 ? `<div class="contract-option__save">Save ${fmtPct(savings)} vs pay-as-you-go</div>` : `<div class="contract-option__save" style="color:var(--text-muted)">Reference rate</div>`}
      </button>`;
  }

  function lineHtml(line) {
    const product = LTSCalculator.getProduct(line.productId) || LTS_DATA.products[0];
    return product.pricingModel === "flat" ? flatLineHtml(line, product) : tieredLineHtml(line);
  }

  function tieredLineHtml(line) {
    const calc = LTSCalculator.calcLine({ trainees: line.trainees, contractId: line.contractId });
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
              <span>Estimated Annual<br/><b>${fmt(state.showVat ? calc.annualInclVat : calc.annualExclVat)}</b></span>
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
            <div class="line-item__tier">Flat rate: ${fmt(calc.ratePerUnit)} /user/mo</div>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div class="line-item__result">
              <span>Monthly<br/><b>${fmt(state.showVat ? calc.monthlyInclVat : calc.monthlyExclVat)}</b></span>
              <span>Estimated Annual<br/><b>${fmt(state.showVat ? calc.annualInclVat : calc.annualExclVat)}</b></span>
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

  $("#btn-add-line").addEventListener("click", () => {
    state.lines.push(newLine({ label: "Line " + (state.lines.length + 1) }));
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

  // "Cost of not using LTS" assumption inputs
  const baselineInputs = {
    "#assume-hours": "hoursPerTrainee",
    "#assume-rate": "hourlyRate",
  };
  Object.entries(baselineInputs).forEach(([sel, key]) => {
    const input = $(sel);
    if (!input) return;
    input.value = state.baseline[key];
    input.addEventListener("input", () => {
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
    const annual = state.showVat ? totals.annualInclVat : totals.annualExclVat;

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
  // currently displayed LTS monthly cost, live.
  function renderComparison(ltsMonthly) {
    if (state.lines.length === 0) return;
    const totalTrainees = state.lines.reduce((sum, l) => sum + (parseInt(l.trainees, 10) || 0), 0);
    const base = LTSCalculator.manualBaselineCost(
      Object.assign({ trainees: totalTrainees }, state.baseline)
    );

    setCost("#cmp-without-monthly", fmt(base.monthly));
    setCost("#cmp-with-monthly", fmt(ltsMonthly));
    setCost("#cmp-hours", base.hours.toLocaleString("en-ZA"));
    setCost("#cmp-labour", fmt(base.labourCost));

    const saveMonthly = base.monthly - ltsMonthly;
    const saveAnnual = saveMonthly * 12;
    const hoursLabel = `<b>${base.hours.toLocaleString("en-ZA")}</b> hours`;
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
      $$(".segmented__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.audience === state.audience));
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
