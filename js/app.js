/**
 * LTS Pricing Calculator — app wiring
 * Talks to LTS_DATA (data.js), LTSCalculator (calculator.js) and LTSExport (export.js).
 */

(function () {
  const state = {
    audience: "new", // 'new' | 'existing'
    lines: [], // [{ id, label, trainees, contractId }]
    showVat: false,
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
        trainees: 15,
        contractId: "payg",
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

  // The estimate price in the top bar loads the estimate page with the loader
  $$(".topbar__stat").forEach((stat) => {
    stat.classList.add("is-clickable");
    stat.setAttribute("role", "button");
    stat.setAttribute("tabindex", "0");
    stat.title = "Open your estimate";
    stat.addEventListener("click", loadEstimatePage);
    stat.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        loadEstimatePage();
      }
    });
  });

  // ---------- audience toggle ----------
  $$(".segmented__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.audience = btn.dataset.audience;
      $$(".segmented__btn").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderTotals(); // CTA copy depends on audience
    });
  });

  // ---------- product tab ----------
  function renderProduct() {
    const p = LTS_DATA.product;
    $("#product-name").textContent = p.name;
    $("#product-tagline").textContent = p.tagline;
    $("#product-desc").textContent = p.description;
    $("#product-props").innerHTML = p.valueProps.map((v) => `<li>${v}</li>`).join("");
    const cheapestRate = Math.min(...Object.values(LTS_DATA.rates["3yr"]));
    $("#product-from-price").textContent = fmt(cheapestRate);
  }

  $("#btn-add-to-estimate").addEventListener("click", () => {
    if (state.lines.length === 0) {
      state.lines.push(newLine({ label: "LTS Platform" }));
    }
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
        <div class="contract-option__rate">${fmt(calc.ratePerTrainee)} <span style="font-weight:400;font-size:11px;color:var(--text-muted)">/trainee/mo</span></div>
        ${savings > 0 ? `<div class="contract-option__save">Save ${fmtPct(savings)} vs pay-as-you-go</div>` : `<div class="contract-option__save" style="color:var(--text-muted)">Reference rate</div>`}
      </button>`;
  }

  function lineHtml(line) {
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
              <span>Annual<br/><b>${fmt(state.showVat ? calc.annualInclVat : calc.annualExclVat)}</b></span>
            </div>
          </div>
        </div>
        <div class="contract-options">
          ${LTS_DATA.contracts.map((c) => contractOptionHtml(line, c)).join("")}
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

  function ctaHtml() {
    if (state.lines.length === 0) return "";
    const primaryLine = state.lines[0];
    const contract = LTSCalculator.getContract(primaryLine.contractId);
    if (state.audience === "new") {
      const signupParam = contract.id === "payg" ? "Pay-as-you-go" : contract.years + "-Year-Contract";
      return `<a class="btn btn--primary" target="_blank" rel="noopener" href="https://www.ltsystems.co.za/sign-up/?type_of_contract=${encodeURIComponent(signupParam)}">Sign up on this plan</a>`;
    }
    return `<a class="btn btn--primary" target="_blank" rel="noopener" href="mailto:${LTS_DATA.contact.email}?subject=Update our LTS plan">Contact support to update your plan</a>`;
  }

  function renderTotals() {
    if (state.lines.length === 0) {
      $("#stat-monthly").textContent = fmt(0);
      $("#total-monthly").textContent = fmt(0);
      $("#total-annual").textContent = fmt(0);
      $("#totals-cta").innerHTML = "";
      return;
    }
    const totals = LTSCalculator.totalEstimate(state.lines);
    const monthly = state.showVat ? totals.monthlyInclVat : totals.monthlyExclVat;
    const annual = state.showVat ? totals.annualInclVat : totals.annualExclVat;
    $("#stat-monthly").textContent = fmt(monthly);
    $("#total-monthly").textContent = fmt(monthly);
    $("#total-annual").textContent = fmt(annual);
    $("#totals-cta").innerHTML = ctaHtml();
  }

  // ---------- export / save / share ----------
  $("#btn-export").addEventListener("click", () => {
    if (state.lines.length === 0) return;
    LTSExport.exportToExcel(state.lines, { name: $("#input-estimate-name").value });
  });

  $("#btn-save").addEventListener("click", () => {
    if (state.lines.length === 0) return;
    const result = LTSExport.saveEstimate($("#input-estimate-name").value, state.lines);
    const msg =
      result.mode === "local"
        ? "Saved to this browser."
        : "Saved for this session (browser storage isn't available here).";
    const feedback = $("#save-feedback");
    feedback.textContent = msg;
    feedback.hidden = false;
    renderSavedList();
  });

  $("#btn-share").addEventListener("click", async () => {
    if (state.lines.length === 0) return;
    const url = LTSExport.buildShareUrl(state.lines, { name: $("#input-estimate-name").value, audience: state.audience });
    try {
      await navigator.clipboard.writeText(url);
      const feedback = $("#save-feedback");
      feedback.textContent = "Share link copied to clipboard.";
      feedback.hidden = false;
    } catch (e) {
      prompt("Copy this share link:", url);
    }
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

  // ---------- support bubble ----------
  $("#support-phone1").textContent = LTS_DATA.contact.phone1;
  $("#support-phone1").href = "tel:" + LTS_DATA.contact.phone1.replace(/\s/g, "");
  $("#support-phone2").textContent = LTS_DATA.contact.phone2;
  $("#support-phone2").href = "tel:" + LTS_DATA.contact.phone2.replace(/\s/g, "");
  $("#support-email").textContent = LTS_DATA.contact.email;
  $("#support-email").href = "mailto:" + LTS_DATA.contact.email;

  $("#support-toggle").addEventListener("click", () => {
    const panel = $("#support-panel");
    const willShow = panel.hidden;
    panel.hidden = !willShow;
    $("#support-toggle").setAttribute("aria-expanded", String(willShow));
  });

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
    renderProduct();
    renderTemplates();
    renderFaqs();
    renderSavedList();

    const restored = restoreFromShareUrl();
    renderEstimate();
    if (restored) goToTab("estimate");
  }

  init();
})();
