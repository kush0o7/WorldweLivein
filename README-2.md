# Parallel World Simulator

> What historical moment does today most resemble — and what happened next?

A client-side scenario engine that ingests live macro signals, scores them against historical crisis patterns, and outputs probabilistic paths for GDP, conflict, and oil. Built for researchers, analysts, and anyone trying to think clearly about systemic risk.

**[Live Demo](your-url-here)** · Built with React + TypeScript · Open source

---

## What it does

Most macro dashboards show you data. This one asks: *given this data, where have we been before?*

It pulls live signals from World Bank, FRED, Yahoo Finance, and GDELT, runs them through six peer-reviewed research models, and matches today's conditions against historical analogies — scoring structural similarity to events like the 2008 GFC, the Great Depression, and Cold War escalation periods.

The output is a probability distribution across scenario paths, not a point forecast.

---

## Highlights

- **Live data ingestion** — World Bank, FRED, Yahoo/Stooq, GDELT with 6-hour caching
- **Historical analogy engine** — calibrated similarity scoring against major crisis periods
- **Research model layer** — Reinhart-Rogoff (debt), Acemoglu-Restrepo (automation), Nordhaus DICE (climate), Richardson/COW (conflict), Brynjolfsson J-Curve (AI productivity), Dalio debt cycle
- **Quant Core** — Monte Carlo with regime switching (calm / stressed / crisis) and event shocks
- **Story Mode** — data-anchored plain-English narrative
- **Sensitivity analysis + 12-year backtest** (MAE: 1.03%)

---

## Screens

**Time Machine** — full model outputs, scenario fork (optimistic / base / pessimistic), P10/P50/P90 bands, sensitivity ranking

**Story Mode** — simplified narrative built from live signals, readable without a quant background

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

Create a `.env` file (gitignored — use `.env.example` as reference):

```
FRED_API_KEY=your_key_here
```

Get a free FRED API key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html).

### Scripts

```bash
npm run dev        # development server
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

Optional calibration scripts:

```bash
node scripts/fetch_historical_data.mjs
node scripts/build_calibration.mjs
```

---

## Hosting

**Vercel** (recommended) — connect your GitHub repo, set build command `npm run build`, output `dist`, add `FRED_API_KEY` as an environment variable. Done.

**Netlify** — same config: build `npm run build`, publish `dist`.

**GitHub Pages** — see `docs/TECHNICAL_SPEC.md` for the `gh-pages` deploy script.

---

## Documentation

| Doc | Contents |
|---|---|
| `docs/EXECUTIVE_SUMMARY.md` | Non-technical overview |
| `docs/TECHNICAL_SPEC.md` | Architecture and data flow |
| `docs/RESEARCH_JUSTIFICATION.md` | Model sources and citations |
| `docs/VALIDATION.md` | Backtest methodology |
| `docs/DATA_SOURCES.md` | API endpoints and update cadence |
| `docs/INTERPRETATION_GUIDE.md` | How to read the outputs |

---

## Important caveats

- This is a **scenario engine**, not a forecasting oracle. It identifies structural similarity to historical conditions — it cannot predict triggers or timing.
- Some signals are manual by design (AI investment, conflict deaths, climate anomaly) where no reliable public API exists.
- The model's largest errors occur at discontinuities — COVID produced a +5.98% miss. Black swans are not in the training data by definition.
- Live data is subject to API rate limits and source update cadence.

---

## Built with

Vibe coded with [Claude](https://claude.ai) and [Codex](https://openai.com/index/openai-codex/). The research framing, model selection, and interpretation layer are original. The implementation was a human-AI collaboration.

---

*If you use this for research or find the methodology interesting, I'd genuinely appreciate a star or a note.*
