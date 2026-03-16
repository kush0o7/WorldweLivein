import { CurrentSignals, generatePrediction } from './timeMachine'

export interface HistoricalRow {
  year: number
  gdpGrowth?: number
  inflation?: number
  unemployment?: number
  oilAvg?: number
}

export interface BacktestResult {
  baseYear: number
  predictedNext: number
  actualNext: number
  error: number
}

export interface BacktestSummary {
  results: BacktestResult[]
  mae: number
}

export const runBacktest = (
  rows: HistoricalRow[],
  baseSignals: CurrentSignals,
  maxYears = 15
): BacktestSummary => {
  const byYear = new Map(rows.map((row) => [row.year, row]))
  const years = rows.map((row) => row.year).filter((year) => year >= 1995).sort((a, b) => a - b)

  const results: BacktestResult[] = []

  for (const year of years) {
    const current = byYear.get(year)
    const next = byYear.get(year + 1)
    if (!current || !next) continue
    if (
      typeof current.gdpGrowth !== 'number' ||
      typeof current.inflation !== 'number' ||
      typeof current.unemployment !== 'number' ||
      typeof next.gdpGrowth !== 'number'
    ) {
      continue
    }

    const signals: CurrentSignals = {
      ...baseSignals,
      globalGDPGrowth: current.gdpGrowth,
      inflationRate: current.inflation,
      unemploymentRate: current.unemployment,
      oilPrice: typeof current.oilAvg === 'number' ? current.oilAvg : baseSignals.oilPrice
    }

    const prediction = generatePrediction(signals, undefined, 'backtest')
    const predictedNext = prediction.scenarios.mostLikely.gdpGrowthNextYear
    const actualNext = next.gdpGrowth
    const error = predictedNext - actualNext

    results.push({ baseYear: year, predictedNext, actualNext, error })
  }

  const sliced = results.slice(-maxYears)
  const mae =
    sliced.reduce((sum, row) => sum + Math.abs(row.error), 0) / (sliced.length || 1)

  return { results: sliced, mae: Number(mae.toFixed(2)) }
}
