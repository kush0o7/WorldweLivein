import { CurrentSignals } from './timeMachine'

export type Regime = 'calm' | 'stressed' | 'crisis'

export interface BlocProjection {
  quarter: number
  gdp: { p10: number; p50: number; p90: number }
}

export interface QuantCoreResult {
  regimes: { calm: number; stressed: number; crisis: number }
  global: BlocProjection[]
  blocs: Record<'US' | 'EU' | 'China', BlocProjection[]>
}

export interface ShockCalibration {
  crisisBase: number
  commodityBase: number
  warBase: number
  pandemicBase: number
  sampleYears: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return Number(sorted[idx].toFixed(2))
}

const createSeededRandom = (seed: number) => {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const gaussian = (rand: () => number) => {
  const u = rand() || 0.0001
  const v = rand() || 0.0001
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const heavyTailShock = (rand: () => number, scale: number) => {
  const g = gaussian(rand)
  return g * scale * (1 + Math.abs(g) * 0.6)
}

const regimeFromStress = (stress: number): Regime => {
  if (stress > 0.7) return 'crisis'
  if (stress > 0.4) return 'stressed'
  return 'calm'
}

const baseBlocOffsets = {
  US: { gdp: 0.3, inflation: 0.1, unemployment: -0.2, debt: 10 },
  EU: { gdp: -0.2, inflation: 0.0, unemployment: 0.4, debt: 5 },
  China: { gdp: 1.0, inflation: -0.4, unemployment: -0.6, debt: 20 }
}

const computeStress = (signals: CurrentSignals) => {
  const conflict = clamp(signals.activeWarCount / 15, 0, 1)
  const debtAvg = (signals.usDebtGdpRatio + signals.euDebtGdpRatio + signals.chinaDebtGdpRatio) / 3
  const inflationAvg = (signals.usInflation + signals.euInflation + signals.chinaInflation) / 3
  const unemploymentAvg = (signals.usUnemployment + signals.euUnemployment + signals.chinaUnemployment) / 3
  const debt = clamp((debtAvg - 60) / 120, 0, 1)
  const inflation = clamp((inflationAvg - 2) / 8, 0, 1)
  const unemployment = clamp((unemploymentAvg - 4) / 8, 0, 1)
  const tension = clamp(signals.geopoliticalTension / 10, 0, 1)
  return clamp(0.25 * conflict + 0.25 * debt + 0.2 * inflation + 0.15 * unemployment + 0.15 * tension, 0, 1)
}

const randomRange = (rand: () => number, min: number, max: number) => min + (max - min) * rand()

const applyShock = (
  rand: () => number,
  targets: { gdp: number[]; inflation: number[]; unemployment: number[] },
  magnitude: { gdp: number; inflation: number; unemployment: number },
  duration: number,
  start: number,
  decay = 0.7
) => {
  for (let i = 0; i < duration; i += 1) {
    const idx = start + i
    if (idx >= targets.gdp.length) break
    const factor = Math.pow(decay, i)
    targets.gdp[idx] += magnitude.gdp * factor
    targets.inflation[idx] += magnitude.inflation * factor
    targets.unemployment[idx] += magnitude.unemployment * factor
  }
}

export function runQuantCore(
  signals: CurrentSignals,
  quarters = 8,
  sims = 200,
  shockCalibration?: ShockCalibration
): QuantCoreResult {
  const seed = Math.round(signals.oilPrice * 10 + signals.globalGDPGrowth * 100 + signals.inflationRate * 33)
  const rand = createSeededRandom(seed)

  const stress = computeStress(signals)
  const baseRegime = regimeFromStress(stress)

  const regimeCounts = { calm: 0, stressed: 0, crisis: 0 }

  const results: QuantCoreResult = {
    regimes: { calm: 0, stressed: 0, crisis: 0 },
    global: Array.from({ length: quarters }, (_, i) => ({ quarter: i + 1, gdp: { p10: 0, p50: 0, p90: 0 } })),
    blocs: {
      US: Array.from({ length: quarters }, (_, i) => ({ quarter: i + 1, gdp: { p10: 0, p50: 0, p90: 0 } })),
      EU: Array.from({ length: quarters }, (_, i) => ({ quarter: i + 1, gdp: { p10: 0, p50: 0, p90: 0 } })),
      China: Array.from({ length: quarters }, (_, i) => ({ quarter: i + 1, gdp: { p10: 0, p50: 0, p90: 0 } })),
    }
  }

  const samplesGlobal: number[][] = Array.from({ length: quarters }, () => [])
  const samplesUS: number[][] = Array.from({ length: quarters }, () => [])
  const samplesEU: number[][] = Array.from({ length: quarters }, () => [])
  const samplesChina: number[][] = Array.from({ length: quarters }, () => [])

  const oilDragAnnual = Math.max(0, (signals.oilPrice - 70) / 100) * 0.6

  for (let s = 0; s < sims; s += 1) {
    let regime: Regime = baseRegime

    const shockTargets = {
      gdp: Array.from({ length: quarters }, () => 0),
      inflation: Array.from({ length: quarters }, () => 0),
      unemployment: Array.from({ length: quarters }, () => 0)
    }

    const crisisProb = clamp(
      (shockCalibration?.crisisBase ?? 0.05) +
        (signals.publicDebtGdpRatio - 90) / 300 +
        (signals.creditGrowthRate > 10 ? 0.08 : 0) +
        stress * 0.2,
      0,
      0.35
    )
    const commodityProb = clamp(
      (shockCalibration?.commodityBase ?? 0.04) +
        (signals.oilPrice - 90) / 200 +
        signals.activeWarCount / 40,
      0,
      0.3
    )
    const warProb = clamp(
      (shockCalibration?.warBase ?? 0.05) +
        signals.geopoliticalTension / 20 +
        signals.activeWarCount / 40 +
        signals.nuclearThreatLevel / 50,
      0,
      0.35
    )
    const pandemicProb = clamp(
      (shockCalibration?.pandemicBase ?? 0.02) + Math.max(0, signals.tempAnomalyC - 1.2) * 0.01,
      0,
      0.08
    )

    if (rand() < pandemicProb) {
      applyShock(
        rand,
        shockTargets,
        { gdp: randomRange(rand, -6, -3), inflation: randomRange(rand, -0.5, 0.5), unemployment: randomRange(rand, 1, 3) },
        Math.floor(randomRange(rand, 2, 4)),
        Math.floor(randomRange(rand, 0, Math.max(1, quarters - 2)))
      )
    }

    if (rand() < crisisProb) {
      applyShock(
        rand,
        shockTargets,
        { gdp: randomRange(rand, -5, -2), inflation: randomRange(rand, -0.5, 0.2), unemployment: randomRange(rand, 1, 2) },
        Math.floor(randomRange(rand, 2, 5)),
        Math.floor(randomRange(rand, 0, Math.max(1, quarters - 2)))
      )
    }

    if (rand() < commodityProb) {
      applyShock(
        rand,
        shockTargets,
        { gdp: randomRange(rand, -3, -1), inflation: randomRange(rand, 1, 3), unemployment: randomRange(rand, 0.2, 0.8) },
        Math.floor(randomRange(rand, 2, 4)),
        Math.floor(randomRange(rand, 0, Math.max(1, quarters - 2)))
      )
    }

    if (rand() < warProb) {
      applyShock(
        rand,
        shockTargets,
        { gdp: randomRange(rand, -2, -0.5), inflation: randomRange(rand, 0.5, 1.5), unemployment: randomRange(rand, 0.2, 0.6) },
        Math.floor(randomRange(rand, 1, 3)),
        Math.floor(randomRange(rand, 0, Math.max(1, quarters - 2)))
      )
    }

    let gdp = signals.globalGDPGrowth / 4
    let inflation = signals.inflationRate
    let unemployment = signals.unemploymentRate

    const blocStates = {
      US: {
        gdp: signals.usGDPGrowth / 4 + baseBlocOffsets.US.gdp * 0.1,
        inflation: signals.usInflation + baseBlocOffsets.US.inflation * 0.2,
        unemployment: signals.usUnemployment + baseBlocOffsets.US.unemployment * 0.2
      },
      EU: {
        gdp: signals.euGDPGrowth / 4 + baseBlocOffsets.EU.gdp * 0.1,
        inflation: signals.euInflation + baseBlocOffsets.EU.inflation * 0.2,
        unemployment: signals.euUnemployment + baseBlocOffsets.EU.unemployment * 0.2
      },
      China: {
        gdp: signals.chinaGDPGrowth / 4 + baseBlocOffsets.China.gdp * 0.1,
        inflation: signals.chinaInflation + baseBlocOffsets.China.inflation * 0.2,
        unemployment: signals.chinaUnemployment + baseBlocOffsets.China.unemployment * 0.2
      }
    }

    for (let q = 0; q < quarters; q += 1) {
      const shockIntensity = clamp(Math.abs(shockTargets.gdp[q]) / 6, 0, 1)
      if (regime === 'calm') {
        const toStressed = clamp(0.08 + 0.35 * stress + 0.2 * shockIntensity, 0, 0.6)
        const toCrisis = clamp(0.02 + 0.1 * stress + 0.1 * shockIntensity, 0, 0.2)
        const roll = rand()
        regime = roll < toCrisis ? 'crisis' : roll < toCrisis + toStressed ? 'stressed' : 'calm'
      } else if (regime === 'stressed') {
        const toCalm = clamp(0.08 - 0.03 * stress, 0, 0.2)
        const toCrisis = clamp(0.1 + 0.35 * stress + 0.15 * shockIntensity, 0, 0.6)
        const roll = rand()
        regime = roll < toCalm ? 'calm' : roll < toCalm + toCrisis ? 'crisis' : 'stressed'
      } else {
        const toCalm = 0.04
        const toStressed = clamp(0.15 + 0.2 * (1 - stress), 0, 0.5)
        const roll = rand()
        regime = roll < toCalm ? 'calm' : roll < toCalm + toStressed ? 'stressed' : 'crisis'
      }

      regimeCounts[regime] += 1
      const regimeFactor = regime === 'crisis' ? 1.9 : regime === 'stressed' ? 1.25 : 0.85

      const shock = heavyTailShock(rand, 0.6 * regimeFactor)
      const oilShock = heavyTailShock(rand, 0.3 * regimeFactor)
      const demandShock = heavyTailShock(rand, 0.2 * regimeFactor)

      gdp =
        0.6 * gdp +
        0.15 * (signals.globalGDPGrowth / 4) -
        0.05 * stress -
        oilDragAnnual / 4 +
        shock +
        shockTargets.gdp[q]
      inflation = clamp(0.7 * inflation + 0.2 * oilShock + 0.1 * demandShock + shockTargets.inflation[q], 0, 20)
      unemployment = clamp(
        0.7 * unemployment - 0.2 * gdp + 0.15 * stress + demandShock + shockTargets.unemployment[q],
        0,
        25
      )

      samplesGlobal[q].push(Number((gdp * 4).toFixed(2)))

      ;(['US', 'EU', 'China'] as const).forEach((bloc) => {
        const state = blocStates[bloc]
        const blocShock = heavyTailShock(rand, 0.35 * regimeFactor) + shockTargets.gdp[q] * 0.7
        state.gdp = 0.55 * state.gdp + 0.2 * gdp + blocShock
        state.inflation = clamp(
          0.7 * state.inflation + 0.2 * oilShock + shockTargets.inflation[q] * 0.6,
          0,
          20
        )
        state.unemployment = clamp(
          0.7 * state.unemployment - 0.18 * state.gdp + 0.1 * stress + shockTargets.unemployment[q] * 0.6,
          0,
          25
        )
        const annualized = Number((state.gdp * 4).toFixed(2))
        if (bloc === 'US') samplesUS[q].push(annualized)
        if (bloc === 'EU') samplesEU[q].push(annualized)
        if (bloc === 'China') samplesChina[q].push(annualized)
      })
    }
  }

  for (let q = 0; q < quarters; q += 1) {
    results.global[q].gdp = {
      p10: percentile(samplesGlobal[q], 10),
      p50: percentile(samplesGlobal[q], 50),
      p90: percentile(samplesGlobal[q], 90)
    }
    results.blocs.US[q].gdp = {
      p10: percentile(samplesUS[q], 10),
      p50: percentile(samplesUS[q], 50),
      p90: percentile(samplesUS[q], 90)
    }
    results.blocs.EU[q].gdp = {
      p10: percentile(samplesEU[q], 10),
      p50: percentile(samplesEU[q], 50),
      p90: percentile(samplesEU[q], 90)
    }
    results.blocs.China[q].gdp = {
      p10: percentile(samplesChina[q], 10),
      p50: percentile(samplesChina[q], 50),
      p90: percentile(samplesChina[q], 90)
    }
  }

  const regimeTotal = sims * quarters
  results.regimes = {
    calm: Number(((regimeCounts.calm / regimeTotal) * 100).toFixed(1)),
    stressed: Number(((regimeCounts.stressed / regimeTotal) * 100).toFixed(1)),
    crisis: Number(((regimeCounts.crisis / regimeTotal) * 100).toFixed(1))
  }

  return results
}
