import { CurrentSignals } from './timeMachine'

export interface CalibrationCoefficients {
  inflationCoef: number
  unemploymentCoef: number
  oilCoef: number
  meanInflation: number
  meanUnemployment: number
  meanGdp: number
  baselineOil: number
}

let cached: CalibrationCoefficients | null = null

export const setCalibration = (coeffs: CalibrationCoefficients) => {
  cached = coeffs
}

export const loadCalibration = async () => {
  try {
    const response = await fetch(`/data/calibration.json?ts=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as CalibrationCoefficients
    if (!data?.inflationCoef) return null
    setCalibration(data)
    return data
  } catch {
    return null
  }
}

export const computeCalibrationAdjustment = (signals: CurrentSignals) => {
  if (!cached) return 0
  const oilDeltaPct =
    cached.baselineOil && cached.baselineOil !== 0
      ? ((signals.oilPrice - cached.baselineOil) / cached.baselineOil) * 100
      : 0
  const predicted =
    cached.meanGdp +
    cached.inflationCoef * (signals.inflationRate - cached.meanInflation) +
    cached.unemploymentCoef * (signals.unemploymentRate - cached.meanUnemployment) +
    cached.oilCoef * oilDeltaPct
  return predicted - signals.globalGDPGrowth
}

export const computeCalibratedGDP = (signals: CurrentSignals) => {
  if (!cached) return signals.globalGDPGrowth
  const oilDeltaPct =
    cached.baselineOil && cached.baselineOil !== 0
      ? ((signals.oilPrice - cached.baselineOil) / cached.baselineOil) * 100
      : 0
  return (
    cached.meanGdp +
    cached.inflationCoef * (signals.inflationRate - cached.meanInflation) +
    cached.unemploymentCoef * (signals.unemploymentRate - cached.meanUnemployment) +
    cached.oilCoef * oilDeltaPct
  )
}
