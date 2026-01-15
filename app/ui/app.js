const statusEl = document.getElementById("status");
const runBtn = document.getElementById("runPipeline");
const refreshBtn = document.getElementById("refreshViews");
const categorySelect = document.getElementById("categorySelect");
const newsList = document.getElementById("newsList");
const fxChartEl = document.getElementById("fxChart");
const marketHeatmapEl = document.getElementById("marketHeatmap");
const fxPredictionEl = document.getElementById("fxPrediction");
let selectedNewsId = "";
let lastHeatmapScores = {};

async function fetchJson(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.json();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setRunState() {
  runBtn.disabled = !selectedNewsId;
}

function renderNews(items) {
  if (!newsList) {
    return;
  }
  newsList.innerHTML = "";
  if (!items || !items.length) {
    newsList.innerHTML = "<div class=\"news-item\">No news items yet.</div>";
    return;
  }
  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "news-item";
    el.dataset.id = item.id;

    const title = document.createElement("div");
    title.className = "news-item-title";
    title.textContent = item.title || "Untitled";

    const meta = document.createElement("div");
    meta.className = "news-item-meta";
    meta.textContent = `${item.published_at} · ${item.sector}`;

    const link = document.createElement("a");
    link.className = "news-item-link";
    link.href = item.url || "#";
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.url || "Open link";

    const summary = document.createElement("div");
    summary.className = "news-item-summary";
    summary.textContent = item.summary || "";

    el.appendChild(title);
    el.appendChild(meta);
    el.appendChild(link);
    el.appendChild(summary);

    el.addEventListener("click", () => {
      selectedNewsId = item.id;
      document.querySelectorAll(".news-item").forEach((node) => {
        node.classList.toggle("selected", node.dataset.id === item.id);
      });
      setRunState();
    });
    newsList.appendChild(el);
  });
}

async function loadNews(category) {
  if (!category) {
    if (newsList) {
      newsList.innerHTML = "";
    }
    return;
  }
  setStatus("Loading news...");
  try {
    const data = await fetchJson(`/news?category=${encodeURIComponent(category)}&limit=10`);
    renderNews(data);
    setStatus("News loaded.");
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

function renderTimeline(items) {
  const container = document.getElementById("timeline");
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = "<div class=\"timeline-item\">No scored events yet.</div>";
    return;
  }
  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "timeline-item";
    el.innerHTML = `
      <a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a>
      <div class="timeline-meta">
        <span>${item.published_at}</span>
        <span>${item.sector}</span>
        <span>${item.risk_signal}</span>
        <span>${item.rate_signal}</span>
        <span>${item.geo_signal}</span>
        <span>${item.fx_state}</span>
        <span>${item.sentiment}</span>
        <span>Score ${item.total_score}</span>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderHeatmap(map) {
  const container = document.getElementById("heatmap");
  container.innerHTML = "";
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    container.innerHTML = "<div class=\"heatmap-item\">No sector scores yet.</div>";
    return;
  }
  entries.forEach(([sector, score]) => {
    const el = document.createElement("div");
    el.className = "heatmap-item";
    el.innerHTML = `
      <span>${sector}</span>
      <span class="score">${score}</span>
    `;
    container.appendChild(el);
  });
}

function parseFxState(state) {
  const result = { USD: 0, JPY: 0, EUR: 0, EM: 0 };
  if (!state) {
    return result;
  }
  state.split(" ").forEach((chunk) => {
    const [key, value] = chunk.split(":");
    if (!key || value === undefined) {
      return;
    }
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed) && key in result) {
      result[key] = parsed;
    }
  });
  return result;
}

function renderFxPrediction(items) {
  if (!fxPredictionEl) {
    return;
  }
  fxPredictionEl.innerHTML = "";
  if (!items.length) {
    fxPredictionEl.innerHTML = "<div class=\"fx-card\">No scored events yet.</div>";
    return;
  }
  const latest = items[0];
  const bias = parseFxState(latest.fx_state || "");
  const maxAbs = Math.max(1, ...Object.values(bias).map((value) => Math.abs(value)));
  const card = document.createElement("div");
  card.className = "fx-card";
  card.innerHTML = `
    <h3>${latest.title || "Latest event"}</h3>
    <div class="fx-meta"></div>
  `;
  ["USD", "JPY", "EUR", "EM"].forEach((currency) => {
    const value = bias[currency] || 0;
    const width = Math.round((Math.abs(value) / maxAbs) * 50);
    const row = document.createElement("div");
    row.className = "fx-row";
    const displayValue = value.toFixed(2);
    row.innerHTML = `
      <div>${currency}</div>
      <div class="fx-bar">
        <div class="fx-bar-fill ${value > 0 ? "positive" : value < 0 ? "negative" : "neutral"}" style="width: ${width}%"></div>
      </div>
      <div>${value >= 0 ? `+${displayValue}` : displayValue}</div>
    `;
    card.appendChild(row);
  });
  fxPredictionEl.appendChild(card);
}

async function refresh() {
  try {
    const [timeline, heatmap, categories] = await Promise.all([
      fetchJson("/timeline"),
      fetchJson("/heatmap"),
      fetchJson("/categories"),
    ]);
    renderTimeline(timeline);
    renderHeatmap(heatmap);
    lastHeatmapScores = heatmap || {};
    renderMarketHeatmap(lastHeatmapScores);
    renderFxPrediction(timeline);
    renderCategories(categories);
    setStatus("Views refreshed.");
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

runBtn.addEventListener("click", async () => {
  if (!selectedNewsId) {
    setStatus("Select a news item first.");
    return;
  }
  setStatus("Running pipeline for selected news...");
  try {
    const selected = encodeURIComponent(selectedNewsId);
    await fetchJson(`/pipeline/run_one?raw_event_id=${selected}`, { method: "POST" });
    setStatus("Pipeline complete.");
    await refresh();
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
});

refreshBtn.addEventListener("click", refresh);

refresh();

function renderCategories(items) {
  if (categorySelect) {
    if (!items || !items.length) {
      categorySelect.innerHTML = "<option value=\"\">No categories</option>";
      runBtn.disabled = true;
      return;
    }
    categorySelect.innerHTML = "<option value=\"\">Select a category</option>";
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.sector || "";
      option.textContent = item.sector || "Unknown";
      categorySelect.appendChild(option);
    });
  }
}

if (categorySelect) {
  categorySelect.addEventListener("change", () => {
    selectedNewsId = "";
    setRunState();
    loadNews(categorySelect.value);
  });
}

setRunState();

const fxData = [
  { quarter: "Q1 2023", fxSwaps: 3500, spotFX: 2100, forwards: 900, nonTraditional: 280 },
  { quarter: "Q2 2023", fxSwaps: 3869, spotFX: 2001, forwards: 987, nonTraditional: 303 },
  { quarter: "Q3 2023", fxSwaps: 4138, spotFX: 2042, forwards: 1049, nonTraditional: 326 },
  { quarter: "Q4 2023", fxSwaps: 4234, spotFX: 1731, forwards: 1087, nonTraditional: 344 },
  { quarter: "Q1 2024", fxSwaps: 4147, spotFX: 1893, forwards: 1114, nonTraditional: 356 },
  { quarter: "Q2 2024", fxSwaps: 3934, spotFX: 1605, forwards: 1149, nonTraditional: 362 },
  { quarter: "Q3 2024", fxSwaps: 3691, spotFX: 1760, forwards: 1201, nonTraditional: 362 },
  { quarter: "Q4 2024", fxSwaps: 3515, spotFX: 1468, forwards: 1264, nonTraditional: 357 },
  { quarter: "Q1 2025", fxSwaps: 3486, spotFX: 1614, forwards: 1326, nonTraditional: 349 },
  { quarter: "Q2 2025", fxSwaps: 3622, spotFX: 1325, forwards: 1376, nonTraditional: 337 },
  { quarter: "Q3 2025", fxSwaps: 3871, spotFX: 1468, forwards: 1404, nonTraditional: 323 },
  { quarter: "Q4 2025", fxSwaps: 4158, spotFX: 1180, forwards: 1425, nonTraditional: 306 },
];

function linePath(data, key, width, height, padding) {
  const maxY = 5000;
  const minY = 0;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  return data
    .map((point, index) => {
      const x = padding + (plotWidth * index) / (data.length - 1);
      const value = point[key];
      const y = padding + plotHeight - ((value - minY) / (maxY - minY)) * plotHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function renderFxChart() {
  if (!fxChartEl) {
    return;
  }
  const width = 960;
  const height = 360;
  const padding = 48;
  const yTicks = [0, 1000, 2000, 3000, 4000, 5000];
  const xLabels = fxData.map((point) => point.quarter);
  const gridLines = yTicks
    .map((tick) => {
      const y = padding + (height - padding * 2) - (tick / 5000) * (height - padding * 2);
      return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#1e2430" stroke-width="1" />`;
    })
    .join("");
  const xTicks = xLabels
    .map((label, index) => {
      const x = padding + ((width - padding * 2) * index) / (xLabels.length - 1);
      return `<text x="${x}" y="${height - 12}" text-anchor="middle" fill="#9aa0a6" font-size="10">${label}</text>`;
    })
    .join("");
  const yLabels = yTicks
    .map((tick) => {
      const y = padding + (height - padding * 2) - (tick / 5000) * (height - padding * 2);
      return `<text x="16" y="${y + 4}" fill="#9aa0a6" font-size="10">${tick}</text>`;
    })
    .join("");
  const svg = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="FX Market Activity">
      ${gridLines}
      <path d="${linePath(fxData, "fxSwaps", width, height, padding)}" fill="none" stroke="#4a9eff" stroke-width="2.5" />
      <path d="${linePath(fxData, "spotFX", width, height, padding)}" fill="none" stroke="#ff4a9e" stroke-width="2.5" />
      <path d="${linePath(fxData, "forwards", width, height, padding)}" fill="none" stroke="#ff9a4a" stroke-width="2.5" />
      <path d="${linePath(fxData, "nonTraditional", width, height, padding)}" fill="none" stroke="#4aff9e" stroke-width="2.5" />
      ${xTicks}
      ${yLabels}
    </svg>
    <div class="fx-chart-labels">
      <span style="color:#4a9eff;">FX swaps</span>
      <span style="color:#ff4a9e;">Spot</span>
      <span style="color:#ff9a4a;">Outright forwards</span>
      <span style="color:#4aff9e;">Non-traditional</span>
    </div>
  `;
  fxChartEl.innerHTML = svg;
}

function getHeatmapColor(change) {
  if (change >= 2) return "#10b981";
  if (change >= 1) return "#34d399";
  if (change > -1) return "#374151";
  if (change >= -2) return "#fb923c";
  if (change >= -3) return "#f87171";
  return "#ef4444";
}

function worstAspectRatio(row, rowArea, length) {
  if (!row.length) {
    return Infinity;
  }
  const maxArea = Math.max(...row.map((item) => item.area));
  const minArea = Math.min(...row.map((item) => item.area));
  const lengthSquared = length * length;
  return Math.max((lengthSquared * maxArea) / (rowArea * rowArea), (rowArea * rowArea) / (lengthSquared * minArea));
}

function layoutRow(row, x, y, width, height, rects) {
  const rowArea = row.reduce((sum, item) => sum + item.area, 0);
  if (width >= height) {
    const rowHeight = rowArea / width;
    let offsetX = x;
    row.forEach((item) => {
      const itemWidth = item.area / rowHeight;
      rects.push({
        ...item,
        x: offsetX,
        y,
        width: itemWidth,
        height: rowHeight,
      });
      offsetX += itemWidth;
    });
    return { x, y: y + rowHeight, width, height: height - rowHeight };
  }
  const rowWidth = rowArea / height;
  let offsetY = y;
  row.forEach((item) => {
    const itemHeight = item.area / rowWidth;
    rects.push({
      ...item,
      x,
      y: offsetY,
      width: rowWidth,
      height: itemHeight,
    });
    offsetY += itemHeight;
  });
  return { x: x + rowWidth, y, width: width - rowWidth, height };
}

function squarify(items, x, y, width, height) {
  const rects = [];
  let remaining = items.slice();
  let row = [];
  let container = { x, y, width, height };
  let shortSide = Math.min(width, height);

  while (remaining.length) {
    const item = remaining[0];
    const newRow = row.concat(item);
    const rowArea = newRow.reduce((sum, entry) => sum + entry.area, 0);
    if (row.length === 0 || worstAspectRatio(row, row.reduce((sum, entry) => sum + entry.area, 0), shortSide) >= worstAspectRatio(newRow, rowArea, shortSide)) {
      row = newRow;
      remaining = remaining.slice(1);
    } else {
      container = layoutRow(row, container.x, container.y, container.width, container.height, rects);
      shortSide = Math.min(container.width, container.height);
      row = [];
    }
  }
  if (row.length) {
    layoutRow(row, container.x, container.y, container.width, container.height, rects);
  }
  return rects;
}

function renderMarketHeatmap(scores) {
  if (!marketHeatmapEl) {
    return;
  }
  const entries = Object.entries(scores || {}).filter(([, value]) => Number.isFinite(value));
  if (!entries.length) {
    marketHeatmapEl.innerHTML = "<div class=\"heatmap-empty\">No sector scores yet.</div>";
    return;
  }
  const bounds = marketHeatmapEl.getBoundingClientRect();
  const width = bounds.width || 900;
  const height = bounds.height || 560;
  const totalSize = entries.reduce((sum, [, value]) => sum + Math.max(0.1, Math.abs(value)), 0);
  const items = entries
    .map(([sector, value]) => ({
      sector,
      value,
      area: (Math.max(0.1, Math.abs(value)) / totalSize) * width * height,
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const rects = squarify(items, 0, 0, width, height);
  marketHeatmapEl.innerHTML = "";
  rects.forEach((rect) => {
    const div = document.createElement("div");
    div.className = "treemap-item";
    div.style.left = `${rect.x}px`;
    div.style.top = `${rect.y}px`;
    div.style.width = `${rect.width}px`;
    div.style.height = `${rect.height}px`;
    div.style.background = getHeatmapColor(rect.value);
    const formatted = rect.value >= 0 ? `+${rect.value.toFixed(3)}` : rect.value.toFixed(3);
    const label = `${rect.sector}`;
    const maxLabelWidth = Math.max(1, rect.width - 12);
    const maxLabelHeight = Math.max(1, rect.height - 12);
    const approxFont = Math.min(
      14,
      Math.max(9, Math.floor(Math.min(maxLabelWidth / Math.max(6, label.length * 0.6), maxLabelHeight / 3)))
    );
    div.style.fontSize = `${approxFont}px`;
    div.title = `${rect.sector} ${formatted}`;
    div.innerHTML = `${label}<small>${formatted}</small>`;
    marketHeatmapEl.appendChild(div);
  });
}

renderFxChart();
renderMarketHeatmap(lastHeatmapScores);
window.addEventListener("resize", () => {
  renderFxChart();
  renderMarketHeatmap(lastHeatmapScores);
});
