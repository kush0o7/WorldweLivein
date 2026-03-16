import { computeCalibrationAdjustment, computeCalibratedGDP } from './calibration'

export interface CurrentSignals {
  oilPrice: number
  globalGDPGrowth: number
  inflationRate: number
  unemploymentRate: number
  activeWarCount: number
  conflictDeaths12mo: number
  nuclearThreatLevel: number
  aiInvestmentBillions: number
  techLayoffs12mo: number
  chipWarIntensity: number
  populismIndex: number
  tradeOpenness: number
  geopoliticalTension: number
  tempAnomalyC: number
  publicDebtGdpRatio: number
  creditGrowthRate: number
  externalDebtGdpRatio: number
  robotsPer1000Workers: number
  laborShareOfIncome: number
  militarySpendingGrowth: number
  alliancePolarisation: number
  globalDebtToGdp: number
  reserveCurrencyTrend: number
  giniCoefficient: number
  usGDPGrowth: number
  euGDPGrowth: number
  chinaGDPGrowth: number
  usInflation: number
  euInflation: number
  chinaInflation: number
  usUnemployment: number
  euUnemployment: number
  chinaUnemployment: number
  usDebtGdpRatio: number
  euDebtGdpRatio: number
  chinaDebtGdpRatio: number
  yieldCurve10y2y: number
  creditSpreadBaaAaa: number
  policyRate: number
  aiAdoptionRate?: number
}

export interface HistoricalPattern {
  id: string
  name: string
  period: string
  signals: Partial<CurrentSignals>
  outcomes: {
    at6months: string
    at1year: string
    at3years: string
    at5years: string
  }
  gdpChange1yr: number
  conflictChange: number
  recoveryYears: number
  keyLesson: string
  analogyScore?: number
}

export interface MatchedPattern extends HistoricalPattern {
  analogyScore: number
}

export interface Risk {
  label: string
  severity: 'low' | 'medium' | 'high'
}

export interface Opportunity {
  label: string
  severity: 'low' | 'medium' | 'high'
}

export interface ScenarioOutcome {
  probability: number
  gdpGrowthNextYear: number
  conflictTrend: 'escalating' | 'stable' | 'de-escalating'
  oilPriceNextYear: number
  headline: string
  at6months: string
  at1year: string
  at3years: string
  at5years: string
  historicalPrecedent: string
}

export interface ContextEvent {
  label: string
  description?: string
  date?: string
}

export interface ModelOutputs {
  reinhartRogoff: ReturnType<typeof reinhartRogoffScore>
  acemoglu: ReturnType<typeof acemogluDisplacementScore>
  nordhaus: number
  richardson: ReturnType<typeof richardsonArmsDynamics>
  brynjolfsson: ReturnType<typeof brynjolfssonJCurve>
  dalio: ReturnType<typeof dalioCyclePosition>
  policy: ReturnType<typeof policyReactionFunction>
  market: ReturnType<typeof marketSignalScore>
}

export interface TimeMachinePrediction {
  topAnalogies: MatchedPattern[]
  scenarios: {
    mostLikely: ScenarioOutcome
    optimistic: ScenarioOutcome
    pessimistic: ScenarioOutcome
  }
  keyRisks: Risk[]
  keyOpportunities: Opportunity[]
  confidenceScore: number
  modelOutputs: ModelOutputs
  uncertainty: {
    gdp: { p10: number; p50: number; p90: number }
    conflict: { p10: number; p50: number; p90: number }
    oil: { p10: number; p50: number; p90: number }
  }
}

export type PredictionMode = 'full' | 'backtest'

export const clampSignals = (raw: CurrentSignals): CurrentSignals => ({
  ...raw,
  tempAnomalyC: Math.max(0, Math.min(4.0, raw.tempAnomalyC)),
  oilPrice: Math.max(5, Math.min(500, raw.oilPrice)),
  globalGDPGrowth: Math.max(-15, Math.min(15, raw.globalGDPGrowth)),
  inflationRate: Math.max(0, Math.min(50, raw.inflationRate)),
  unemploymentRate: Math.max(0, Math.min(40, raw.unemploymentRate)),
  usGDPGrowth: Math.max(-15, Math.min(15, raw.usGDPGrowth)),
  euGDPGrowth: Math.max(-15, Math.min(15, raw.euGDPGrowth)),
  chinaGDPGrowth: Math.max(-15, Math.min(15, raw.chinaGDPGrowth)),
  usInflation: Math.max(0, Math.min(50, raw.usInflation)),
  euInflation: Math.max(0, Math.min(50, raw.euInflation)),
  chinaInflation: Math.max(0, Math.min(50, raw.chinaInflation)),
  usUnemployment: Math.max(0, Math.min(40, raw.usUnemployment)),
  euUnemployment: Math.max(0, Math.min(40, raw.euUnemployment)),
  chinaUnemployment: Math.max(0, Math.min(40, raw.chinaUnemployment)),
  nuclearThreatLevel: Math.max(0, Math.min(10, raw.nuclearThreatLevel)),
  chipWarIntensity: Math.max(0, Math.min(10, raw.chipWarIntensity)),
  populismIndex: Math.max(0, Math.min(10, raw.populismIndex)),
  geopoliticalTension: Math.max(0, Math.min(10, raw.geopoliticalTension)),
  tradeOpenness: Math.max(0, Math.min(100, raw.tradeOpenness)),
  laborShareOfIncome: Math.max(20, Math.min(80, raw.laborShareOfIncome)),
  publicDebtGdpRatio: Math.max(0, Math.min(300, raw.publicDebtGdpRatio)),
  usDebtGdpRatio: Math.max(0, Math.min(300, raw.usDebtGdpRatio)),
  euDebtGdpRatio: Math.max(0, Math.min(300, raw.euDebtGdpRatio)),
  chinaDebtGdpRatio: Math.max(0, Math.min(300, raw.chinaDebtGdpRatio)),
  globalDebtToGdp: Math.max(0, Math.min(500, raw.globalDebtToGdp)),
  externalDebtGdpRatio: Math.max(0, Math.min(200, raw.externalDebtGdpRatio)),
  activeWarCount: Math.max(0, Math.min(30, raw.activeWarCount)),
  conflictDeaths12mo: Math.max(0, Math.min(10_000_000, raw.conflictDeaths12mo)),
  alliancePolarisation: Math.max(0, Math.min(10, raw.alliancePolarisation)),
  reserveCurrencyTrend: Math.max(-10, Math.min(10, raw.reserveCurrencyTrend)),
  yieldCurve10y2y: Math.max(-5, Math.min(5, raw.yieldCurve10y2y)),
  creditSpreadBaaAaa: Math.max(0, Math.min(6, raw.creditSpreadBaaAaa)),
  policyRate: Math.max(0, Math.min(20, raw.policyRate))
})

const NORMALIZATION_RANGES: Record<keyof CurrentSignals, [number, number]> = {
  oilPrice: [20, 200],
  globalGDPGrowth: [-10, 8],
  inflationRate: [0, 20],
  unemploymentRate: [2, 30],
  activeWarCount: [0, 15],
  conflictDeaths12mo: [0, 1_000_000],
  nuclearThreatLevel: [0, 10],
  aiInvestmentBillions: [0, 1000],
  techLayoffs12mo: [0, 200_000],
  chipWarIntensity: [0, 10],
  populismIndex: [0, 10],
  tradeOpenness: [0, 100],
  geopoliticalTension: [0, 10],
  tempAnomalyC: [0, 4],
  publicDebtGdpRatio: [0, 200],
  creditGrowthRate: [0, 20],
  externalDebtGdpRatio: [0, 150],
  robotsPer1000Workers: [0, 10],
  laborShareOfIncome: [40, 70],
  militarySpendingGrowth: [0, 15],
  alliancePolarisation: [0, 10],
  globalDebtToGdp: [100, 350],
  reserveCurrencyTrend: [-10, 10],
  giniCoefficient: [20, 100],
  usGDPGrowth: [-10, 8],
  euGDPGrowth: [-10, 6],
  chinaGDPGrowth: [-5, 10],
  usInflation: [0, 20],
  euInflation: [0, 20],
  chinaInflation: [0, 20],
  usUnemployment: [2, 25],
  euUnemployment: [2, 25],
  chinaUnemployment: [2, 25],
  usDebtGdpRatio: [0, 200],
  euDebtGdpRatio: [0, 200],
  chinaDebtGdpRatio: [0, 200],
  yieldCurve10y2y: [-4, 4],
  creditSpreadBaaAaa: [0, 5],
  policyRate: [0, 10],
  aiAdoptionRate: [0, 100]
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalize = (key: keyof CurrentSignals, value: number) => {
  const [min, max] = NORMALIZATION_RANGES[key]
  if (max === min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

export const PATTERN_LIBRARY: HistoricalPattern[] = [
  {
    id: 'ww1_eve',
    name: 'World War I Eve',
    period: '1913–1914',
    signals: { activeWarCount: 2, geopoliticalTension: 9, tradeOpenness: 75, populismIndex: 7 },
    outcomes: {
      at6months: 'Assassination triggers cascade',
      at1year: 'Full continental war',
      at3years: 'Empires collapsing',
      at5years: 'New world order, 20M dead'
    },
    gdpChange1yr: -8,
    conflictChange: 90,
    recoveryYears: 15,
    keyLesson: 'High tension plus nationalism can ignite systemic war.'
  },
  {
    id: 'great_depression_eve',
    name: 'Great Depression Eve',
    period: '1928–1929',
    signals: { oilPrice: 20, globalGDPGrowth: 4.5, inflationRate: 0.5, unemploymentRate: 3.2, populismIndex: 4 },
    outcomes: {
      at6months: 'Stock market crash Oct 1929',
      at1year: 'Bank runs begin',
      at3years: 'GDP -27%, unemployment 25%',
      at5years: 'New Deal, rearmament begins'
    },
    gdpChange1yr: -8.5,
    conflictChange: 20,
    recoveryYears: 10,
    keyLesson: 'Credit bubbles collapse into prolonged demand shocks.'
  },
  {
    id: 'ww2_marshall',
    name: 'WWII Aftermath + Marshall Plan',
    period: '1945–1947',
    signals: { oilPrice: 2, globalGDPGrowth: -5, conflictDeaths12mo: 500000, geopoliticalTension: 8 },
    outcomes: {
      at6months: 'War ends, reconstruction chaos',
      at1year: 'Marshall Plan announced',
      at3years: 'Bretton Woods functioning, growth returns',
      at5years: '30 years of Western growth begins'
    },
    gdpChange1yr: 5,
    conflictChange: -70,
    recoveryYears: 3,
    keyLesson: 'Coordinated rebuilding can flip post-war outcomes quickly.'
  },
  {
    id: 'cold_war_stable',
    name: 'Cold War Stable',
    period: '1953–1962',
    signals: { activeWarCount: 3, nuclearThreatLevel: 7, geopoliticalTension: 8, tradeOpenness: 45, globalGDPGrowth: 4 },
    outcomes: {
      at6months: 'Proxy wars contained',
      at1year: 'Arms race intensifies but no direct conflict',
      at3years: 'Stable bipolarity',
      at5years: 'Economic growth within blocs, space race'
    },
    gdpChange1yr: 3.8,
    conflictChange: 10,
    recoveryYears: 0,
    keyLesson: 'High tension can coexist with stable growth when rules are clear.'
  },
  {
    id: 'oil_shock_1973',
    name: 'Oil Shock',
    period: '1973',
    signals: { oilPrice: 12, inflationRate: 8, geopoliticalTension: 7, tradeOpenness: 60 },
    outcomes: {
      at6months: 'Stagflation hits, queues at gas stations',
      at1year: 'Recession across Western world',
      at3years: 'Structural shift — Japan rises, US weakens',
      at5years: 'Petrodollar system reshapes global finance'
    },
    gdpChange1yr: -2.5,
    conflictChange: 15,
    recoveryYears: 6,
    keyLesson: 'Energy chokepoints propagate through inflation and growth.'
  },
  {
    id: 'ussr_collapse',
    name: 'USSR Collapse',
    period: '1989–1991',
    signals: { globalGDPGrowth: 1.2, geopoliticalTension: 5, populismIndex: 6, tradeOpenness: 55 },
    outcomes: {
      at6months: 'Berlin Wall falls',
      at1year: 'Germany reunifies',
      at3years: '15 new nations, globalisation surge',
      at5years: 'Unipolar US moment, peace dividend'
    },
    gdpChange1yr: 2.5,
    conflictChange: -40,
    recoveryYears: 2,
    keyLesson: 'Geopolitical thaw unlocks trade and growth.'
  },
  {
    id: 'dotcom_bubble',
    name: 'Dot-Com Bubble',
    period: '1999–2000',
    signals: { globalGDPGrowth: 4.5, aiInvestmentBillions: 80, techLayoffs12mo: 5000, unemploymentRate: 4.0, inflationRate: 2.2 },
    outcomes: {
      at6months: 'Bubble peaks, warning signs',
      at1year: 'Crash -78% Nasdaq',
      at3years: 'Recession then recovery, real internet companies survive',
      at5years: 'Web 2.0 — social media, mobile emerge'
    },
    gdpChange1yr: -1.5,
    conflictChange: 5,
    recoveryYears: 3,
    keyLesson: 'Tech booms can overshoot before delivering durable gains.'
  },
  {
    id: 'iraq_war_2003',
    name: 'Iraq War',
    period: '2003',
    signals: { activeWarCount: 2, oilPrice: 30, geopoliticalTension: 8, nuclearThreatLevel: 7, populismIndex: 5 },
    outcomes: {
      at6months: "Regime falls in 21 days, 'Mission Accomplished'",
      at1year: "Insurgency begins — real war starts after 'victory'",
      at3years: 'Civil war, 100K+ Iraqi deaths, $2T cost',
      at5years: 'Iraq destabilised, Iran becomes regional power'
    },
    gdpChange1yr: 2.8,
    conflictChange: 40,
    recoveryYears: 12,
    keyLesson: 'Regime-change wars generate long insurgency tails.'
  },
  {
    id: 'gfc_2008',
    name: 'Global Financial Crisis',
    period: '2008',
    signals: { globalGDPGrowth: 1.8, oilPrice: 145, inflationRate: 4.5, unemploymentRate: 5.8, geopoliticalTension: 4 },
    outcomes: {
      at6months: 'Lehman Brothers collapses',
      at1year: 'Global recession, GDP -4% advanced economies',
      at3years: 'Austerity → populism wave begins',
      at5years: 'Slow recovery, inequality widens, seeds of 2016 populism'
    },
    gdpChange1yr: -4.0,
    conflictChange: 8,
    recoveryYears: 7,
    keyLesson: 'Credit shocks spill into politics and long-run inequality.'
  },
  {
    id: 'arab_spring',
    name: 'Arab Spring',
    period: '2010–2011',
    signals: { oilPrice: 90, inflationRate: 8, unemploymentRate: 25, populismIndex: 8, activeWarCount: 3 },
    outcomes: {
      at6months: 'Tunisia, Egypt governments fall',
      at1year: 'Libya civil war, Syria war begins',
      at3years: 'Most transitions fail — authoritarian backlash',
      at5years: 'Syria war kills 500K, refugee crisis reshapes Europe'
    },
    gdpChange1yr: 0.5,
    conflictChange: 55,
    recoveryYears: 10,
    keyLesson: 'High unemployment plus inflation can trigger rapid political cascades.'
  },
  {
    id: 'covid_shock',
    name: 'COVID Shock',
    period: '2020',
    signals: { globalGDPGrowth: -3.1, oilPrice: 20, unemploymentRate: 14, tradeOpenness: 40, inflationRate: 0.6 },
    outcomes: {
      at6months: '$16T global stimulus',
      at1year: 'Vaccines begin, uneven recovery',
      at3years: 'Inflation surge from stimulus + supply chains',
      at5years: 'Deglobalisation accelerated, AI investment exploded'
    },
    gdpChange1yr: 5.5,
    conflictChange: 5,
    recoveryYears: 2,
    keyLesson: 'Massive stimulus can reverse output gaps quickly.'
  },
  {
    id: 'ukraine_war_2022',
    name: 'Ukraine War',
    period: '2022',
    signals: { oilPrice: 120, activeWarCount: 5, geopoliticalTension: 9, inflationRate: 8.5, tradeOpenness: 55 },
    outcomes: {
      at6months: 'Energy crisis in Europe, food prices spike',
      at1year: 'NATO rearmed, Russia economy stressed',
      at3years: 'Frozen conflict, deglobalisation accelerates',
      at5years: 'Europe energy independent, Russia isolated'
    },
    gdpChange1yr: 0.8,
    conflictChange: 30,
    recoveryYears: 5,
    keyLesson: 'Energy shocks and rearmament lock in fragmentation.'
  },
  {
    id: 'engles_pause_industrial',
    name: "Engels' Pause (Industrial)",
    period: '1760–1840',
    signals: { techLayoffs12mo: 500000, unemploymentRate: 15, globalGDPGrowth: 0.4, populismIndex: 7, aiInvestmentBillions: 0 },
    outcomes: {
      at6months: 'Luddite riots',
      at1year: 'Factory system dominates',
      at3years: 'Wages still stagnant despite GDP growth',
      at5years: "Engels documents squalor — Engels' Pause confirmed"
    },
    gdpChange1yr: 0.4,
    conflictChange: 20,
    recoveryYears: 60,
    keyLesson: 'Fast productivity gains can leave wages lagging for decades.'
  },
  {
    id: 'ai_displacement_now',
    name: 'AI Displacement Now',
    period: '2024–2026',
    signals: { aiInvestmentBillions: 600, techLayoffs12mo: 30700, unemploymentRate: 4.2, globalGDPGrowth: 2.1, chipWarIntensity: 8 },
    outcomes: {
      at6months: 'White-collar cuts accelerate, vibecession deepens',
      at1year: 'AI productivity lag — Solow paradox repeats',
      at3years: 'K-shaped economy hardens',
      at5years: 'Engels Pause or Renaissance — the fork in the road'
    },
    gdpChange1yr: 2.2,
    conflictChange: 5,
    recoveryYears: 7,
    keyLesson: 'AI diffusion creates a fork between productivity booms and labor shocks.'
  },
  {
    id: 'iran_war_2026',
    name: 'Iran War 2026',
    period: 'March 2026',
    signals: { oilPrice: 100, activeWarCount: 9, geopoliticalTension: 10, nuclearThreatLevel: 7, conflictDeaths12mo: 280000 },
    outcomes: {
      at6months: 'Guerrilla phase begins, Hormuz partial reopening',
      at1year: 'Frozen conflict or regional escalation fork',
      at3years: 'Libya-style failed state or Korea-style armistice',
      at5years: 'Iran proxy network reconstituted under new names'
    },
    gdpChange1yr: 1.5,
    conflictChange: 15,
    recoveryYears: 8,
    keyLesson: 'Regional wars restructure alliances and energy corridors.'
  }
]

export const DEFAULT_SIGNALS: CurrentSignals = {
  oilPrice: 100,
  globalGDPGrowth: 2.1,
  inflationRate: 3.8,
  unemploymentRate: 4.2,
  activeWarCount: 9,
  conflictDeaths12mo: 280000,
  nuclearThreatLevel: 7,
  aiInvestmentBillions: 600,
  techLayoffs12mo: 30700,
  chipWarIntensity: 8,
  populismIndex: 7,
  tradeOpenness: 52,
  geopoliticalTension: 9,
  tempAnomalyC: 1.2,
  publicDebtGdpRatio: 122,
  creditGrowthRate: 4.2,
  externalDebtGdpRatio: 65,
  robotsPer1000Workers: 2.1,
  laborShareOfIncome: 57,
  militarySpendingGrowth: 6.8,
  alliancePolarisation: 7.5,
  globalDebtToGdp: 280,
  reserveCurrencyTrend: -2.5,
  giniCoefficient: 66,
  usGDPGrowth: 2.0,
  euGDPGrowth: 1.4,
  chinaGDPGrowth: 4.5,
  usInflation: 3.0,
  euInflation: 2.5,
  chinaInflation: 2.0,
  usUnemployment: 4.0,
  euUnemployment: 6.0,
  chinaUnemployment: 4.8,
  usDebtGdpRatio: 122,
  euDebtGdpRatio: 90,
  chinaDebtGdpRatio: 85,
  yieldCurve10y2y: 0.2,
  creditSpreadBaaAaa: 1.2,
  policyRate: 4.5,
  aiAdoptionRate: 65
}

const conflictTrendFromChange = (value: number): ScenarioOutcome['conflictTrend'] => {
  if (value > 10) return 'escalating'
  if (value < -10) return 'de-escalating'
  return 'stable'
}

const weightedAverage = (items: MatchedPattern[], accessor: (item: MatchedPattern) => number) => {
  const totalWeight = items.reduce((sum, item) => sum + item.analogyScore, 0)
  if (totalWeight === 0) return 0
  return items.reduce((sum, item) => sum + accessor(item) * item.analogyScore, 0) / totalWeight
}

const inferPatternCategory = (pattern: HistoricalPattern) => {
  const text = `${pattern.name} ${pattern.keyLesson} ${pattern.outcomes.at1year}`.toLowerCase()
  if (/(war|conflict|invasion|battle|armistice|nuclear)/.test(text)) return 'war'
  if (/(inflation|recession|depression|crisis|bust|shock|default)/.test(text)) return 'economic'
  if (/(ai|tech|internet|electric|industrial|automation)/.test(text)) return 'tech'
  if (/(pandemic|health|virus|covid|flu)/.test(text)) return 'society'
  if (/(climate|warming|energy|oil|carbon)/.test(text)) return 'climate'
  if (/(election|populism|authoritarian|political|coup|reform)/.test(text)) return 'political'
  return 'general'
}

const scoreContextBoost = (pattern: HistoricalPattern, contextEvents?: ContextEvent[]) => {
  if (!contextEvents || contextEvents.length === 0) return 0
  const category = inferPatternCategory(pattern)
  const text = contextEvents
    .map((event) => `${event.label} ${event.description ?? ''}`.toLowerCase())
    .join(' ')

  const categoryHits: Record<string, RegExp> = {
    war: /(war|conflict|battle|attack|missile|drone|invasion|ceasefire)/g,
    economic: /(recession|crisis|inflation|debt|bank|default|collapse|shock)/g,
    tech: /(ai|chip|semiconductor|automation|technology|internet|cyber)/g,
    society: /(pandemic|health|protest|strike|unrest|migration)/g,
    climate: /(climate|warming|flood|drought|hurricane|wildfire|energy)/g,
    political: /(election|coup|sanction|treaty|parliament|government)/g,
    general: /(crisis|conflict|shock|war)/g
  }

  const regex = categoryHits[category] ?? categoryHits.general
  const hits = (text.match(regex) ?? []).length
  return Math.min(0.12, hits * 0.01)
}

const computeMSEScore = (pattern: HistoricalPattern, signals: CurrentSignals) => {
  const keys = Object.keys(pattern.signals) as Array<keyof CurrentSignals>
  const diffs: number[] = []

  keys.forEach((key) => {
    const patternValue = pattern.signals[key]
    const currentValue = signals[key]
    if (patternValue === undefined || currentValue === undefined) return
    const normalizedCurrent = normalize(key, currentValue)
    const normalizedPattern = normalize(key, patternValue)
    diffs.push(Math.pow(normalizedCurrent - normalizedPattern, 2))
  })

  const meanSquaredDifference = diffs.length ? diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length : 1
  return 1 / (1 + meanSquaredDifference)
}

export const reinhartRogoffScore = (signals: CurrentSignals) => {
  let riskScore = 0
  if (signals.publicDebtGdpRatio > 90) {
    riskScore += 0.3 * ((signals.publicDebtGdpRatio - 90) / 100)
  }
  if (signals.creditGrowthRate > 10) {
    riskScore += 0.25
  }
  if (signals.externalDebtGdpRatio > 60) {
    riskScore += 0.2
  }
  const gdpPenalty = signals.publicDebtGdpRatio > 90 ? -1.0 * ((signals.publicDebtGdpRatio - 90) / 90) : 0
  return { riskScore: Math.min(riskScore, 1), gdpPenalty }
}

export const acemogluDisplacementScore = (signals: CurrentSignals) => {
  const robotWageEffect = signals.robotsPer1000Workers * -0.42
  const automationRate = (signals.techLayoffs12mo / 500000) * (signals.aiInvestmentBillions / 600)
  const laborShareDelta = -automationRate * 0.34
  const sosoRisk = signals.aiInvestmentBillions > 300 && signals.globalGDPGrowth < 2.5 ? 0.4 : 0.1

  return {
    wageEffect: robotWageEffect,
    laborShareDelta,
    displacementRisk: Math.min(sosoRisk + automationRate * 0.3, 1)
  }
}

export const nordhausDamageFunction = (tempAnomaly: number) => {
  const alpha = 0.00236
  const damage = 1 - 1 / (1 + alpha * Math.pow(tempAnomaly, 2))
  return damage * 100
}

export const richardsonArmsDynamics = (signals: CurrentSignals) => {
  const reactionRate = signals.geopoliticalTension / 10
  const fatigueRate = 0.3
  const grievance = signals.activeWarCount / 15

  const conflictAcceleration =
    reactionRate * (signals.militarySpendingGrowth / 100) - fatigueRate * 0.5 + grievance

  const z =
    -4.5 +
    signals.geopoliticalTension * 0.4 +
    signals.nuclearThreatLevel * -0.3 +
    signals.alliancePolarisation * 0.25 +
    signals.activeWarCount * 0.15
  const warProbability12mo = 1 / (1 + Math.exp(-z))

  return { conflictAcceleration, warProbability12mo }
}

export const brynjolfssonJCurve = (signals: CurrentSignals, yearsIntoAIEra: number) => {
  const baseLag = 11
  const diffusionAdjustment = (signals.aiInvestmentBillions / 600) * 3
  const adjustedLag = baseLag - diffusionAdjustment

  const phase =
    yearsIntoAIEra < adjustedLag * 0.4
      ? 'investment'
      : yearsIntoAIEra < adjustedLag
        ? 'reorganisation'
        : 'harvest'

  const adoptionRate = signals.aiAdoptionRate ?? 65
  const productivityEffect =
    phase === 'investment'
      ? -0.1 * (signals.aiInvestmentBillions / 600)
      : phase === 'reorganisation'
        ? 0.05
        : Math.min(3.5, (yearsIntoAIEra - adjustedLag) * 0.4 * (adoptionRate / 100))

  return {
    currentPhase: phase as 'investment' | 'reorganisation' | 'harvest',
    productivityEffect,
    lagYearsRemaining: Math.max(0, adjustedLag - yearsIntoAIEra)
  }
}

export const dalioCyclePosition = (signals: CurrentSignals) => {
  let cycleScore = 0

  if (signals.globalDebtToGdp > 250) cycleScore += 30
  if (signals.globalDebtToGdp > 300) cycleScore += 20
  if (signals.publicDebtGdpRatio > 100) cycleScore += 15
  if (signals.giniCoefficient > 70) cycleScore += 10
  if (signals.reserveCurrencyTrend < -3) cycleScore += 15
  if (signals.inflationRate > 4) cycleScore += 10

  const phase =
    cycleScore < 30
      ? 'expansion'
      : cycleScore < 50
        ? 'peak'
        : cycleScore < 70
          ? 'deleveraging'
          : cycleScore < 85
            ? 'crisis'
            : 'recovery'

  const yearsToNextCrisis = Math.max(1, 10 - (cycleScore - 40) / 10)

  return {
    cyclePhase: phase as 'expansion' | 'peak' | 'deleveraging' | 'crisis' | 'recovery',
    cycleRisk: cycleScore / 100,
    yearsToNextCrisis
  }
}

const computeAllModels = (signals: CurrentSignals): ModelOutputs => {
  const aiEraYear = new Date().getFullYear() - 2012
  return {
    reinhartRogoff: reinhartRogoffScore(signals),
    acemoglu: acemogluDisplacementScore(signals),
    nordhaus: nordhausDamageFunction(signals.tempAnomalyC),
    richardson: richardsonArmsDynamics(signals),
    brynjolfsson: brynjolfssonJCurve(signals, aiEraYear),
    dalio: dalioCyclePosition(signals),
    policy: policyReactionFunction(signals),
    market: marketSignalScore(signals)
  }
}

const policyReactionFunction = (signals: CurrentSignals) => {
  const inflationTarget = 2.0
  const neutralRate = 2.0
  const unemploymentNatural = 4.0
  const inflationGap = signals.inflationRate - inflationTarget
  const unemploymentGap = signals.unemploymentRate - unemploymentNatural
  const taylorRate = neutralRate + 1.5 * inflationGap - 0.5 * unemploymentGap
  const currentRate = signals.policyRate
  const projectedRate = 0.7 * currentRate + 0.3 * taylorRate
  const rateGap = projectedRate - currentRate
  const fiscalImpulse = Math.max(-2, Math.min(2, (signals.publicDebtGdpRatio - 90) / 50)) * -0.5
  const policyDrag = Math.max(-3, Math.min(3, (projectedRate - neutralRate) * 0.35)) + fiscalImpulse
  return {
    policyRate: Number(currentRate.toFixed(2)),
    taylorRate: Number(taylorRate.toFixed(2)),
    projectedRate: Number(projectedRate.toFixed(2)),
    rateGap: Number(rateGap.toFixed(2)),
    policyDrag: Number(policyDrag.toFixed(2)),
    fiscalImpulse: Number(fiscalImpulse.toFixed(2))
  }
}

const marketSignalScore = (signals: CurrentSignals) => {
  const yieldCurve = signals.yieldCurve10y2y
  const creditSpread = signals.creditSpreadBaaAaa
  const yieldStress = yieldCurve < 0 ? clamp(Math.abs(yieldCurve) / 2, 0, 1) : 0
  const creditStress = clamp((creditSpread - 1) / 2.5, 0, 1)
  const stressScore = clamp(0.55 * yieldStress + 0.45 * creditStress, 0, 1)
  return {
    yieldCurve,
    creditSpread,
    stressScore: Number(stressScore.toFixed(2))
  }
}

const macroCoreGDP = (
  signals: CurrentSignals,
  modelOutputs: ModelOutputs,
  calibrationAdj: number
) => {
  const baseGrowth =
    0.5 * signals.globalGDPGrowth +
    0.2 * signals.usGDPGrowth +
    0.15 * signals.euGDPGrowth +
    0.15 * signals.chinaGDPGrowth
  let gdp = baseGrowth + calibrationAdj
  gdp += modelOutputs.reinhartRogoff.gdpPenalty
  gdp -= modelOutputs.nordhaus
  const aiEffect = modelOutputs.brynjolfsson.currentPhase === 'harvest'
    ? modelOutputs.brynjolfsson.productivityEffect * 0.6
    : modelOutputs.brynjolfsson.productivityEffect * 0.3
  gdp += aiEffect

  const oilDragLinear = Math.max(0, (signals.oilPrice - 70) / 100) * 0.6
  const oilDragKink =
    signals.oilPrice > 120 ? Math.pow((signals.oilPrice - 120) / 80, 2) * 1.2 : 0
  gdp -= oilDragLinear + oilDragKink

  const marketDrag = modelOutputs.market.stressScore * 1.1
  gdp -= marketDrag

  const debtDragFactor = signals.publicDebtGdpRatio > 120 ? 0.6 : signals.publicDebtGdpRatio > 90 ? 0.8 : 1
  gdp += modelOutputs.policy.policyDrag * debtDragFactor

  const socialStress = clamp(
    (signals.unemploymentRate - 4) / 10 + (signals.inflationRate - 3) / 10 + (signals.populismIndex / 10) * 0.2,
    -1,
    2
  )
  gdp -= socialStress * 0.3

  if (signals.tempAnomalyC > 2.0) {
    const tippingMultiplier = 1 + (signals.tempAnomalyC - 2.0) * 0.5
    gdp -= modelOutputs.nordhaus * tippingMultiplier
  }

  if (modelOutputs.richardson.warProbability12mo > 0.5 || signals.activeWarCount > 7) {
    gdp -= 0.8
  } else if (modelOutputs.richardson.warProbability12mo > 0.35) {
    gdp -= 0.4
  }

  return Number(gdp.toFixed(2))
}

const computeConflictIndex = (
  signals: CurrentSignals,
  modelOutputs: ModelOutputs,
  weightedConflict: number
) => {
  const socialStress = clamp(
    (signals.unemploymentRate - 4) / 10 + (signals.inflationRate - 3) / 10 + (signals.populismIndex / 10) * 0.2,
    -1,
    2
  )
  return weightedConflict + modelOutputs.richardson.conflictAcceleration * 5 + socialStress * 2
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

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return Number(sorted[idx].toFixed(2))
}

const computeUncertaintyBands = (
  signals: CurrentSignals,
  modelOutputs: ModelOutputs,
  weightedConflict: number
) => {
  const seed = Math.round(signals.oilPrice * 100 + signals.globalGDPGrowth * 10 + signals.inflationRate * 7)
  const rand = createSeededRandom(seed)
  const simulations = 200
  const gdpSamples: number[] = []
  const conflictSamples: number[] = []
  const oilSamples: number[] = []

  for (let i = 0; i < simulations; i += 1) {
    const shockInflation = gaussian(rand) * 0.6
    const shockOil = gaussian(rand) * 5
    const shockUnemployment = gaussian(rand) * 0.4
    const shockConflict = gaussian(rand) * 0.3

    const perturbed = clampSignals({
      ...signals,
      inflationRate: signals.inflationRate + shockInflation,
      oilPrice: signals.oilPrice + shockOil,
      unemploymentRate: signals.unemploymentRate + shockUnemployment,
      geopoliticalTension: signals.geopoliticalTension + shockConflict
    })

    const calibrationAdj = computeCalibrationAdjustment(perturbed)
    const gdp = macroCoreGDP(perturbed, modelOutputs, calibrationAdj)
    const conflict = computeConflictIndex(perturbed, modelOutputs, weightedConflict)
    const oil = perturbed.oilPrice * (1 + conflict / 300)

    gdpSamples.push(gdp)
    conflictSamples.push(conflict)
    oilSamples.push(oil)
  }

  return {
    gdp: {
      p10: percentile(gdpSamples, 10),
      p50: percentile(gdpSamples, 50),
      p90: percentile(gdpSamples, 90)
    },
    conflict: {
      p10: percentile(conflictSamples, 10),
      p50: percentile(conflictSamples, 50),
      p90: percentile(conflictSamples, 90)
    },
    oil: {
      p10: percentile(oilSamples, 10),
      p50: percentile(oilSamples, 50),
      p90: percentile(oilSamples, 90)
    }
  }
}

const computeCompositeScore = (
  pattern: HistoricalPattern,
  signals: CurrentSignals,
  modelOutputs: ModelOutputs,
  contextEvents?: ContextEvent[]
) => {
  const mseScore = computeMSEScore(pattern, signals) * 0.4

  const rrBoost = ['great_depression_eve', 'gfc_2008', 'dotcom_bubble'].includes(pattern.id)
    ? modelOutputs.reinhartRogoff.riskScore * 0.15
    : 0

  const richardsonBoost =
    ['ww1_eve', 'ww2_marshall', 'ukraine_war_2022', 'iran_war_2026', 'cold_war_stable'].includes(pattern.id)
      ? modelOutputs.richardson.warProbability12mo * 0.15
      : 0

  const techBoost = ['dotcom_bubble', 'engles_pause_industrial', 'ai_displacement_now'].includes(pattern.id)
    ? modelOutputs.brynjolfsson.currentPhase === 'reorganisation'
      ? 0.15
      : 0.05
    : 0

  const dalioBoost = ['great_depression_eve', 'gfc_2008', 'ussr_collapse'].includes(pattern.id)
    ? modelOutputs.dalio.cycleRisk * 0.15
    : 0

  const baseScore = mseScore + rrBoost + richardsonBoost + techBoost + dalioBoost
  const contextBoost = scoreContextBoost(pattern, contextEvents)
  return Math.min(1, baseScore + contextBoost)
}

export const getMostAlarmedModel = (outputs: ModelOutputs) => {
  const scores = [
    { name: 'Reinhart-Rogoff debt', value: outputs.reinhartRogoff.riskScore },
    { name: 'Acemoglu displacement', value: outputs.acemoglu.displacementRisk },
    { name: 'Nordhaus climate', value: outputs.nordhaus / 5 },
    { name: 'Richardson arms', value: outputs.richardson.warProbability12mo },
    { name: 'Dalio debt cycle', value: outputs.dalio.cycleRisk }
  ]

  return scores.sort((a, b) => b.value - a.value)[0]
}

export const findAnalogies = (
  current: CurrentSignals,
  topN = 3,
  contextEvents?: ContextEvent[],
  modelOutputs?: ModelOutputs
): MatchedPattern[] => {
  const outputs = modelOutputs ?? computeAllModels(current)

  const scored = PATTERN_LIBRARY.map((pattern) => {
    const analogyScore = computeCompositeScore(pattern, current, outputs, contextEvents)
    return { ...pattern, analogyScore }
  })

  return scored
    .sort((a, b) => b.analogyScore - a.analogyScore)
    .slice(0, topN)
    .map((pattern) => ({ ...pattern, analogyScore: Number(pattern.analogyScore.toFixed(4)) }))
}

const buildScenario = (
  label: 'mostLikely' | 'optimistic' | 'pessimistic',
  topAnalogies: MatchedPattern[],
  current: CurrentSignals,
  modelOutputs: ModelOutputs
): ScenarioOutcome => {
  const base = topAnalogies[0]
  const weightedGDP = weightedAverage(topAnalogies, (item) => item.gdpChange1yr)
  const weightedConflict = weightedAverage(topAnalogies, (item) => item.conflictChange)

  let adjustment = 0
  if (label === 'optimistic') adjustment = 1.2
  if (label === 'pessimistic') adjustment = -1.6

  let gdpGrowthNextYear = weightedGDP + adjustment
  const calibrationAdj = computeCalibrationAdjustment(current)
  gdpGrowthNextYear = macroCoreGDP(current, modelOutputs, calibrationAdj) + adjustment

  const conflictAdjustment = computeConflictIndex(current, modelOutputs, weightedConflict)
  const oilPriceNextYear = current.oilPrice * (1 + conflictAdjustment / 300) + adjustment * 3
  const conflictTrend = conflictTrendFromChange(conflictAdjustment + adjustment * 6)

  return {
    probability: label === 'mostLikely' ? 0.52 : label === 'optimistic' ? 0.24 : 0.24,
    gdpGrowthNextYear: Number(gdpGrowthNextYear.toFixed(2)),
    conflictTrend,
    oilPriceNextYear: Number(oilPriceNextYear.toFixed(2)),
    headline:
      label === 'mostLikely'
        ? `Signals align most with ${base.name}, implying ${conflictTrend} conflict and moderate growth.`
        : label === 'optimistic'
          ? `Policy coordination bends outcomes toward a softer landing.`
          : `Shocks compound, echoing the hardest historical analogs.`,
    at6months: base.outcomes.at6months,
    at1year: base.outcomes.at1year,
    at3years: base.outcomes.at3years,
    at5years: base.outcomes.at5years,
    historicalPrecedent: `Similar to ${base.name} (${base.period})`
  }
}

export const generatePrediction = (
  rawSignals: CurrentSignals,
  contextEvents?: ContextEvent[],
  mode: PredictionMode = 'full'
): TimeMachinePrediction => {
  const signals = clampSignals(rawSignals)
  const modelOutputs = computeAllModels(signals)
  const useContext = mode === 'full' ? contextEvents : undefined
  const topAnalogies = findAnalogies(signals, 3, useContext, modelOutputs)
  const mostLikely = buildScenario('mostLikely', topAnalogies, signals, modelOutputs)
  const optimistic = buildScenario('optimistic', topAnalogies, signals, modelOutputs)
  const pessimistic = buildScenario('pessimistic', topAnalogies, signals, modelOutputs)

  const keyRisks: Risk[] = []
  if (signals.oilPrice > 100) {
    keyRisks.push({ label: 'Energy shock risk — similar to 1973, 2008', severity: 'high' })
  }
  if (signals.activeWarCount > 7) {
    keyRisks.push({ label: 'Multi-front conflict risk — similar to 1939', severity: 'high' })
  }
  if (signals.aiInvestmentBillions > 400 && signals.techLayoffs12mo > 20000) {
    keyRisks.push({ label: "Engels' Pause risk — productivity lag likely", severity: 'medium' })
  }
  if (signals.nuclearThreatLevel > 6) {
    keyRisks.push({ label: 'Nuclear escalation risk — limited precedent', severity: 'high' })
  }
  if (signals.populismIndex > 7) {
    keyRisks.push({ label: 'Political rupture risk — similar to 1930s', severity: 'medium' })
  }
  if (signals.yieldCurve10y2y < 0) {
    keyRisks.push({ label: 'Yield curve inversion risk — recession signal', severity: 'medium' })
  }
  if (signals.creditSpreadBaaAaa > 1.8) {
    keyRisks.push({ label: 'Credit stress risk — spreads widening', severity: 'medium' })
  }
  if (modelOutputs.reinhartRogoff.riskScore > 0.4) {
    keyRisks.push({ label: 'Debt crisis risk — Reinhart-Rogoff thresholds breached', severity: 'high' })
  }
  if (modelOutputs.richardson.warProbability12mo > 0.35) {
    keyRisks.push({ label: 'Arms race escalation risk — Richardson dynamics intensifying', severity: 'high' })
  }

  const keyOpportunities: Opportunity[] = []
  if (signals.aiInvestmentBillions > 300 && signals.unemploymentRate < 6) {
    keyOpportunities.push({ label: 'AI productivity upside if diffusion stays inclusive', severity: 'medium' })
  }
  if (signals.tradeOpenness > 60) {
    keyOpportunities.push({ label: 'Trade resilience could dampen shocks', severity: 'low' })
  }
  if (signals.tempAnomalyC < 1.5) {
    keyOpportunities.push({ label: 'Climate transition window still open', severity: 'low' })
  }
  if (modelOutputs.brynjolfsson.currentPhase === 'harvest') {
    keyOpportunities.push({ label: 'GPT harvest phase — productivity unlocks accelerating', severity: 'medium' })
  }

  if (mode === 'backtest') {
    const calibrated = computeCalibratedGDP(signals)
    const baseScenario = { ...mostLikely, gdpGrowthNextYear: Number(calibrated.toFixed(2)) }
    const uncertainty = computeUncertaintyBands(signals, modelOutputs, weightedAverage(topAnalogies, (item) => item.conflictChange))
    return {
      topAnalogies,
      scenarios: {
        mostLikely: baseScenario,
        optimistic: baseScenario,
        pessimistic: baseScenario
      },
      keyRisks: [],
      keyOpportunities: [],
      confidenceScore: 0,
      modelOutputs,
      uncertainty
    }
  }

  const confidenceScore = Math.round((topAnalogies[0]?.analogyScore ?? 0) * 100)
  const uncertainty = computeUncertaintyBands(signals, modelOutputs, weightedAverage(topAnalogies, (item) => item.conflictChange))

  return {
    topAnalogies,
    scenarios: {
      mostLikely,
      optimistic,
      pessimistic
    },
    keyRisks,
    keyOpportunities,
    confidenceScore,
    modelOutputs,
    uncertainty
  }
}
