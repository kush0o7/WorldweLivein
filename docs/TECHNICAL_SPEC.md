# Parallel World Simulator — Technical Specification

## Architecture Overview
The system is a client‑side simulation and prediction engine with:
- **Signal ingestion** (live APIs + manual inputs)
- **Historical analogy matcher**
- **Research‑based model layer**
- **Macro core GDP projection**
- **Scenario generator**
- **Quant Core (Monte Carlo)**
- **Sensitivity analysis & backtest**

Key files:
- `src/predictor/timeMachine.ts` — main prediction pipeline
- `src/predictor/quantCore.ts` — Monte Carlo quarterly model
- `src/predictor/liveSignals.ts` — data ingestion
- `src/predictor/calibration.ts` — calibration coefficients
- `src/predictor/sensitivity.ts` — sensitivity analysis
- `src/predictor/backtest.ts` — backtest pipeline

---

## 1. Inputs (CurrentSignals)
All inputs are centralized in `CurrentSignals`, including:
- **Macro:** GDP growth, inflation, unemployment, oil price  
- **Conflict:** war count, deaths, nuclear threat  
- **Tech:** AI investment, layoffs, adoption  
- **Politics:** populism, tension, trade  
- **Climate:** temperature anomaly  
- **Debt:** public, external, global  
- **Blocs:** US/EU/China GDP, inflation, unemployment, debt  
- **Market:** yield curve (10y–2y), credit spread (BAA–AAA), policy rate  

Inputs are **clamped** to plausible ranges before use.

---

## 2. Historical Analogy Engine
Each pattern in `PATTERN_LIBRARY` has:
- signal snapshot
- outcomes at 6mo/1yr/3yr/5yr
- GDP change, conflict change, recovery time

### Similarity Score
1. Normalize each overlapping signal to 0–1  
2. Compute mean squared difference  
3. Convert to similarity: `1 / (1 + MSE)`  
4. Apply composite boosts:
   - Reinhart‑Rogoff debt risk
   - Richardson arms escalation risk
   - Brynjolfsson J‑curve phase
   - Dalio cycle position
   - Context event boost (local EventKG)

Output: **Top 3 analogies** with scores.

---

## 3. Research Model Layer
Each model outputs interpretable signals:

1. **Reinhart‑Rogoff (debt thresholds)**
   - `riskScore`, `gdpPenalty`
2. **Acemoglu‑Restrepo (automation displacement)**
   - `wageEffect`, `laborShareDelta`, `displacementRisk`
3. **Nordhaus DICE (climate damage)**
   - GDP drag as % loss
4. **Richardson/COW (arms race dynamics)**
   - `conflictAcceleration`, `warProbability12mo`
5. **Brynjolfsson J‑curve (GPT lag)**
   - `currentPhase`, `productivityEffect`, `lagYearsRemaining`
6. **Dalio long cycle**
   - `cyclePhase`, `cycleRisk`, `yearsToNextCrisis`
7. **Market Signal Layer**
   - yield curve + credit spread → `stressScore`
8. **Policy Reaction**
   - Taylor rule vs actual policy rate → `policyDrag`

---

## 4. Macro Core GDP Projection
GDP next year is computed from:
- Weighted global + bloc GDP inputs  
- Debt penalty + climate damage  
- AI productivity effect  
- Oil drag (linear + nonlinear kink above $120)  
- Market stress drag (yield curve + credit spreads)  
- Policy drag (Taylor‑rule reaction)  

This yields **baseline GDP** for scenarios.

---

## 5. Scenario Generator
Three scenarios:
- **Optimistic**
- **Most Likely**
- **Pessimistic**

Adjustments:
- GDP shift by fixed offsets
- conflict trend from weighted conflict + adjustments
- oil price based on conflict index

---

## 6. Quant Core (Quarterly Monte Carlo)
The quant core simulates quarterly GDP under:
- **Regime switching** (calm → stressed → crisis)
- **Event shocks** (pandemic, war, commodity, crisis)
- **Heavy‑tail noise**
- **Bloc coupling**

Outputs:
- P10 / P50 / P90 bands for global + US/EU/China
- Regime probabilities

---

## 7. Sensitivity Analysis
Each signal is perturbed ±20%:
- Compare GDP, conflict, oil response
- Composite sensitivity score → ranked signals

---

## 8. Backtest + Calibration
`scripts/fetch_historical_data.mjs` pulls macro history.  
`scripts/build_calibration.mjs` computes coefficients.

Backtest compares predicted vs actual next‑year GDP.

---

## 9. Outputs
- Scenarios + probabilities  
- Risk/opportunity lists  
- Model insight cards  
- Plain English summary  
- Quant core distribution  
- Backtest + sensitivity  
