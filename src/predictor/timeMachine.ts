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
}

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
  tempAnomalyC: [0, 4]
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
  tempAnomalyC: 1.2
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

export const findAnalogies = (current: CurrentSignals, topN = 3): MatchedPattern[] => {
  const scored = PATTERN_LIBRARY.map((pattern) => {
    const keys = Object.keys(pattern.signals) as Array<keyof CurrentSignals>
    const diffs: number[] = []

    keys.forEach((key) => {
      const patternValue = pattern.signals[key]
      const currentValue = current[key]
      if (patternValue === undefined || currentValue === undefined) return
      const normalizedCurrent = normalize(key, currentValue)
      const normalizedPattern = normalize(key, patternValue)
      diffs.push(Math.pow(normalizedCurrent - normalizedPattern, 2))
    })

    const meanSquaredDifference = diffs.length ? diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length : 1
    const analogyScore = 1 / (1 + meanSquaredDifference)

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
  current: CurrentSignals
): ScenarioOutcome => {
  const base = topAnalogies[0]
  const weightedGDP = weightedAverage(topAnalogies, (item) => item.gdpChange1yr)
  const weightedConflict = weightedAverage(topAnalogies, (item) => item.conflictChange)

  let adjustment = 0
  if (label === 'optimistic') adjustment = 1.2
  if (label === 'pessimistic') adjustment = -1.6

  const gdpGrowthNextYear = Number((weightedGDP + adjustment).toFixed(2))
  const oilPriceNextYear = Number((current.oilPrice * (1 + weightedConflict / 300) + adjustment * 3).toFixed(2))
  const conflictTrend = conflictTrendFromChange(weightedConflict + adjustment * 6)

  return {
    probability: label === 'mostLikely' ? 0.52 : label === 'optimistic' ? 0.24 : 0.24,
    gdpGrowthNextYear,
    conflictTrend,
    oilPriceNextYear,
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

export const generatePrediction = (current: CurrentSignals): TimeMachinePrediction => {
  const topAnalogies = findAnalogies(current, 3)
  const mostLikely = buildScenario('mostLikely', topAnalogies, current)
  const optimistic = buildScenario('optimistic', topAnalogies, current)
  const pessimistic = buildScenario('pessimistic', topAnalogies, current)

  const keyRisks: Risk[] = []
  if (current.oilPrice > 100) {
    keyRisks.push({ label: 'Energy shock risk — similar to 1973, 2008', severity: 'high' })
  }
  if (current.activeWarCount > 7) {
    keyRisks.push({ label: 'Multi-front conflict risk — similar to 1939', severity: 'high' })
  }
  if (current.aiInvestmentBillions > 400 && current.techLayoffs12mo > 20000) {
    keyRisks.push({ label: "Engels' Pause risk — productivity lag likely", severity: 'medium' })
  }
  if (current.nuclearThreatLevel > 6) {
    keyRisks.push({ label: 'Nuclear escalation risk — limited precedent', severity: 'high' })
  }
  if (current.populismIndex > 7) {
    keyRisks.push({ label: 'Political rupture risk — similar to 1930s', severity: 'medium' })
  }

  const keyOpportunities: Opportunity[] = []
  if (current.aiInvestmentBillions > 300 && current.unemploymentRate < 6) {
    keyOpportunities.push({ label: 'AI productivity upside if diffusion stays inclusive', severity: 'medium' })
  }
  if (current.tradeOpenness > 60) {
    keyOpportunities.push({ label: 'Trade resilience could dampen shocks', severity: 'low' })
  }
  if (current.tempAnomalyC < 1.5) {
    keyOpportunities.push({ label: 'Climate transition window still open', severity: 'low' })
  }

  const confidenceScore = Math.round((topAnalogies[0]?.analogyScore ?? 0) * 100)

  return {
    topAnalogies,
    scenarios: {
      mostLikely,
      optimistic,
      pessimistic
    },
    keyRisks,
    keyOpportunities,
    confidenceScore
  }
}
