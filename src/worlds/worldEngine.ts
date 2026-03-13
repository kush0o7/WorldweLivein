export type SimEventCategory = 'war' | 'ai' | 'economic' | 'political' | 'climate' | 'tech' | 'society'
export type SimEventSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface WorldConfig {
  id: string
  name: string
  color: string
  probability?: number
  analogy?: string
  params: {
    iranWarIntensity: number
    russiaUkraineStatus: number
    usChinaTension: number
    hormuzClosure: number
    aiAdoptionRate: number
    aiGovernance: number
    techDecoupling: number
    fiscalResponse: number
    tradeOpenness: number
    greenTransition: number
    politicalStability: number
    inequalityLevel: number
  }
}

export interface SimResult {
  gdpGrowth: number[]
  conflictIndex: number[]
  oilPrice: number[]
  whiteCollarJobsDisrupted: number[]
  aiProductivityContribution: number[]
  giniCoefficient: number[]
  geopoliticalFragmentation: number[]
  temperatureAnomaly: number[]
  events: SimEvent[]
}

export interface SimEvent {
  year: number
  category: SimEventCategory
  title: string
  description: string
  severity: SimEventSeverity
}

const BASE_YEAR = 2026

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

const hashSeed = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const seededNoise = (seed: number, year: number, scale = 1) => {
  const x = Math.sin(seed * 997 + year * 1013) * 10000
  return (x - Math.floor(x) - 0.5) * scale
}

const lagFactor = (year: number, rate: number) => {
  const lagStart = 7 - (rate / 100) * 4
  const linear = clamp((year - lagStart) / 4, 0, 1)
  if (rate > 50) {
    return clamp(sigmoid((year - lagStart) / 2), 0, 1)
  }
  return linear
}

export function simulateWorld(config: WorldConfig, years: number): SimResult {
  const gdpGrowth: number[] = []
  const conflictIndex: number[] = []
  const oilPrice: number[] = []
  const whiteCollarJobsDisrupted: number[] = []
  const aiProductivityContribution: number[] = []
  const giniCoefficient: number[] = []
  const geopoliticalFragmentation: number[] = []
  const temperatureAnomaly: number[] = []
  const events: SimEvent[] = []

  const seed = hashSeed(config.id)

  for (let year = 0; year < years; year += 1) {
    const noise = seededNoise(seed, year, 0.6)

    const aiLag = lagFactor(year, config.params.aiAdoptionRate)
    const aiBoost = config.params.aiAdoptionRate * 0.04 * aiLag
    const oilDrag = config.params.hormuzClosure * 0.015
    const warDrag = config.params.iranWarIntensity * 0.012 + config.params.russiaUkraineStatus * 0.004
    const tradeDrag = config.params.techDecoupling * 0.008
    const baseGrowth = 2.2

    const gdp = baseGrowth + aiBoost - oilDrag - warDrag - tradeDrag + noise
    gdpGrowth.push(Number(gdp.toFixed(2)))

    const oilBase = 100
    const hormuzPremium = config.params.hormuzClosure * 1.2
    const decayRate = 0.85
    const oil = (oilBase + hormuzPremium) * Math.pow(decayRate, year) + 55
    oilPrice.push(Number(oil.toFixed(2)))

    const baseRate = 0.03 + (config.params.aiAdoptionRate / 100) * 0.08
    const cumulativeDisruption = 1 - Math.pow(1 - baseRate, year)
    const disruption = cumulativeDisruption * 85
    whiteCollarJobsDisrupted.push(Number(disruption.toFixed(2)))

    const aiProductivity = (config.params.aiAdoptionRate / 100) * 4.2 * aiLag
    aiProductivityContribution.push(Number(aiProductivity.toFixed(2)))

    const baseConflict = 72
    const iranResolution = -config.params.iranWarIntensity * 0.3 * Math.log(year + 1)
    const aiTension = config.params.usChinaTension * 0.15
    const conflict = clamp(baseConflict + iranResolution + aiTension + noise, 0, 100)
    conflictIndex.push(Number(conflict.toFixed(2)))

    const gini = clamp(
      48 +
        config.params.inequalityLevel * 0.35 +
        config.params.techDecoupling * 0.12 -
        config.params.fiscalResponse * 0.18 -
        config.params.greenTransition * 0.08 +
        noise,
      20,
      95
    )
    giniCoefficient.push(Number(gini.toFixed(2)))

    const fragmentation = clamp(
      30 +
        config.params.techDecoupling * 0.55 +
        (100 - config.params.tradeOpenness) * 0.25 +
        conflict * 0.2 -
        config.params.aiGovernance * 0.15,
      0,
      100
    )
    geopoliticalFragmentation.push(Number(fragmentation.toFixed(2)))

    const temp = clamp(
      1.35 +
        year * 0.03 +
        (100 - config.params.greenTransition) * 0.008 +
        (100 - config.params.politicalStability) * 0.002,
      0.8,
      3.5
    )
    temperatureAnomaly.push(Number(temp.toFixed(2)))

    const eventYear = BASE_YEAR + year

    if (oil > 130) {
      events.push({
        year: eventYear,
        category: 'economic',
        title: 'Oil Shock Spiral',
        description: 'Energy costs breach critical thresholds, amplifying inflation and sovereign stress.',
        severity: 'critical'
      })
    }

    if (conflict > 85) {
      events.push({
        year: eventYear,
        category: 'war',
        title: 'Regional War Escalation',
        description: 'Multiple theaters synchronize, triggering alliance mobilizations.',
        severity: 'critical'
      })
    }

    if (disruption > 30) {
      events.push({
        year: eventYear,
        category: 'political',
        title: 'White-Collar Backlash',
        description: 'Automation displacement ignites labor unrest and regulatory swings.',
        severity: 'high'
      })
    }

    if (aiProductivity > 2.0) {
      events.push({
        year: eventYear,
        category: 'ai',
        title: 'AI Renaissance',
        description: 'Productivity gains compound as AI diffusion clears the lag window.',
        severity: 'medium'
      })
    }

    if (gini > 75) {
      events.push({
        year: eventYear,
        category: 'society',
        title: 'Inequality Crisis',
        description: 'Wealth concentration reaches destabilizing levels, stressing institutions.',
        severity: 'high'
      })
    }

    if (temp > 2.0) {
      events.push({
        year: eventYear,
        category: 'climate',
        title: 'Climate Tipping Point',
        description: 'Warming breaches 2°C, intensifying migration and adaptation costs.',
        severity: 'critical'
      })
    }
  }

  return {
    gdpGrowth,
    conflictIndex,
    oilPrice,
    whiteCollarJobsDisrupted,
    aiProductivityContribution,
    giniCoefficient,
    geopoliticalFragmentation,
    temperatureAnomaly,
    events
  }
}
