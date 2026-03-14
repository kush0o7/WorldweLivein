import { CurrentSignals, generatePrediction } from './timeMachine'

export interface SensitivityResult {
  signalKey: keyof CurrentSignals
  signalLabel: string
  baseValue: number
  highValue: number
  lowValue: number
  gdpSensitivity: number
  conflictSensitivity: number
  oilSensitivity: number
  overallSensitivity: number
  rank: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const defaultLabels: Partial<Record<keyof CurrentSignals, string>> = {
  oilPrice: 'Oil Price',
  globalGDPGrowth: 'Global GDP Growth',
  inflationRate: 'Inflation Rate',
  unemploymentRate: 'Unemployment',
  activeWarCount: 'Active War Count',
  conflictDeaths12mo: 'Conflict Deaths (12 mo)',
  nuclearThreatLevel: 'Nuclear Threat Level',
  aiInvestmentBillions: 'AI Investment',
  techLayoffs12mo: 'Tech Layoffs (12 mo)',
  chipWarIntensity: 'Chip War Intensity',
  populismIndex: 'Populism Index',
  tradeOpenness: 'Trade Openness',
  geopoliticalTension: 'Geopolitical Tension',
  tempAnomalyC: 'Temp Anomaly',
  publicDebtGdpRatio: 'Public Debt/GDP',
  creditGrowthRate: 'Credit Growth',
  externalDebtGdpRatio: 'External Debt/GDP',
  robotsPer1000Workers: 'Robots per 1k',
  laborShareOfIncome: 'Labor Share',
  militarySpendingGrowth: 'Military Spend Growth',
  alliancePolarisation: 'Alliance Polarisation',
  globalDebtToGdp: 'Global Debt/GDP',
  reserveCurrencyTrend: 'Reserve Currency Trend',
  giniCoefficient: 'Gini Coefficient',
  aiAdoptionRate: 'AI Adoption Rate'
}

export function runSensitivityAnalysis(
  baseSignals: CurrentSignals,
  perturbation = 0.2
): SensitivityResult[] {
  const keys = Object.keys(baseSignals) as Array<keyof CurrentSignals>
  const results: Omit<SensitivityResult, 'rank'>[] = []

  keys.forEach((key) => {
    const baseValue = baseSignals[key]
    if (typeof baseValue !== 'number' || Number.isNaN(baseValue)) return

    const highValue = baseValue * (1 + perturbation)
    const lowValue = baseValue * (1 - perturbation)

    const highSignals = { ...baseSignals, [key]: highValue }
    const lowSignals = { ...baseSignals, [key]: lowValue }

    const highPrediction = generatePrediction(highSignals)
    const lowPrediction = generatePrediction(lowSignals)

    const gdpSensitivity =
      highPrediction.scenarios.mostLikely.gdpGrowthNextYear -
      lowPrediction.scenarios.mostLikely.gdpGrowthNextYear

    const conflictScore = (trend: 'escalating' | 'stable' | 'de-escalating') =>
      trend === 'escalating' ? 1 : trend === 'stable' ? 0 : -1

    const conflictSensitivity =
      conflictScore(highPrediction.scenarios.mostLikely.conflictTrend) -
      conflictScore(lowPrediction.scenarios.mostLikely.conflictTrend)

    const oilSensitivity =
      highPrediction.scenarios.mostLikely.oilPriceNextYear -
      lowPrediction.scenarios.mostLikely.oilPriceNextYear

    const composite =
      Math.abs(gdpSensitivity) * 4 + Math.abs(conflictSensitivity) * 15 + Math.abs(oilSensitivity) * 0.2

    results.push({
      signalKey: key,
      signalLabel: defaultLabels[key] ?? String(key),
      baseValue,
      highValue,
      lowValue,
      gdpSensitivity: Number(gdpSensitivity.toFixed(2)),
      conflictSensitivity: Number(conflictSensitivity.toFixed(2)),
      oilSensitivity: Number(oilSensitivity.toFixed(2)),
      overallSensitivity: clamp(Number(composite.toFixed(2)), 0, 100)
    })
  })

  const sorted = results.sort((a, b) => b.overallSensitivity - a.overallSensitivity)

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1
  }))
}
