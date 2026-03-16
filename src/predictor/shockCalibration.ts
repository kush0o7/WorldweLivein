import { HistoricalRow } from './backtest'
import { ShockCalibration } from './quantCore'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[idx]
}

export const computeShockCalibration = (rows: HistoricalRow[]): ShockCalibration => {
  const clean = rows.filter((row) => typeof row.gdpGrowth === 'number')
  const sampleYears = clean.length
  if (sampleYears < 10) {
    return { crisisBase: 0.05, commodityBase: 0.04, warBase: 0.05, pandemicBase: 0.02, sampleYears }
  }

  const oilValues = clean.map((row) => row.oilAvg).filter((v): v is number => typeof v === 'number')
  const oilP85 = oilValues.length ? percentile(oilValues, 85) : 100

  const crisisYears = clean.filter((row) => (row.gdpGrowth ?? 0) <= -1.5).length
  const commodityYears = clean.filter((row) => typeof row.oilAvg === 'number' && row.oilAvg > oilP85).length
  const warProxyYears = clean.filter((row) => (row.inflation ?? 0) > 6 && (row.oilAvg ?? 0) > oilP85).length
  const pandemicProxyYears = clean.filter((row) => (row.gdpGrowth ?? 0) <= -2.5 && (row.unemployment ?? 0) > 8).length

  return {
    crisisBase: clamp(crisisYears / sampleYears, 0.02, 0.2),
    commodityBase: clamp(commodityYears / sampleYears, 0.02, 0.2),
    warBase: clamp(warProxyYears / sampleYears, 0.02, 0.2),
    pandemicBase: clamp(pandemicProxyYears / sampleYears, 0.01, 0.1),
    sampleYears
  }
}
