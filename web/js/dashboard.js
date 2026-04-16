Chart.defaults.color = "#8a90a0";
Chart.defaults.borderColor = "#2e3340";
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 12;

function addSource(canvasId, source) {
  if (!source) return;
  const card = document.getElementById(canvasId).closest(".chart-card");
  if (!card) return;
  card.insertAdjacentHTML(
    "beforeend",
    `<div class="chart-source">Quelle: <a href="${source.url}" target="_blank" rel="noopener">${source.label}</a></div>`,
  );
}

const COLORS = {
  gold: "#d4a017",
  goldLight: "#f0c040",
  red: "#c0152a",
  redLight: "#e03040",
  green: "#3ecf8e",
  blue: "#4a9eff",
  blueLight: "#7ab8ff",
  purple: "#a078e8",
  orange: "#f08040",
  teal: "#38b2ac",
  gridLine: "#2e3340",
};

const TOOLTIP = {
  backgroundColor: "#1b1e26",
  borderColor: "#2e3340",
  borderWidth: 1,
  titleColor: "#e8eaf0",
  bodyColor: "#8a90a0",
  padding: 10,
};

const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false }, tooltip: TOOLTIP },
  scales: {
    x: { grid: { color: COLORS.gridLine } },
    y: { grid: { color: COLORS.gridLine } },
  },
};

function lineOptions(yLabel = "", suggestedMin = undefined) {
  return {
    ...BASE_CHART_OPTIONS,
    plugins: { ...BASE_CHART_OPTIONS.plugins },
    scales: {
      x: { grid: { color: COLORS.gridLine } },
      y: {
        grid: { color: COLORS.gridLine },
        title: { display: !!yLabel, text: yLabel, color: "#8a90a0" },
        suggestedMin,
      },
    },
  };
}

function makeGradient(ctx, colorTop, colorBottom) {
  const g = ctx.createLinearGradient(0, 0, 0, 300);
  g.addColorStop(0, colorTop);
  g.addColorStop(1, colorBottom);
  return g;
}

fetch("data/kpis.json")
  .then((r) => r.json())
  .then((data) => {
    initMeta(data.meta);
    initKpiCards(data.summary);
    initEnergie(data.energiewende);
    initDemografie(data.demographics);
    initWaehler(data.voters);
    initInfrastruktur(data.infrastructure);
    initSozial(data.social_spending);
    initRente(data.retirement);
    initSources(data.meta.sources);
  })
  .catch((err) => {
    document.querySelector("main").innerHTML =
      '<p style="color:var(--red);padding:2rem">Fehler beim Laden der Daten: ' +
      err.message +
      "</p>";
  });

function initMeta(meta) {
  const el = document.getElementById("data-updated");
  if (el) el.textContent = "Aktualisiert: " + meta.updated;
}

function initKpiCards(s) {
  const cards = [
    {
      icon: "🇩🇪",
      label: "Bevölkerung",
      value: (s.population / 1e6).toFixed(1),
      unit: "Mio.",
    },
    { icon: "📅", label: "Medianalter", value: s.median_age, unit: "Jahre" },
    {
      icon: "⚡",
      label: "Erneuerbare 2023",
      value: s.renewable_share_pct,
      unit: "% Strom",
    },
    { icon: "🌡️", label: "CO₂-Emissionen", value: s.co2_mt, unit: "Mt CO₂-eq" },
    {
      icon: "💶",
      label: "BIP",
      value: s.gdp_billion_eur.toLocaleString("de-DE"),
      unit: "Mrd. EUR",
    },
    {
      icon: "🏥",
      label: "Lebenserwartung",
      value: s.life_expectancy,
      unit: "Jahre",
    },
    {
      icon: "👶",
      label: "Geburtenrate",
      value: s.fertility_rate,
      unit: "Kinder/Frau",
    },
    {
      icon: "📉",
      label: "Arbeitslosigkeit",
      value: s.unemployment_pct,
      unit: "%",
    },
  ];
  const container = document.getElementById("kpi-cards");
  cards.forEach((c) => {
    container.innerHTML += `<div class="kpi-card">
      <div class="kpi-icon">${c.icon}</div>
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.value}</div>
      <div class="kpi-unit">${c.unit}</div>
    </div>`;
  });
}

function initEnergie(e) {
  // Combined chart: Renewable share + Electricity price
  const ctxCombi = document
    .getElementById("chart-energy-combined")
    .getContext("2d");
  new Chart(ctxCombi, {
    type: "line",
    data: {
      labels: e.renewable_share_by_year.labels,
      datasets: [
        {
          label: "Erneuerbare (%)",
          data: e.renewable_share_by_year.values,
          borderColor: COLORS.green,
          backgroundColor: "rgba(62,207,142,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.green,
          pointRadius: 3,
          fill: true,
          tension: 0.35,
          yAxisID: "yRenewable",
        },
        {
          label: "Strompreis (ct/kWh)",
          data: e.electricity_price_ct_kwh.values,
          borderColor: COLORS.orange,
          backgroundColor: "rgba(240,128,64,0.08)",
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.orange,
          pointRadius: 3,
          fill: true,
          tension: 0.35,
          yAxisID: "yPrice",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#8a90a0", font: { size: 11 }, boxWidth: 12, padding: 16 },
        },
        tooltip: {
          ...TOOLTIP,
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        yRenewable: {
          type: "linear",
          position: "left",
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "Erneuerbare %", color: COLORS.green },
          ticks: { color: COLORS.green },
          suggestedMin: 0,
          suggestedMax: 80,
        },
        yPrice: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          title: { display: true, text: "ct/kWh", color: COLORS.orange },
          ticks: { color: COLORS.orange },
          suggestedMin: 0,
        },
      },
    },
  });
  addSource("chart-energy-combined", e.renewable_share_by_year.source);

  // CO2 emissions — separate chart
  const ctxCO2 = document.getElementById("chart-co2").getContext("2d");
  new Chart(ctxCO2, {
    type: "line",
    data: {
      labels: e.co2_emissions_by_year.labels,
      datasets: [
        {
          data: e.co2_emissions_by_year.values,
          borderColor: COLORS.red,
          backgroundColor: makeGradient(
            ctxCO2,
            "rgba(192,21,42,0.3)",
            "rgba(192,21,42,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.red,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("Mt CO₂-eq", 500),
  });
  addSource("chart-co2", e.co2_emissions_by_year.source);

  // Electricity share of final energy consumption
  const elShare = e.electricity_share_of_final_energy;
  const ctxElShare = document
    .getElementById("chart-electricity-share")
    .getContext("2d");
  new Chart(ctxElShare, {
    type: "line",
    data: {
      labels: elShare.labels,
      datasets: [
        {
          label: "Strom gesamt",
          data: elShare.strom_pct,
          borderColor: COLORS.blue,
          backgroundColor: "rgba(74,158,255,0.1)",
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.blue,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
        {
          label: "Davon erneuerbar",
          data: elShare.davon_erneuerbar_pct,
          borderColor: COLORS.green,
          backgroundColor: "rgba(62,207,142,0.25)",
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.green,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#8a90a0", font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          ...TOOLTIP,
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "% des Endenergieverbrauchs", color: "#8a90a0" },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });
  addSource("chart-electricity-share", elShare.source);

  // Progress bar for renewable target
  const combiCard = document
    .getElementById("chart-energy-combined")
    .closest(".chart-card");
  const current = e.renewable_share_by_year.values.at(-1);
  const target = e.target_2030_pct;
  combiCard.insertAdjacentHTML(
    "beforeend",
    `<div class="progress-bar-wrap">
    <div class="progress-label"><span>Fortschritt zum 2030-Ziel (${target}%)</span><span>${current}% / ${target}%</span></div>
    <div class="progress-bar"><div class="progress-bar-fill" style="width:${Math.round((current / target) * 100)}%"></div></div>
  </div>`,
  );

  const capSources = e.capacity_gw.sources;
  const capColorMap = {
    renewable: COLORS.green,
    fossil: "#6b7280",
    storage: COLORS.purple,
  };
  const capColors = capSources.map((s) => capColorMap[s.color_type]);
  const capColorsLight = capColors.map((c) => c + "55");
  const ctxCap = document.getElementById("chart-capacity").getContext("2d");
  new Chart(ctxCap, {
    type: "bar",
    data: {
      labels: capSources.map((s) => s.name),
      datasets: [
        {
          label: "Installierte Kapazität",
          data: capSources.map((s) => s.installed),
          backgroundColor: capColorsLight,
          borderRadius: 5,
          borderSkipped: false,
          order: 1,
        },
        {
          label: "Ø Erzeugung",
          data: capSources.map((s) => s.avg_used),
          backgroundColor: capColors,
          borderRadius: 5,
          borderSkipped: false,
          order: 0,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      plugins: {
        legend: {
          display: true,
          labels: { color: "#8a90a0", font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: TOOLTIP,
      },
      scales: {
        x: {
          grid: { color: COLORS.gridLine },
          stacked: true,
        },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "GW", color: "#8a90a0" },
          stacked: false,
        },
      },
    },
  });
  addSource("chart-capacity", e.capacity_gw.source);

  // European CO2 intensity comparison
  const co2eu = e.co2_intensity_europe_2023;
  const co2euSorted = co2eu.labels
    .map((label, i) => ({ label, value: co2eu.values[i] }))
    .sort((a, b) => b.value - a.value);
  const co2euLabels = co2euSorted.map((d) => d.label);
  const co2euValues = co2euSorted.map((d) => d.value);
  const ctxCO2EU = document
    .getElementById("chart-co2-europe")
    .getContext("2d");
  new Chart(ctxCO2EU, {
    type: "bar",
    data: {
      labels: co2euLabels,
      datasets: [
        {
          data: co2euValues,
          backgroundColor: co2euLabels.map((l) =>
            l === "Deutschland" ? COLORS.gold : COLORS.blue,
          ),
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: {
            display: true,
            text: "gCO₂eq/kWh",
            color: "#8a90a0",
          },
          suggestedMin: 0,
        },
      },
    },
  });
  addSource("chart-co2-europe", e.co2_intensity_europe_2023.source);

  // Battery storage: installed vs targets (horizontal bar)
  const bat = e.battery_storage_gw;
  const target2045mid = Math.round((bat.target_2045.total_min + bat.target_2045.total_max) / 2);
  const ctxBat = document.getElementById("chart-battery").getContext("2d");
  new Chart(ctxBat, {
    type: "bar",
    data: {
      labels: ["Installiert 2024", "Ziel 2037 (NEP)", "Ziel 2045 (NEP)"],
      datasets: [
        {
          data: [bat.installed_2024, bat.target_2037.total, target2045mid],
          backgroundColor: [COLORS.blue, COLORS.gold, COLORS.red],
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      indexAxis: "y",
      scales: {
        x: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "GW", color: "#8a90a0" },
        },
        y: { grid: { color: COLORS.gridLine } },
      },
    },
  });

  // Battery storage trend over time — y-axis scaled to 2045 target
  const ctxBatTrend = document
    .getElementById("chart-battery-trend")
    .getContext("2d");
  new Chart(ctxBatTrend, {
    type: "line",
    data: {
      labels: bat.by_year.labels,
      datasets: [
        {
          data: bat.by_year.values,
          borderColor: COLORS.teal,
          backgroundColor: makeGradient(
            ctxBatTrend,
            "rgba(56,178,172,0.3)",
            "rgba(56,178,172,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.teal,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        annotation: undefined,
      },
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "GW", color: "#8a90a0" },
          suggestedMin: 0,
          suggestedMax: target2045mid,
        },
      },
    },
  });

  // Battery progress bar (vs 2045 target)
  const batCard = document.getElementById("chart-battery").closest(".chart-card");
  const batPct = Math.round((bat.installed_2024 / target2045mid) * 100);
  batCard.insertAdjacentHTML(
    "beforeend",
    `<div class="progress-bar-wrap">
    <div class="progress-label"><span>Fortschritt zum 2045-Ziel (~${target2045mid} GW)</span><span>${bat.installed_2024} / ${target2045mid} GW (${batPct}%)</span></div>
    <div class="progress-bar"><div class="progress-bar-fill" style="width:${batPct}%"></div></div>
  </div>`,
  );
  addSource("chart-battery", bat.source);
  addSource("chart-battery-trend", bat.source);

  // SAIDI – Stromausfälle
  const gr = e.grid_reliability;
  const ctxSaidi = document.getElementById("chart-saidi").getContext("2d");
  new Chart(ctxSaidi, {
    type: "line",
    data: {
      labels: gr.saidi.labels,
      datasets: [
        {
          label: "SAIDI (min/Jahr)",
          data: gr.saidi.values,
          borderColor: "#4a9eff",
          backgroundColor: makeGradient(ctxSaidi, "rgba(74,158,255,0.25)", "rgba(74,158,255,0)"),
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: lineOptions("Minuten / Jahr", 0),
  });
  addSource("chart-saidi", gr.source);

  // Redispatch – Netzengpässe
  const ctxRd = document.getElementById("chart-redispatch").getContext("2d");
  new Chart(ctxRd, {
    type: "bar",
    data: {
      labels: gr.redispatch_gwh.labels,
      datasets: [
        {
          label: "Redispatch (GWh)",
          data: gr.redispatch_gwh.values,
          backgroundColor: gr.redispatch_gwh.values.map((v) =>
            v > 15000 ? "rgba(192,21,42,0.7)" : v > 10000 ? "rgba(240,192,64,0.7)" : "rgba(62,207,142,0.7)",
          ),
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...lineOptions("GWh", 0),
      plugins: { ...lineOptions("GWh", 0).plugins, legend: { display: false } },
    },
  });
  addSource("chart-redispatch", gr.source);
}

function initDemografie(d) {
  const ctxAge = document.getElementById("chart-age-groups").getContext("2d");
  new Chart(ctxAge, {
    type: "bar",
    data: {
      labels: d.age_groups_2023.labels,
      datasets: [
        {
          data: d.age_groups_2023.values,
          backgroundColor: d.age_groups_2023.values.map(
            (_, i) =>
              `hsl(${220 - (i / (d.age_groups_2023.values.length - 1)) * 180}, 70%, 55%)`,
          ),
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "%", color: "#8a90a0" },
        },
      },
    },
  });
  addSource("chart-age-groups", d.age_groups_2023.source);

  const ctxMed = document.getElementById("chart-median-age").getContext("2d");
  new Chart(ctxMed, {
    type: "line",
    data: {
      labels: d.median_age_by_year.labels,
      datasets: [
        {
          data: d.median_age_by_year.values,
          borderColor: COLORS.gold,
          backgroundColor: makeGradient(
            ctxMed,
            "rgba(212,160,23,0.3)",
            "rgba(212,160,23,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.gold,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("Jahre", 34),
  });
  addSource("chart-median-age", d.median_age_by_year.source);

  const ctxPop = document.getElementById("chart-population").getContext("2d");
  new Chart(ctxPop, {
    type: "line",
    data: {
      labels: d.population_by_year.labels,
      datasets: [
        {
          data: d.population_by_year.values.map((v) => (v / 1e6).toFixed(2)),
          borderColor: COLORS.blue,
          backgroundColor: makeGradient(
            ctxPop,
            "rgba(74,158,255,0.3)",
            "rgba(74,158,255,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.blue,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("Mio.", 75),
  });
  addSource("chart-population", d.population_by_year.source);

  const ctxFert = document.getElementById("chart-fertility").getContext("2d");
  new Chart(ctxFert, {
    type: "line",
    data: {
      labels: d.fertility_rate_by_year.labels,
      datasets: [
        {
          data: d.fertility_rate_by_year.values,
          borderColor: COLORS.purple,
          backgroundColor: makeGradient(
            ctxFert,
            "rgba(160,120,232,0.3)",
            "rgba(160,120,232,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.purple,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("TFR", 1.0),
  });
  addSource("chart-fertility", d.fertility_rate_by_year.source);

  // Migration & citizenship
  const mig = d.migration;
  const ctxMig = document.getElementById("chart-migration").getContext("2d");
  new Chart(ctxMig, {
    type: "line",
    data: {
      labels: mig.labels,
      datasets: [
        {
          label: "Migrationshintergrund",
          data: mig.migrationshintergrund_pct,
          borderColor: COLORS.orange,
          backgroundColor: makeGradient(
            ctxMig,
            "rgba(240,128,64,0.2)",
            "rgba(240,128,64,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.orange,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
          spanGaps: false,
        },
        {
          label: "Ohne dt. Staatsbürgerschaft",
          data: mig.auslaenderanteil_pct,
          borderColor: COLORS.blue,
          backgroundColor: makeGradient(
            ctxMig,
            "rgba(74,158,255,0.2)",
            "rgba(74,158,255,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.blue,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      plugins: {
        legend: {
          display: true,
          labels: { color: "#8a90a0", font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: TOOLTIP,
      },
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "%", color: "#8a90a0" },
          suggestedMin: 0,
        },
      },
    },
  });
  addSource("chart-migration", d.migration.source);
}

function initWaehler(v) {
  const ctxVot = document.getElementById("chart-voters").getContext("2d");
  new Chart(ctxVot, {
    type: "bar",
    data: {
      labels: v.age_distribution_2021.labels,
      datasets: [
        {
          data: v.age_distribution_2021.values,
          backgroundColor: v.age_distribution_2021.values.map(
            (_, i) =>
              `hsla(${40 - (i / (v.age_distribution_2021.values.length - 1)) * 200}, 80%, 55%, 0.85)`,
          ),
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "%", color: "#8a90a0" },
        },
      },
    },
  });
  addSource("chart-voters", v.source);

  const container = document.getElementById("voter-stats");
  [
    {
      label: "Wahlberechtigte",
      value: (v.eligible_voters_2021 / 1e6).toFixed(1) + " Mio.",
      cls: "",
    },
    {
      label: "Wahlbeteiligung 2021",
      value: v.turnout_2021_pct + "%",
      cls: "highlight-green",
    },
    {
      label: "Medianalter Wähler",
      value: v.median_voter_age + " Jahre",
      cls: "highlight-gold",
    },
    { label: "Anteil unter 40", value: v.share_under_40_pct + "%", cls: "" },
    {
      label: "Anteil über 60",
      value: v.share_over_60_pct + "%",
      cls: "highlight-red",
    },
    { label: "Wahlalter (EU-Wahl)", value: "ab 16", cls: "" },
  ].forEach((s) => {
    container.innerHTML += `<div class="stat-box">
      <span class="stat-box-label">${s.label}</span>
      <span class="stat-box-value ${s.cls}">${s.value}</span>
    </div>`;
  });

  // Voter split by generation
  const gen = v.generations_2021;
  const genColors = [COLORS.teal, COLORS.blue, COLORS.gold, COLORS.orange, "#6b7280"];
  const ctxSplit = document
    .getElementById("chart-voter-retirement")
    .getContext("2d");
  new Chart(ctxSplit, {
    type: "doughnut",
    data: {
      labels: gen.labels,
      datasets: [
        {
          data: gen.values,
          backgroundColor: genColors,
          borderColor: "#1b1e26",
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: TOOLTIP,
      },
    },
  });

  const legend = document.getElementById("voter-retirement-legend");
  legend.innerHTML = gen.labels
    .map(
      (label, i) => `
    <div class="retirement-legend-item">
      <div class="retirement-legend-dot" style="background:${genColors[i]}"></div>
      <div>
        <div class="retirement-legend-value">${gen.values[i]}%</div>
        <div class="retirement-legend-label">${label} · Jg. ${gen.birth_years[i]} · ${gen.ages_2021[i]} J.</div>
      </div>
    </div>`,
    )
    .join("");
  addSource("chart-voter-retirement", v.source);
}

function initInfrastruktur(inf) {
  // Bahnhöfe (Personen + Industrie + LKW-Anteil)
  const ctxBhf = document.getElementById("chart-bahnhoefe").getContext("2d");
  const baseBhfOpts = lineOptions("Anzahl", 0);
  new Chart(ctxBhf, {
    type: "line",
    data: {
      labels: inf.bahnhoefe.labels,
      datasets: [
        {
          label: "Personenbahnhöfe",
          data: inf.bahnhoefe.personen,
          borderColor: COLORS.red,
          backgroundColor: makeGradient(ctxBhf, "rgba(192,21,42,0.25)", "rgba(192,21,42,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.red,
          pointRadius: 3,
          fill: true,
          tension: 0.35,
          yAxisID: "y",
        },
        {
          label: "Industriebahnhöfe (Gleisanschlüsse)",
          data: inf.bahnhoefe.industrie,
          borderColor: COLORS.gold,
          backgroundColor: makeGradient(ctxBhf, "rgba(212,160,23,0.2)", "rgba(212,160,23,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.gold,
          pointRadius: 3,
          fill: true,
          tension: 0.35,
          yAxisID: "y",
        },
        {
          label: "LKW-Anteil Güterverkehr (%)",
          data: inf.bahnhoefe.lkw_anteil_pct,
          borderColor: "#4a9eff",
          backgroundColor: "rgba(74,158,255,0)",
          borderWidth: 2,
          borderDash: [6, 4],
          pointBackgroundColor: "#4a9eff",
          pointRadius: 3,
          fill: false,
          tension: 0.3,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      ...baseBhfOpts,
      plugins: {
        ...baseBhfOpts.plugins,
        legend: { display: true, labels: { color: "#8a90a0", font: { size: 11 } } },
      },
      scales: {
        ...baseBhfOpts.scales,
        y: {
          ...baseBhfOpts.scales.y,
          position: "left",
          title: { display: true, text: "Anzahl Bahnhöfe", color: "#8a90a0" },
        },
        y1: {
          position: "right",
          beginAtZero: false,
          suggestedMin: 40,
          suggestedMax: 80,
          grid: { drawOnChartArea: false },
          ticks: { color: "#8a90a0", callback: (v) => v + "%" },
          title: { display: true, text: "LKW-Anteil tkm (%)", color: "#4a9eff" },
        },
      },
    },
  });
  addSource("chart-bahnhoefe", inf.bahnhoefe.source);

  // Flugreisende
  const ctxFlug = document.getElementById("chart-flugreisende").getContext("2d");
  new Chart(ctxFlug, {
    type: "line",
    data: {
      labels: inf.flugreisende_mio.labels,
      datasets: [
        {
          data: inf.flugreisende_mio.values,
          borderColor: COLORS.blue,
          backgroundColor: makeGradient(ctxFlug, "rgba(74,158,255,0.3)", "rgba(74,158,255,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.blue,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("Mio.", 0),
  });
  addSource("chart-flugreisende", inf.flugreisende_mio.source);

  // PKW-Bestand
  const ctxPkw = document.getElementById("chart-pkw").getContext("2d");
  new Chart(ctxPkw, {
    type: "line",
    data: {
      labels: inf.pkw_bestand_mio.labels,
      datasets: [
        {
          data: inf.pkw_bestand_mio.values,
          borderColor: COLORS.orange,
          backgroundColor: makeGradient(ctxPkw, "rgba(240,128,64,0.3)", "rgba(240,128,64,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.orange,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("Mio. PKW", 20),
  });
  addSource("chart-pkw", inf.pkw_bestand_mio.source);

  // Pünktlichkeit Fernverkehr
  const ctxPuenkt = document.getElementById("chart-puenktlichkeit").getContext("2d");
  new Chart(ctxPuenkt, {
    type: "line",
    data: {
      labels: inf.puenktlichkeit_fernverkehr.labels,
      datasets: [
        {
          data: inf.puenktlichkeit_fernverkehr.values,
          borderColor: COLORS.gold,
          backgroundColor: makeGradient(ctxPuenkt, "rgba(212,160,23,0.3)", "rgba(212,160,23,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.gold,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("%", 50),
  });
  addSource("chart-puenktlichkeit", inf.puenktlichkeit_fernverkehr.source);

  // Staus auf Autobahnen
  const ctxStau = document.getElementById("chart-staus").getContext("2d");
  new Chart(ctxStau, {
    type: "bar",
    data: {
      labels: inf.staus_autobahn.labels,
      datasets: [
        {
          data: inf.staus_autobahn.values,
          backgroundColor: inf.staus_autobahn.values.map((v) =>
            v > 700 ? COLORS.red : v > 400 ? COLORS.orange : COLORS.blue,
          ),
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "Tsd. Staumeldungen", color: "#8a90a0" },
          suggestedMin: 0,
        },
      },
    },
  });
  addSource("chart-staus", inf.staus_autobahn.source);

  // Investitionen Schiene vs. Straße (gesamt)
  const inv = inf.investitionen_gesamt;
  const ctxInv = document.getElementById("chart-investitionen").getContext("2d");
  new Chart(ctxInv, {
    type: "bar",
    data: {
      labels: inv.labels,
      datasets: [
        {
          label: "Schiene",
          data: inv.schiene,
          backgroundColor: "rgba(62,207,142,0.8)",
          borderRadius: 4,
        },
        {
          label: "Straße",
          data: inv.strasse,
          backgroundColor: "rgba(192,21,42,0.75)",
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      plugins: {
        ...BASE_CHART_OPTIONS.plugins,
        legend: { display: true, labels: { color: "#8a90a0", font: { size: 11 } } },
      },
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "Mrd. € / Jahr", color: "#8a90a0" },
          suggestedMin: 0,
        },
      },
    },
  });
  addSource("chart-investitionen", inv.source);

  // EU-Vergleich helper: sortiert absteigend, hebt Deutschland in Gold hervor
  const renderEuBarChart = (canvasId, dataObj, axisLabel, sortDesc = true) => {
    const sorted = dataObj.labels
      .map((label, i) => ({ label, value: dataObj.values[i] }))
      .sort((a, b) => (sortDesc ? b.value - a.value : a.value - b.value));
    const labels = sorted.map((d) => d.label);
    const values = sorted.map((d) => d.value);
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((l) =>
              l === "Deutschland" ? COLORS.gold : COLORS.blue,
            ),
            borderRadius: 5,
            borderSkipped: false,
          },
        ],
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: { ...BASE_CHART_OPTIONS.plugins, legend: { display: false } },
        scales: {
          x: { grid: { color: COLORS.gridLine } },
          y: {
            grid: { color: COLORS.gridLine },
            title: { display: true, text: axisLabel, color: "#8a90a0" },
            suggestedMin: 0,
          },
        },
      },
    });
    addSource(canvasId, dataObj.source);
  };

  // Best (highest speed) on the left
  renderEuBarChart("chart-internet-speed", inf.internet_speed_eu, "Mbit/s", true);
  // Cheapest on the left
  renderEuBarChart("chart-internet-price", inf.internet_price_eu, "€ / Monat", false);
  // Highest 5G coverage on the left
  renderEuBarChart("chart-mobilfunk", inf.mobilfunk_5g_eu, "% Abdeckung", true);
}

function initSozial(s) {
  const ctxBreak = document
    .getElementById("chart-social-breakdown")
    .getContext("2d");
  new Chart(ctxBreak, {
    type: "doughnut",
    data: {
      labels: s.breakdown_pct_gdp.labels,
      datasets: [
        {
          data: s.breakdown_pct_gdp.values,
          backgroundColor: [
            COLORS.gold,
            COLORS.blue,
            COLORS.teal,
            COLORS.purple,
            COLORS.orange,
            COLORS.red,
          ],
          borderColor: "#1b1e26",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "60%",
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            color: "#8a90a0",
            font: { size: 11 },
            padding: 12,
            boxWidth: 12,
          },
        },
        tooltip: TOOLTIP,
      },
    },
  });
  addSource("chart-social-breakdown", s.breakdown_pct_gdp.source);

  const ctxHealth = document.getElementById("chart-health").getContext("2d");
  new Chart(ctxHealth, {
    type: "line",
    data: {
      labels: s.health_spending_by_year.labels,
      datasets: [
        {
          data: s.health_spending_by_year.values,
          borderColor: COLORS.blue,
          backgroundColor: makeGradient(
            ctxHealth,
            "rgba(74,158,255,0.3)",
            "rgba(74,158,255,0)",
          ),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.blue,
          pointRadius: 4,
          fill: true,
          tension: 0.35,
        },
      ],
    },
    options: lineOptions("% des BIP", 10),
  });
  addSource("chart-health", s.health_spending_by_year.source);

  // Staatsquote
  const sq = s.staatsquote_pct_gdp;
  const ctxSQ = document.getElementById("chart-staatsquote").getContext("2d");
  new Chart(ctxSQ, {
    type: "line",
    data: {
      labels: sq.labels,
      datasets: [
        {
          label: "Staatsquote",
          data: sq.values,
          borderColor: COLORS.gold,
          backgroundColor: makeGradient(ctxSQ, "rgba(212,160,23,0.3)", "rgba(212,160,23,0)"),
          borderWidth: 2.5,
          pointBackgroundColor: COLORS.gold,
          pointRadius: 4,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: lineOptions("% des BIP", 40),
  });
  addSource("chart-staatsquote", sq.source);
}

function initRente(r) {
  const ctxRatio = document.getElementById("chart-ratio").getContext("2d");
  new Chart(ctxRatio, {
    type: "bar",
    data: {
      labels: r.worker_to_pensioner_ratio.labels,
      datasets: [
        {
          data: r.worker_to_pensioner_ratio.values,
          backgroundColor: r.worker_to_pensioner_ratio.labels.map((l) =>
            l.includes("*") ? COLORS.redLight : COLORS.blue,
          ),
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...BASE_CHART_OPTIONS,
      scales: {
        x: { grid: { color: COLORS.gridLine } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: "Verhältnis", color: "#8a90a0" },
          suggestedMin: 0,
          suggestedMax: 3,
        },
      },
    },
  });
  addSource("chart-ratio", r.source);

  const container = document.getElementById("pension-stats");
  [
    {
      label: "Regelrentenalter",
      value: r.standard_retirement_age + " Jahre",
      cls: "",
    },
    {
      label: "Tatsächl. Rentenalter",
      value: r.effective_retirement_age_2024 + " Jahre",
      cls: "",
    },
    {
      label: "Rentenempfänger",
      value: (r.pensioners_2024 / 1e6).toFixed(1) + " Mio.",
      cls: "",
    },
    {
      label: "Ø Rente (brutto/Monat)",
      value: r.average_pension_eur_month_2024.toLocaleString("de-DE") + " €",
      cls: "highlight-gold",
    },
    {
      label: "Standardrente (45 EP, West)",
      value: r.standard_pension_eur_month_2024.toLocaleString("de-DE") + " €",
      cls: "",
    },
    {
      label: "Rentenniveau (Brutto)",
      value: r.pension_level_pct_gross + "%",
      cls: "highlight-gold",
    },
    {
      label: "Beitragssatz",
      value: r.pension_contribution_rate_pct + "%",
      cls: "highlight-red",
    },
    {
      label: "Rentenausgaben (% BIP)",
      value: r.pension_expenditure_pct_gdp + "%",
      cls: "",
    },
  ].forEach((s) => {
    container.innerHTML += `<div class="stat-box">
      <span class="stat-box-label">${s.label}</span>
      <span class="stat-box-value ${s.cls}">${s.value}</span>
    </div>`;
  });
}

function initSources(sources) {
  const list = document.getElementById("sources-list");
  sources.forEach((src) => {
    list.innerHTML += `<li>${src}</li>`;
  });
}
