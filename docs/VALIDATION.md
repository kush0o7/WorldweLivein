# Validation & Backtest

## Purpose
The backtest checks whether the model’s **macro GDP projection** aligns with historical next‑year GDP outcomes.

## Method
- Use `historical_worldbank.json` (World Bank data).
- For each year, feed that year’s GDP, inflation, unemployment, oil into the model.
- Compare predicted next‑year GDP vs actual.

## Output
The app displays:
- Mean absolute error (MAE)
- Per‑year errors

## Interpretation
- Low MAE in stable periods means baseline signal extraction is working.
- Large errors in shock years (e.g., 2020) are expected because **pandemic shocks are rare and exogenous**.

## Known Failure Cases
- Sudden, rare shocks (pandemic, unexpected wars).
- Policy regime changes not captured by Taylor‑rule.
- Non‑linear supply chain collapse.

## How To Run
```bash
node scripts/fetch_historical_data.mjs
node scripts/build_calibration.mjs
```

This updates:
- `public/data/historical_worldbank.json`
- `public/data/calibration.json`

---

## Practical Guidance
If MAE > 2–3% in normal years:
- Check input feeds
- Rebuild calibration
- Inspect oil series availability
