# Parallel World Simulator

A client‑side simulation and scenario engine that combines live macro signals, historical analogies, and research‑based models to explore plausible futures. It outputs scenario paths, quantified tail risk, and an executive‑readable story of where the world may be heading.

## Highlights
- Live signals (World Bank, FRED, Yahoo/Stooq, GDELT) with caching
- Historical analogy engine with calibrated outcomes
- Research‑model layer (debt, AI displacement, climate damage, arms race risk)
- Quant Core (Monte Carlo) with regime switching + event shocks
- Story Mode: data‑anchored narrative
- Sensitivity analysis + backtest

## Screens
- **Time Machine**: full model outputs + scenario fork
- **Story Mode**: simplified, data‑justified narrative

## Tech Stack
- React + TypeScript + Vite
- Tailwind CSS
- Recharts
- Zustand

---

# Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

# Environment Variables

Create `.env` (kept local, gitignored):

```
VITE_FRED_API_KEY=your_key_here
```

Use `.env.example` as reference.

---

# Scripts

```bash
npm run dev
npm run build
npm run preview
```

Data scripts (optional, for calibration/backtest):

```bash
node scripts/fetch_historical_data.mjs
node scripts/build_calibration.mjs
```

---

# Documentation

See `docs/`:
- `docs/EXECUTIVE_SUMMARY.md`
- `docs/TECHNICAL_SPEC.md`
- `docs/RESEARCH_JUSTIFICATION.md`
- `docs/VALIDATION.md`
- `docs/DATA_SOURCES.md`
- `docs/INTERPRETATION_GUIDE.md`

---

# Hosting

## Vercel
- Build: `npm run build`
- Output: `dist`
- Add env var: `VITE_FRED_API_KEY`

## Netlify
- Build: `npm run build`
- Publish: `dist`

## GitHub Pages
Add a deploy script to `package.json` and use `gh-pages` (see `docs/TECHNICAL_SPEC.md`).

---

# Notes

- This is a **scenario engine**, not a forecasting oracle.
- Live data is bounded by API rate limits and update cadence.
- Some signals remain manual by design (AI investment, conflict deaths, climate anomaly).
