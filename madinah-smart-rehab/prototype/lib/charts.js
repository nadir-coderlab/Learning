// Hand-rolled SVG charts: thin 2px lines, ringed end-dots, hairline grid, crosshair tooltip,
// and a data-table view so no value is hover-only. Charts read left-to-right (time) even in RTL.
import { html, useMemo, useRef, useState } from './h.js';

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

export function LineChart({
  series = [], band, refLines = [], xDomain, yDomain, height = 210, xFormat = (x) => x, yFormat = (y) => y,
  unit = '', label = 'رسم بياني', xTitle = 'اليوم بعد العملية', tableTitle,
}) {
  const W = 640; const H = height; const pad = { l: 40, r: 56, t: 14, b: 28 };
  const allPts = series.flatMap((s) => s.points);
  const xs = allPts.map((p) => p.x).concat(band ? band.points.map((p) => p.x) : []);
  const ys = allPts.map((p) => p.y).concat(band ? band.points.flatMap((p) => [p.lo, p.hi]) : []).concat(refLines.map((r) => r.y));
  const [x0, x1] = xDomain || [Math.min(...xs, 0), Math.max(...xs, 1)];
  const [y0, y1] = yDomain || [Math.min(...ys, 0), Math.max(...ys, 1)];
  const sx = (x) => pad.l + ((x - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const sy = (y) => H - pad.b - ((y - y0) / (y1 - y0 || 1)) * (H - pad.t - pad.b);
  const yTicks = niceTicks(y0, y1, 4);
  const xTicks = niceTicks(x0, x1, 5);
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const wrap = useRef(null);

  const xsSorted = useMemo(() => [...new Set(xs)].sort((a, b) => a - b), [series, band]);
  const onMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const xv = x0 + ((px - pad.l) / (W - pad.l - pad.r)) * (x1 - x0);
    let best = null;
    for (const x of xsSorted) if (best === null || Math.abs(x - xv) < Math.abs(best - xv)) best = x;
    if (best === null) return;
    setHover({ x: best, left: (sx(best) / W) * 100 });
  };

  const bandPath = band && band.points.length > 1
    ? `M${band.points.map((p) => `${sx(p.x)},${sy(p.hi)}`).join(' L')} L${[...band.points].reverse().map((p) => `${sx(p.x)},${sy(p.lo)}`).join(' L')} Z`
    : null;

  const tipRows = hover ? series.map((s) => {
    const p = s.points.find((q) => q.x === hover.x);
    return p ? { s, p } : null;
  }).filter(Boolean) : [];
  const tipBand = hover && band ? band.points.find((q) => q.x === hover.x) : null;

  const rows = xsSorted.map((x) => ({
    x,
    vals: series.map((s) => s.points.find((p) => p.x === x)?.y),
    band: band ? band.points.find((p) => p.x === x) : null,
  }));

  return html`<div class="chart" dir="ltr" ref=${wrap}>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${label} onPointerMove=${onMove} onPointerLeave=${() => setHover(null)}>
      <g class="grid">${yTicks.map((t) => html`<line x1=${pad.l} x2=${W - pad.r} y1=${sy(t)} y2=${sy(t)} />`)}</g>
      <g class="axis">
        ${yTicks.map((t) => html`<text x=${pad.l - 8} y=${sy(t) + 4} text-anchor="end">${yFormat(t)}</text>`)}
        ${xTicks.map((t) => html`<text x=${sx(t)} y=${H - 8} text-anchor="middle">${xFormat(t)}</text>`)}
      </g>
      ${bandPath ? html`<path d=${bandPath} fill="var(--corridor)" stroke="var(--corridor-edge)" stroke-width="1" />` : null}
      ${refLines.map((r) => html`<g><line class="target-line" x1=${pad.l} x2=${W - pad.r} y1=${sy(r.y)} y2=${sy(r.y)} />
        <text class="label-text" x=${W - pad.r + 4} y=${sy(r.y) + 4}>${r.label}</text></g>`)}
      ${series.map((s) => {
        if (!s.points.length) return null;
        const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x)},${sy(p.y)}`).join(' ');
        const lastP = s.points[s.points.length - 1];
        return html`<g>
          ${s.area ? html`<path d=${`${d} L${sx(lastP.x)},${sy(y0)} L${sx(s.points[0].x)},${sy(y0)} Z`} fill=${s.color} opacity="0.1" />` : null}
          <path d=${d} fill="none" stroke=${s.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray=${s.dashed ? '5 4' : null} />
          ${s.dots === 'all' ? s.points.map((p) => html`<circle cx=${sx(p.x)} cy=${sy(p.y)} r="3.5" fill=${s.color} stroke="var(--surface)" stroke-width="2" />`) : null}
          ${s.dashed ? null : html`<circle cx=${sx(lastP.x)} cy=${sy(lastP.y)} r="4.5" fill=${s.color} stroke="var(--surface)" stroke-width="2" />`}
          ${s.endLabel !== false && !s.dashed ? html`<text class="label-text" x=${sx(lastP.x) + 8} y=${sy(lastP.y) + 4}>${yFormat(lastP.y)}${unit}</text>` : null}
        </g>`;
      })}
      ${hover ? html`<line class="crosshair" x1=${sx(hover.x)} x2=${sx(hover.x)} y1=${pad.t} y2=${H - pad.b} />` : null}
      <rect x=${pad.l} y=${pad.t} width=${W - pad.l - pad.r} height=${H - pad.t - pad.b} fill="transparent" />
    </svg>
    ${hover && (tipRows.length || tipBand) ? html`<div class="chart-tip" dir="rtl" style=${`left:${Math.min(Math.max(hover.left, 18), 78)}%;top:6px;transform:translateX(-50%)`}>
      <div class="muted small">${xTitle}: ${xFormat(hover.x)}</div>
      ${tipRows.map(({ s, p }) => html`<div class="tip-row"><span class="key" style=${`background:${s.color}`}></span><span class="tip-value">${yFormat(p.y)}${unit}</span><span class="muted">${s.label}</span></div>`)}
      ${tipBand ? html`<div class="tip-row"><span class="key" style="background:var(--corridor-edge)"></span><span class="tip-value">${yFormat(tipBand.lo)}–${yFormat(tipBand.hi)}${unit}</span><span class="muted">${band.label}</span></div>` : null}
    </div>` : null}
    <div class="row-between" dir="rtl" style="margin-top:4px">
      <div class="legend">
        ${series.length > 1 || band || series.some((s) => s.dashed) ? series.map((s) => html`<span>${s.dashed ? html`<i class="key-dash" style=${`border-color:${s.color}`}></i>` : html`<i class="key-line" style=${`background:${s.color}`}></i>`}${s.label}</span>`) : null}
        ${band ? html`<span><i class="key-band"></i>${band.label}</span>` : null}
      </div>
      <button class="data-toggle" type="button" onClick=${() => setShowTable(!showTable)}>${showTable ? 'إخفاء البيانات' : 'عرض البيانات'}</button>
    </div>
    ${showTable ? html`<div class="table-wrap" dir="rtl" style="margin-top:8px;max-height:220px;overflow:auto">
      <table class="table"><caption class="sr-only">${tableTitle || label}</caption>
        <thead><tr><th>${xTitle}</th>${series.map((s) => html`<th class="num">${s.label}</th>`)}${band ? html`<th class="num">${band.label}</th>` : null}</tr></thead>
        <tbody>${rows.map((r) => html`<tr><td class="num">${xFormat(r.x)}</td>${r.vals.map((v) => html`<td class="num">${v === undefined ? '—' : `${yFormat(v)}${unit}`}</td>`)}${band ? html`<td class="num">${r.band ? `${yFormat(r.band.lo)}–${yFormat(r.band.hi)}` : '—'}</td>` : null}</tr>`)}</tbody>
      </table></div>` : null}
  </div>`;
}

export function BarChart({ data, height = 150, max, valueFormat = (v) => v, label = 'رسم أعمدة', color = 'var(--series-1)', xTitle = 'اليوم' }) {
  const W = 640; const H = height; const pad = { l: 34, r: 8, t: 10, b: 26 };
  const yMax = max ?? Math.max(1, ...data.map((d) => d.value));
  const n = data.length || 1;
  const slot = (W - pad.l - pad.r) / n;
  const bw = Math.min(24, slot * 0.62);
  const sy = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b);
  const ticks = niceTicks(0, yMax, 3);
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);
  return html`<div class="chart" dir="ltr">
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${label} onPointerLeave=${() => setHover(null)}>
      <g class="grid">${ticks.map((t) => html`<line x1=${pad.l} x2=${W - pad.r} y1=${sy(t)} y2=${sy(t)} />`)}</g>
      <g class="axis">${ticks.map((t) => html`<text x=${pad.l - 6} y=${sy(t) + 4} text-anchor="end">${valueFormat(t)}</text>`)}</g>
      ${data.map((d, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const y = sy(d.value);
        const h = Math.max(0, H - pad.b - y);
        const r = Math.min(4, h / 2, bw / 2);
        const x = cx - bw / 2;
        const path = h > 0 ? `M${x},${H - pad.b} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${H - pad.b} Z` : '';
        return html`<g onPointerEnter=${() => setHover(i)} onFocus=${() => setHover(i)} tabindex="0">
          <rect x=${pad.l + slot * i} y=${pad.t} width=${slot} height=${H - pad.t - pad.b} fill="transparent" />
          ${path ? html`<path d=${path} fill=${d.color || color} opacity=${hover === null || hover === i ? 1 : 0.55} />` : null}
          ${d.mark ? html`<circle cx=${cx} cy=${H - pad.b - 6} r="3" fill="var(--ink-3)" />` : null}
          ${data.length <= 16 || i % 2 === 0 ? html`<text class="axis-label" x=${cx} y=${H - 8} text-anchor="middle" fill="var(--ink-3)" font-size="11">${d.label}</text>` : null}
        </g>`;
      })}
    </svg>
    ${hover !== null && data[hover] ? html`<div class="chart-tip" dir="rtl" style=${`left:${Math.min(Math.max(((pad.l + slot * hover + slot / 2) / W) * 100, 15), 85)}%;top:0;transform:translateX(-50%)`}>
      <div class="muted small">${data[hover].tip || data[hover].label}</div><div class="tip-value">${valueFormat(data[hover].value)}</div></div>` : null}
    <div class="row-between" dir="rtl" style="margin-top:2px"><span></span>
      <button class="data-toggle" type="button" onClick=${() => setShowTable(!showTable)}>${showTable ? 'إخفاء البيانات' : 'عرض البيانات'}</button></div>
    ${showTable ? html`<div class="table-wrap" dir="rtl" style="margin-top:8px;max-height:220px;overflow:auto"><table class="table">
      <thead><tr><th>${xTitle}</th><th class="num">القيمة</th></tr></thead>
      <tbody>${data.map((d) => html`<tr><td>${d.tip || d.label}</td><td class="num">${valueFormat(d.value)}</td></tr>`)}</tbody></table></div>` : null}
  </div>`;
}

export function Sparkline({ values, width = 96, height = 28, color = 'var(--series-1)', label = 'اتجاه' }) {
  const vals = values.filter((v) => Number.isFinite(v));
  if (vals.length < 2) return html`<span class="muted small">—</span>`;
  const min = Math.min(...vals); const max = Math.max(...vals);
  const sx = (i) => 2 + (i / (vals.length - 1)) * (width - 8);
  const sy = (v) => height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${sx(i)},${sy(v)}`).join(' ');
  return html`<svg width=${width} height=${height} viewBox=${`0 0 ${width} ${height}`} role="img" aria-label=${label} dir="ltr" style="display:block">
    <path d=${d} fill="none" stroke=${color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx=${sx(vals.length - 1)} cy=${sy(vals[vals.length - 1])} r="3" fill=${color} stroke="var(--surface)" stroke-width="1.5" />
  </svg>`;
}

// Limb-symmetry bar: operated vs uninjured with the clearance threshold marked.
export function LsiBar({ value, threshold = 90, label }) {
  const v = Math.max(0, Math.min(120, value || 0));
  const tone = value >= threshold ? 'ok' : value >= threshold - 15 ? 'warn' : 'alert';
  const icon = value >= threshold ? '✓' : '!';
  return html`<div class="stack-sm" style="gap:4px">
    <div class="row-between small"><span>${label}</span><span class="num strong">${Number.isFinite(value) ? `${Math.round(value)}%` : '—'} <span class=${`pill pill-${tone}`} style="padding:0 7px">${icon} ${value >= threshold ? 'محقق' : 'دون الحد'}</span></span></div>
    <div class="meter" style="position:relative" dir="ltr">
      <span style=${`width:${(v / 120) * 100}%;background:var(--${tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn-mark' : 'alert'})`}></span>
      <i style=${`position:absolute;top:-3px;bottom:-3px;left:${(threshold / 120) * 100}%;width:2px;background:var(--ink)`} title=${`الحد ${threshold}%`}></i>
    </div>
  </div>`;
}
