import { CurrentSignals, TimeMachinePrediction } from './timeMachine'

const parseJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json()
}

const toNumber = (value: string | number) => {
  const parsed = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(parsed)) {
    throw new Error('Value missing')
  }
  return parsed
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10)

const requireEnv = (key: string) => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing ${key}`)
  }
  return value as string
}

async function fetchOilPrice(): Promise<number> {
  const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL=F')
  const data = await parseJson(response)
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
  if (typeof price !== 'number') {
    throw new Error('Oil price missing')
  }
  return price
}

async function fetchGlobalGDP(): Promise<number> {
  const response = await fetch(
    'https://api.worldbank.org/v2/country/WLD/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrv=1'
  )
  const data = await parseJson(response)
  const value = data?.[1]?.[0]?.value
  if (typeof value !== 'number') {
    throw new Error('GDP growth missing')
  }
  return value
}

async function fetchInflationRate(): Promise<number> {
  const apiKey = requireEnv('VITE_FRED_API_KEY')
  const response = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&limit=2&sort_order=desc&file_type=json`
  )
  const data = await parseJson(response)
  const observations = data?.observations
  if (!Array.isArray(observations) || observations.length < 2) {
    throw new Error('Inflation observations missing')
  }
  const latest = toNumber(observations[0]?.value)
  const prev = toNumber(observations[1]?.value)
  const rate = ((latest - prev) / prev) * 100
  return Number(rate.toFixed(2))
}

async function fetchUnemploymentRate(): Promise<number> {
  const apiKey = requireEnv('VITE_FRED_API_KEY')
  const response = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${apiKey}&limit=1&sort_order=desc&file_type=json`
  )
  const data = await parseJson(response)
  const value = data?.observations?.[0]?.value
  return toNumber(value)
}

const extractTimelineValues = (data: unknown): number[] => {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.flatMap((item) => extractTimelineValues(item))
  }
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (Array.isArray(record.timeline)) {
      return record.timeline
        .map((entry) => {
          if (typeof entry !== 'object' || entry === null) return null
          const e = entry as Record<string, unknown>
          const value =
            e.value ??
            e.count ??
            e.volume ??
            e.num ??
            e.numarticles ??
            e.numarts ??
            e.num_articles
          if (typeof value === 'number') return value
          if (typeof value === 'string') return Number(value)
          return null
        })
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
    }
    return Object.values(record).flatMap((value) => extractTimelineValues(value))
  }
  return []
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

async function fetchActiveWarCount(): Promise<number> {
  const query = encodeURIComponent(
    '(war OR conflict OR battle OR bombing OR shelling OR airstrike OR drone OR missile)'
  )
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=TimelineVolRaw&timespan=30d&format=json`
  const response = await fetch(url)
  const data = await parseJson(response)
  const values = extractTimelineValues(data)
  if (values.length === 0) {
    throw new Error('GDELT timeline missing')
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  const scaled = Math.round(Math.log10(total + 1) * 2.5)
  return clamp(scaled, 0, 15)
}

async function fetchTempAnomaly(): Promise<number> {
  const response = await fetch(
    'https://climate-api.open-meteo.com/v1/climate?latitude=0&longitude=0&start_date=2024-01-01&end_date=2024-12-31&models=CMIP6&daily=temperature_2m_mean'
  )
  const data = await parseJson(response)
  const temps: number[] | undefined = data?.daily?.temperature_2m_mean
  if (!Array.isArray(temps) || temps.length === 0) {
    throw new Error('Temperature data missing')
  }
  const avg = temps.reduce((sum, value) => sum + value, 0) / temps.length
  const anomaly = avg - 14
  return Number(anomaly.toFixed(2))
}

export async function fetchLiveSignals(): Promise<Partial<CurrentSignals>> {
  const results: Partial<CurrentSignals> = {}

  const [oil, gdp, inflation, unemployment, wars, temp] = await Promise.allSettled([
    fetchOilPrice(),
    fetchGlobalGDP(),
    fetchInflationRate(),
    fetchUnemploymentRate(),
    fetchActiveWarCount(),
    fetchTempAnomaly()
  ])

  if (oil.status === 'fulfilled') results.oilPrice = oil.value
  if (gdp.status === 'fulfilled') results.globalGDPGrowth = gdp.value
  if (inflation.status === 'fulfilled') results.inflationRate = inflation.value
  if (unemployment.status === 'fulfilled') results.unemploymentRate = unemployment.value
  if (wars.status === 'fulfilled') results.activeWarCount = wars.value
  if (temp.status === 'fulfilled') results.tempAnomalyC = temp.value

  return results
}

export function generateNarrative(signals: CurrentSignals, prediction: TimeMachinePrediction): string {
  const top = prediction.topAnalogies[0]
  const scenario = prediction.scenarios.mostLikely
  const score = (top.analogyScore * 100).toFixed(0)

  const oilStatus =
    signals.oilPrice > 120
      ? `Oil at $${signals.oilPrice}/barrel signals a full energy shock`
      : signals.oilPrice > 90
        ? `Oil at $${signals.oilPrice}/barrel reflects elevated geopolitical risk`
        : `Oil at $${signals.oilPrice}/barrel is within manageable range`

  const conflictStatus =
    signals.activeWarCount > 8
      ? `${signals.activeWarCount} simultaneous active war zones — the highest since WWII`
      : `${signals.activeWarCount} active conflicts creating persistent instability`

  const aiStatus =
    signals.aiInvestmentBillions > 400
      ? `AI investment at $${signals.aiInvestmentBillions}B annually is triggering the fastest technology displacement in recorded history`
      : `AI investment at $${signals.aiInvestmentBillions}B is reshaping labour markets`

  const para1 =
    `Current signals place this moment at ${score}% similarity to ${top.name} (${top.period}). ` +
    `${oilStatus}, while ${conflictStatus}. ${aiStatus}. ` +
    `The combination of simultaneous energy shock, multi-front conflict, and technology disruption ` +
    `is the defining characteristic of this analogy — ${top.keyLesson}`

  const gdpOutlook =
    scenario.gdpGrowthNextYear > 2.5
      ? `GDP growth of ${scenario.gdpGrowthNextYear}% is achievable but front-loaded with risk`
      : scenario.gdpGrowthNextYear > 0
        ? `Sluggish GDP growth of ${scenario.gdpGrowthNextYear}% reflects ongoing drag from conflicts and trade fragmentation`
        : `GDP contraction of ${scenario.gdpGrowthNextYear}% mirrors the recessionary phase of comparable historical moments`

  const oilOutlook =
    scenario.oilPriceNextYear > 100
      ? `Oil remaining above $${scenario.oilPriceNextYear} will sustain inflationary pressure into next year`
      : `Oil retreating toward $${scenario.oilPriceNextYear} would provide meaningful relief to consumers and central banks`

  const conflictOutlook =
    {
      escalating:
        'Conflict indicators point toward further escalation within 6–12 months, consistent with the early phase of the matched historical pattern.',
      stable: 'Conflict levels are likely to plateau — neither resolving nor dramatically worsening — in the near term.',
      'de-escalating':
        'Early signals suggest conflict de-escalation is probable, which historically has preceded a sharp economic recovery bounce.'
    }[scenario.conflictTrend] ?? ''

  const para2 =
    `The ${top.name} analogy resolved over ${top.recoveryYears} years. ` +
    `Applying that trajectory to current conditions: ${gdpOutlook}. ` +
    `${oilOutlook}. ${conflictOutlook} ` +
    `Historical precedent from ${top.period} suggests the 6–18 month window is the period of maximum uncertainty — ` +
    `${scenario.at1year}`

  const pivotVar =
    signals.nuclearThreatLevel > 6
      ? {
          name: 'nuclear escalation control',
          why: `With nuclear threat at ${signals.nuclearThreatLevel}/10, a single miscalculation transforms the most likely scenario into the tail-risk collapse scenario instantly. No other variable carries this binary asymmetry.`
        }
      : signals.oilPrice > 110
        ? {
            name: 'Strait of Hormuz reopening',
            why: `Every week the Strait stays constrained adds approximately 0.3% to global inflation and removes 0.2% from GDP growth. The difference between the optimistic and pessimistic scenarios maps almost exactly onto whether Hormuz reopens within 60 days or remains contested for 6+ months.`
          }
        : signals.aiInvestmentBillions > 400 && signals.techLayoffs12mo > 20000
          ? {
              name: 'AI productivity lag duration',
              why: `History shows technology revolutions take 10–30 years to appear in productivity statistics. If AI's lag is 3–5 years (the optimistic case), the growth scenarios hold. If the Solow Paradox repeats and the lag is 10+ years, the K-shaped economic divergence becomes politically explosive before the gains arrive.`
            }
          : signals.populismIndex > 7
            ? {
                name: 'political system resilience',
                why: `With populism at ${signals.populismIndex}/10, the question is not whether economic pain will produce political rupture — it is whether institutions bend or break. The 1930s showed that democracies under simultaneous economic and security stress can transition to authoritarianism within 24 months.`
              }
            : {
                name: 'central bank coordination',
                why: `With inflation at ${signals.inflationRate}% and growth slowing, the pivot variable is whether major central banks coordinate a response or act independently. The 2008 coordinated response limited damage to a single recession. Uncoordinated responses in 1929–33 turned a crash into a depression.`
              }

  const para3 =
    `The single variable that will determine which scenario branch actually plays out is ${pivotVar.name}. ` +
    `${pivotVar.why} ` +
    `This is the number to watch weekly — it will move before the macro data confirms the direction, ` +
    `giving a 2–4 month early signal window to those tracking it.`

  return [para1, para2, para3].join('\n\n')
}
