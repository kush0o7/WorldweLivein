# Data Sources & Provenance

## Live Inputs (No Auth or Free Keys)
1. **Oil Price**
   - Yahoo Finance (fallback)
   - Stooq (primary)

2. **Global GDP Growth**
   - World Bank API: `NY.GDP.MKTP.KD.ZG`

3. **Inflation / Unemployment (US)**
   - FRED: `CPIAUCSL`, `UNRATE`

4. **EU/China Macro**
   - World Bank API:
     - GDP: `NY.GDP.MKTP.KD.ZG`
     - Inflation: `FP.CPI.TOTL.ZG`
     - Unemployment: `SL.UEM.TOTL.ZS`

5. **Market Signals**
   - FRED:
     - `T10Y2Y` (yield curve)
     - `BAA`, `AAA` (credit spreads)
     - `FEDFUNDS` (policy rate)

6. **Conflict Proxy**
   - GDELT timeline volume (rate‑limited, cached for 6 hours)

---

## Manual Inputs
These remain manual because live sources are unstable, paywalled, or inconsistent:
- AI investment, layoffs
- Political stability / populism
- Debt ratios for blocs
- Conflict deaths
- Climate anomaly (NASA GISS)

---

## Update Frequency
Most feeds are monthly or quarterly:
- World Bank: annual/quarterly updates
- FRED: monthly for CPI/UNRATE
- Yahoo/Stooq: daily
- GDELT: near real‑time

---

## Rate Limits / CORS
Some APIs rate‑limit or block CORS.  
