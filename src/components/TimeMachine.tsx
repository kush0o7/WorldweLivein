import { useEffect, useMemo, useState } from 'react'
import {
  CurrentSignals,
  DEFAULT_SIGNALS,
  generatePrediction,
  TimeMachinePrediction
} from '../predictor/timeMachine'
import { fetchLiveSignals, generateNarrative } from '../predictor/liveSignals'

const inputFields: Array<{ key: keyof CurrentSignals; label: string; suffix?: string; source?: string }> = [
  { key: 'oilPrice', label: 'Oil Price', suffix: '$/barrel', source: 'Yahoo Finance' },
  { key: 'globalGDPGrowth', label: 'Global GDP Growth', suffix: '% YoY', source: 'World Bank' },
  { key: 'inflationRate', label: 'Inflation Rate', suffix: '%', source: 'FRED' },
  { key: 'unemploymentRate', label: 'Unemployment Rate', suffix: '%', source: 'FRED' },
  { key: 'activeWarCount', label: 'Active War Count', source: 'GDELT (news volume proxy)' },
  { key: 'conflictDeaths12mo', label: 'Conflict Deaths (12 mo)' },
  { key: 'nuclearThreatLevel', label: 'Nuclear Threat Level', suffix: '0-10' },
  { key: 'aiInvestmentBillions', label: 'AI Investment', suffix: '$B' },
  { key: 'techLayoffs12mo', label: 'Tech Layoffs (12 mo)' },
  { key: 'chipWarIntensity', label: 'Chip War Intensity', suffix: '0-10' },
  { key: 'populismIndex', label: 'Populism Index', suffix: '0-10' },
  { key: 'tradeOpenness', label: 'Trade Openness', suffix: '0-100' },
  { key: 'geopoliticalTension', label: 'Geopolitical Tension', suffix: '0-10' },
  { key: 'tempAnomalyC', label: 'Temp Anomaly', suffix: '°C', source: 'Open-Meteo' }
]

const severityColors: Record<string, string> = {
  high: '#E24B4A',
  medium: '#D85A30',
  low: '#1D9E75'
}

const statusStyles: Record<string, { color: string; label: string }> = {
  live: { color: '#1D9E75', label: 'Live' },
  stale: { color: '#BA7517', label: 'Stale' },
  manual: { color: '#94A3B8', label: 'Manual' }
}

type DataStatus = 'live' | 'stale' | 'manual'

type StatusMap = Record<keyof CurrentSignals, DataStatus>

type TimestampMap = Partial<Record<keyof CurrentSignals, number>>

const buildDefaultStatus = (): StatusMap => ({
  oilPrice: 'manual',
  globalGDPGrowth: 'manual',
  inflationRate: 'manual',
  unemploymentRate: 'manual',
  activeWarCount: 'manual',
  conflictDeaths12mo: 'manual',
  nuclearThreatLevel: 'manual',
  aiInvestmentBillions: 'manual',
  techLayoffs12mo: 'manual',
  chipWarIntensity: 'manual',
  populismIndex: 'manual',
  tradeOpenness: 'manual',
  geopoliticalTension: 'manual',
  tempAnomalyC: 'manual'
})

const liveFields: Array<keyof CurrentSignals> = [
  'oilPrice',
  'globalGDPGrowth',
  'inflationRate',
  'unemploymentRate',
  'activeWarCount',
  'tempAnomalyC'
]

const STALE_THRESHOLD_MS = 60 * 60 * 1000

export default function TimeMachine() {
  const [signals, setSignals] = useState<CurrentSignals>(DEFAULT_SIGNALS)
  const [prediction, setPrediction] = useState<TimeMachinePrediction>(() => generatePrediction(DEFAULT_SIGNALS))
  const [runToken, setRunToken] = useState<number>(Date.now())
  const [loading, setLoading] = useState(false)
  const [dataStatus, setDataStatus] = useState<StatusMap>(() => buildDefaultStatus())
  const [dataTimestamps, setDataTimestamps] = useState<TimestampMap>({})
  const [narrative, setNarrative] = useState<string>('')
  const [narrativeError, setNarrativeError] = useState<string>('')

  const confidenceStyle = useMemo(
    () => ({ width: `${prediction.confidenceScore}%` }),
    [prediction.confidenceScore]
  )

  const onRun = () => {
    const result = generatePrediction(signals)
    setPrediction(result)
    setRunToken(Date.now())
    setNarrativeError('')
    try {
      const text = generateNarrative(signals, result)
      setNarrative(text)
    } catch (error) {
      setNarrativeError((error as Error).message || 'Failed to generate briefing')
    }
  }

  const topMatch = prediction.topAnalogies[0]
  const topScore = topMatch ? topMatch.analogyScore * 100 : 0
  const topScoreColor = topScore > 70 ? '#1D9E75' : topScore >= 40 ? '#BA7517' : '#E24B4A'

  const resolveStatus = (field: keyof CurrentSignals): DataStatus => {
    const status = dataStatus[field]
    if (status !== 'live') return status
    const fetchedAt = dataTimestamps[field]
    if (!fetchedAt) return 'stale'
    return Date.now() - fetchedAt > STALE_THRESHOLD_MS ? 'stale' : 'live'
  }

  const fetchSignals = async () => {
    setLoading(true)
    try {
      const liveData = await fetchLiveSignals()
      const now = Date.now()

      setSignals((prev) => ({
        ...prev,
        ...liveData
      }))

      setDataStatus((prev) => {
        const next = { ...prev }
        liveFields.forEach((field) => {
          if (liveData[field] !== undefined) {
            next[field] = 'live'
          }
        })
        return next
      })

      setDataTimestamps((prev) => {
        const next = { ...prev }
        liveFields.forEach((field) => {
          if (liveData[field] !== undefined) {
            next[field] = now
          }
        })
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSignals()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Signal Input Panel</div>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200"
            onClick={fetchSignals}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh live data'}
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {inputFields.map((field) => {
            const status = resolveStatus(field.key)
            const statusStyle = statusStyles[status]
            return (
              <label key={field.key} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{field.label}</span>
                  {field.suffix && <span className="text-slate-500">{field.suffix}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusStyle.color }} />
                    {statusStyle.label}
                    {field.source ? `— ${field.source}` : ''}
                  </span>
                  {loading && liveFields.includes(field.key) && (
                    <span className="text-xs text-slate-500">Loading live data...</span>
                  )}
                </div>
                <input
                  type="number"
                  value={signals[field.key]}
                  onChange={(event) =>
                    setSignals((prev) => ({
                      ...prev,
                      [field.key]: Number(event.target.value)
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                />
                {field.key === 'techLayoffs12mo' && (
                  <div className="mt-2 text-xs text-slate-500">
                    Layoffs.fyi has no public API — using manual override.
                  </div>
                )}
              </label>
            )
          })}
        </div>
        <button
          className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950"
          onClick={onRun}
        >
          Run Prediction
        </button>
      </section>

      <div key={runToken} className="space-y-6 animate-fade-in">
        <section className="grid gap-4 md:grid-cols-3">
          {prediction.topAnalogies.map((pattern) => (
            <div
              key={pattern.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow"
            >
              <div className="text-sm font-semibold text-white">{pattern.name}</div>
              <div className="mt-1 text-xs text-slate-400">{pattern.period}</div>
              <div className="mt-3 text-xs text-slate-300">
                Match: {(pattern.analogyScore * 100).toFixed(1)}%
              </div>
              <div className="mt-3 text-xs text-slate-400">{pattern.keyLesson}</div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm font-semibold text-white">Most Likely Path</div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-4xl font-semibold" style={{ color: topScoreColor }}>
              {topScore.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400">Top analogy match score</div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {['at6months', 'at1year', 'at3years', 'at5years'].map((key) => (
              <div key={key} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {key.replace('at', '').replace('months', ' months').replace('year', ' year')}
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {prediction.scenarios.mostLikely[key as keyof typeof prediction.scenarios.mostLikely]}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            GDP Next Year: {prediction.scenarios.mostLikely.gdpGrowthNextYear}% | Oil Next Year: $
            {prediction.scenarios.mostLikely.oilPriceNextYear} | Conflict:{' '}
            {prediction.scenarios.mostLikely.conflictTrend}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {(['optimistic', 'mostLikely', 'pessimistic'] as const).map((scenarioKey) => {
            const scenario = prediction.scenarios[scenarioKey]
            return (
              <div
                key={scenarioKey}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {scenarioKey === 'mostLikely' ? 'Most Likely' : scenarioKey}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {(scenario.probability * 100).toFixed(0)}% probability
                </div>
                <div className="mt-2 text-xs text-slate-300">GDP next year: {scenario.gdpGrowthNextYear}%</div>
                <div className="text-xs text-slate-300">Oil next year: ${scenario.oilPriceNextYear}</div>
                <div className="text-xs text-slate-300">Conflict: {scenario.conflictTrend}</div>
                <div className="mt-3 text-sm text-slate-200">{scenario.headline}</div>
                <div className="mt-3 text-xs text-slate-400">{scenario.historicalPrecedent}</div>
              </div>
            )
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
            <div className="text-sm font-semibold text-white">Key Risks</div>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {prediction.keyRisks.length === 0 && <li>No major risks triggered.</li>}
              {prediction.keyRisks.map((risk, index) => (
                <li key={`${risk.label}-${index}`} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: severityColors[risk.severity] }}
                  />
                  <span>{risk.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
            <div className="text-sm font-semibold text-white">Key Opportunities</div>
            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              {prediction.keyOpportunities.length === 0 && <li>No major opportunities detected.</li>}
              {prediction.keyOpportunities.map((opp, index) => (
                <li key={`${opp.label}-${index}`} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: severityColors[opp.severity] }}
                  />
                  <span>{opp.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-white">Confidence</span>
            <span className="text-slate-300">{prediction.confidenceScore}%</span>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-white/10">
            <div className="h-3 rounded-full bg-white" style={confidenceStyle} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Analyst Briefing</span>
            <span className="text-xs text-slate-500">Generated locally — no API</span>
          </div>
          {narrativeError && (
            <div className="mt-4 text-sm text-red-300">{narrativeError}</div>
          )}
          {narrative && !narrativeError ? (
            <div className="space-y-4">
              {narrative.split('\n\n').map((para, index) => (
                <p key={index} className="text-sm leading-relaxed text-slate-300">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            !narrativeError && (
              <p className="text-xs text-slate-500">Run prediction to generate briefing.</p>
            )
          )}
        </section>
      </div>
    </div>
  )
}
