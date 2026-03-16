import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import {
  CurrentSignals,
  ContextEvent,
  DEFAULT_SIGNALS,
  generatePrediction,
  TimeMachinePrediction,
  PATTERN_LIBRARY,
  findAnalogies
} from '../predictor/timeMachine'
import { clearLiveCaches, fetchLiveSignals, generateNarrative } from '../predictor/liveSignals'
import { runSensitivityAnalysis, SensitivityResult } from '../predictor/sensitivity'
import { fetchLocalEventkgEvents } from '../worlds/localEventkg'
import { loadCalibration } from '../predictor/calibration'
import { runBacktest, BacktestSummary, HistoricalRow } from '../predictor/backtest'
import { runQuantCore, QuantCoreResult, ShockCalibration } from '../predictor/quantCore'
import { computeShockCalibration } from '../predictor/shockCalibration'

type InputField = { key: keyof CurrentSignals; label: string; suffix?: string; source?: string }

const inputSections: Array<{ title: string; fields: InputField[] }> = [
  {
    title: 'Core Signals',
    fields: [
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
      { key: 'tempAnomalyC', label: 'Temp Anomaly', suffix: '°C', source: 'NASA GISS (manual)' }
    ]
  },
  {
    title: 'Advanced Economic Indicators',
    fields: [
      { key: 'publicDebtGdpRatio', label: 'Public Debt/GDP', suffix: '%' },
      { key: 'creditGrowthRate', label: 'Credit Growth', suffix: '% YoY' },
      { key: 'externalDebtGdpRatio', label: 'External Debt/GDP', suffix: '%' },
      { key: 'robotsPer1000Workers', label: 'Robots per 1k', suffix: 'per 1k' },
      { key: 'laborShareOfIncome', label: 'Labor Share', suffix: '% of GDP' },
      { key: 'militarySpendingGrowth', label: 'Military Spend Growth', suffix: '% YoY' },
      { key: 'alliancePolarisation', label: 'Alliance Polarisation', suffix: '0-10' },
      { key: 'globalDebtToGdp', label: 'Global Debt/GDP', suffix: '%' },
      { key: 'reserveCurrencyTrend', label: 'Reserve Currency Trend', suffix: '-10 to +10' },
      { key: 'giniCoefficient', label: 'Gini Coefficient', suffix: '0-100' }
    ]
  },
  {
    title: 'Bloc Macro Inputs',
    fields: [
      { key: 'usGDPGrowth', label: 'US GDP Growth', suffix: '% YoY', source: 'World Bank' },
      { key: 'euGDPGrowth', label: 'EU GDP Growth', suffix: '% YoY', source: 'World Bank' },
      { key: 'chinaGDPGrowth', label: 'China GDP Growth', suffix: '% YoY', source: 'World Bank' },
      { key: 'usInflation', label: 'US Inflation', suffix: '%', source: 'FRED' },
      { key: 'euInflation', label: 'EU Inflation', suffix: '%', source: 'World Bank' },
      { key: 'chinaInflation', label: 'China Inflation', suffix: '%', source: 'World Bank' },
      { key: 'usUnemployment', label: 'US Unemployment', suffix: '%', source: 'FRED' },
      { key: 'euUnemployment', label: 'EU Unemployment', suffix: '%', source: 'World Bank' },
      { key: 'chinaUnemployment', label: 'China Unemployment', suffix: '%', source: 'World Bank' },
      { key: 'usDebtGdpRatio', label: 'US Debt/GDP', suffix: '%' },
      { key: 'euDebtGdpRatio', label: 'EU Debt/GDP', suffix: '%' },
      { key: 'chinaDebtGdpRatio', label: 'China Debt/GDP', suffix: '%' }
    ]
  },
  {
    title: 'Market Signals',
    fields: [
      { key: 'yieldCurve10y2y', label: 'Yield Curve (10y-2y)', suffix: '%', source: 'FRED' },
      { key: 'creditSpreadBaaAaa', label: 'Credit Spread (BAA-AAA)', suffix: '%', source: 'FRED' },
      { key: 'policyRate', label: 'Policy Rate', suffix: '%', source: 'FRED' }
    ]
  }
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
  tempAnomalyC: 'manual',
  publicDebtGdpRatio: 'manual',
  creditGrowthRate: 'manual',
  externalDebtGdpRatio: 'manual',
  robotsPer1000Workers: 'manual',
  laborShareOfIncome: 'manual',
  militarySpendingGrowth: 'manual',
  alliancePolarisation: 'manual',
  globalDebtToGdp: 'manual',
  reserveCurrencyTrend: 'manual',
  giniCoefficient: 'manual',
  usGDPGrowth: 'manual',
  euGDPGrowth: 'manual',
  chinaGDPGrowth: 'manual',
  usInflation: 'manual',
  euInflation: 'manual',
  chinaInflation: 'manual',
  usUnemployment: 'manual',
  euUnemployment: 'manual',
  chinaUnemployment: 'manual',
  usDebtGdpRatio: 'manual',
  euDebtGdpRatio: 'manual',
  chinaDebtGdpRatio: 'manual',
  aiAdoptionRate: 'manual',
  yieldCurve10y2y: 'manual',
  creditSpreadBaaAaa: 'manual',
  policyRate: 'manual'
})

const liveFields: Array<keyof CurrentSignals> = [
  'oilPrice',
  'globalGDPGrowth',
  'inflationRate',
  'unemploymentRate',
  'activeWarCount',
  'usGDPGrowth',
  'euGDPGrowth',
  'chinaGDPGrowth',
  'usInflation',
  'euInflation',
  'chinaInflation',
  'usUnemployment',
  'euUnemployment',
  'chinaUnemployment',
  'yieldCurve10y2y',
  'creditSpreadBaaAaa',
  'policyRate'
]

const STALE_THRESHOLD_MS = 60 * 60 * 1000

export default function TimeMachine() {
  const [signals, setSignals] = useState<CurrentSignals>(DEFAULT_SIGNALS)
  const [prediction, setPrediction] = useState<TimeMachinePrediction>(() =>
    generatePrediction(DEFAULT_SIGNALS)
  )
  const [runToken, setRunToken] = useState<number>(Date.now())
  const [loading, setLoading] = useState(false)
  const [dataStatus, setDataStatus] = useState<StatusMap>(() => buildDefaultStatus())
  const [dataTimestamps, setDataTimestamps] = useState<TimestampMap>({})
  const [narrative, setNarrative] = useState<string>('')
  const [narrativeError, setNarrativeError] = useState<string>('')
  const [contextEvents, setContextEvents] = useState<ContextEvent[]>([])
  const [contextLoading, setContextLoading] = useState(false)
  const [contextError, setContextError] = useState('')
  const [sensitivity, setSensitivity] = useState<SensitivityResult[]>([])
  const [signalsFromUrl, setSignalsFromUrl] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const [calibrationStatus, setCalibrationStatus] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [backtest, setBacktest] = useState<BacktestSummary | null>(null)
  const [shockCalibration, setShockCalibration] = useState<ShockCalibration | null>(null)
  const [quantCore, setQuantCore] = useState<QuantCoreResult>(() => runQuantCore(DEFAULT_SIGNALS))
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [lastLiveSuccessAt, setLastLiveSuccessAt] = useState<number | null>(null)
  const [liveError, setLiveError] = useState('')

  const confidenceStyle = useMemo(
    () => ({ width: `${prediction.confidenceScore}%` }),
    [prediction.confidenceScore]
  )

  const onRun = async () => {
    const liveData = await fetchSignals({ force: true })
    const merged = { ...signals, ...liveData }
    setSignals(merged)

    const result = generatePrediction(merged, contextEvents)
    setPrediction(result)
    setRunToken(Date.now())
    setNarrativeError('')
    try {
      const text = generateNarrative(merged, result)
      setNarrative(text)
      setSensitivity(runSensitivityAnalysis(merged))
      setQuantCore(runQuantCore(merged, 8, 200, shockCalibration ?? undefined))
    } catch (error) {
      setNarrativeError((error as Error).message || 'Failed to generate briefing')
    }
  }

  const encodeSignalsToUrl = (payload: CurrentSignals) => {
    const json = JSON.stringify(payload)
    const encoded = btoa(json)
    const url = new URL(window.location.href)
    url.searchParams.set('signals', encoded)
    return url.toString()
  }

  const decodeSignalsFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('signals')
    if (!encoded) return null
    try {
      return JSON.parse(atob(encoded)) as CurrentSignals
    } catch {
      return null
    }
  }

  const topMatch = prediction.topAnalogies[0]
  const topScore = topMatch ? topMatch.analogyScore * 100 : 0
  const topScoreColor = topScore > 70 ? '#1D9E75' : topScore >= 40 ? '#BA7517' : '#E24B4A'
  const allAnalogies = findAnalogies(
    signals,
    PATTERN_LIBRARY.length,
    contextEvents,
    prediction.modelOutputs
  )

  const resolveStatus = (field: keyof CurrentSignals): DataStatus => {
    const status = dataStatus[field]
    if (status !== 'live') return status
    const fetchedAt = dataTimestamps[field]
    if (!fetchedAt) return 'stale'
    return Date.now() - fetchedAt > STALE_THRESHOLD_MS ? 'stale' : 'live'
  }

  const fetchSignals = async (options?: { force?: boolean }) => {
    setLoading(true)
    try {
      const liveData = await fetchLiveSignals(options)
      const now = Date.now()
      const liveKeys = Object.keys(liveData)

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
      if (liveKeys.length > 0) {
        setLastLiveSuccessAt(now)
        setLiveError('')
      } else {
        setLiveError('Live feeds unavailable. Using manual defaults.')
      }
      setLastUpdated(now)
      return liveData
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fromUrl = decodeSignalsFromUrl()
    if (fromUrl) {
      setSignals(fromUrl)
      setSignalsFromUrl(true)
      const result = generatePrediction(fromUrl, contextEvents)
      setPrediction(result)
      setNarrative(generateNarrative(fromUrl, result))
      setSensitivity(runSensitivityAnalysis(fromUrl))
      setQuantCore(runQuantCore(fromUrl, 8, 200, shockCalibration ?? undefined))
    }
    fetchSignals()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchSignals()
    }, 10 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const initCalibration = async () => {
      const coeffs = await loadCalibration()
      setCalibrationStatus(coeffs ? 'ready' : 'missing')
    }
    initCalibration()
  }, [])

  useEffect(() => {
    if (shockCalibration) {
      setQuantCore(runQuantCore(signals, 8, 200, shockCalibration))
    }
  }, [shockCalibration])

  useEffect(() => {
    const loadBacktest = async () => {
      try {
        const response = await fetch(`/data/historical_worldbank.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as HistoricalRow[]
        const summary = runBacktest(data, DEFAULT_SIGNALS, 12)
        setBacktest(summary)
        setShockCalibration(computeShockCalibration(data))
      } catch {
        // ignore
      }
    }
    loadBacktest()
  }, [])

  const getSignalWarnings = (values: CurrentSignals) => {
    const warnings: string[] = []
    if (values.tempAnomalyC > 4) warnings.push(`Temp anomaly ${values.tempAnomalyC}°C is unrealistic — cap at 4.0`)
    if (values.globalGDPGrowth < -10) warnings.push(`GDP growth ${values.globalGDPGrowth}% is extreme — check input`)
    if (values.inflationRate < 0.5 && values.inflationRate > 0) {
      warnings.push(`Inflation ${values.inflationRate}% looks like MoM not YoY — expected 2-8%`)
    }
    if (values.oilPrice < 20) warnings.push(`Oil $${values.oilPrice} is unusually low — check feed`)
    return warnings
  }

  const buildPlainSummary = () => {
    const top = prediction.topAnalogies[0]
    const gdp = prediction.scenarios.mostLikely.gdpGrowthNextYear
    const oil = prediction.scenarios.mostLikely.oilPriceNextYear
    const conflict = prediction.scenarios.mostLikely.conflictTrend
    const regime =
      quantCore.regimes.crisis > 30
        ? 'elevated stress'
        : quantCore.regimes.stressed > 35
          ? 'fragile'
          : 'steady'

    const nowLine = `Right now the model reads the world as ${regime}, with ${signals.activeWarCount} active conflict zones and oil around $${signals.oilPrice}.`
    const nearLine = `Over the next year it expects GDP growth around ${gdp}%, oil near $${oil}, and conflict ${conflict}.`
    const analogyLine = top
      ? `The closest historical comparison is ${top.name} (${top.period}) — meaning the main risk is ${top.keyLesson.toLowerCase()}`
      : 'No strong historical analogy stands out.'

    const watchItems = [
      signals.oilPrice > 100 ? 'Oil price staying above $100' : 'Oil price staying below $100',
      signals.nuclearThreatLevel > 6 ? 'Nuclear escalation risk' : 'De-escalation in major conflicts',
      signals.publicDebtGdpRatio > 100 ? 'High public debt and credit stress' : 'Debt stability'
    ]

    return { nowLine, nearLine, analogyLine, watchItems }
  }

  const plainSummary = buildPlainSummary()

  useEffect(() => {
    const loadContext = async () => {
      setContextLoading(true)
      setContextError('')
      try {
        const localEvents = await fetchLocalEventkgEvents()
        const mappedLocal = localEvents.map((event) => ({
          label: event.label,
          description: event.description,
          date: event.date
        }))
        setContextEvents(mappedLocal)
        if (mappedLocal.length > 0) {
          setPrediction(generatePrediction(signals, mappedLocal))
        }
      } catch (error) {
        setContextError((error as Error).message || 'Failed to load local event context')
      } finally {
        setContextLoading(false)
      }
    }
    loadContext()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">Signal Input Panel</div>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200"
            onClick={() => fetchSignals()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh live data'}
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          {contextLoading && 'Loading local event context...'}
          {!contextLoading && contextError && `Local context unavailable: ${contextError}`}
          {!contextLoading && !contextError && contextEvents.length > 0 && 'Local context loaded.'}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Calibration: {calibrationStatus === 'ready' ? 'loaded' : 'missing'}</span>
          {lastUpdated && (
            <span>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          {lastLiveSuccessAt && (
            <span>
              Live data ok: {new Date(lastLiveSuccessAt).toLocaleTimeString()}
            </span>
          )}
          <button
            className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200"
            onClick={() => {
              clearLiveCaches()
              fetchSignals({ force: true })
            }}
          >
            Force refresh (ignore cache)
          </button>
        </div>
        {liveError && (
          <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            {liveError} Check `https://worldwe-livein.vercel.app/api/health`.
          </div>
        )}
        <div className="mt-4 space-y-6">
          {inputSections.map((section) => (
            <div key={section.title}>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {section.fields.map((field) => {
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
                      {field.key === 'tempAnomalyC' && (
                        <div className="mt-2 text-xs text-slate-500">
                          NASA GISS shows +1.2°C as of 2026. Update manually from:
                          <span className="ml-1 text-slate-400">climate.nasa.gov/vital-signs/global-temperature</span>
                        </div>
                      )}
                      {field.key === 'techLayoffs12mo' && (
                        <div className="mt-2 text-xs text-slate-500">
                          Layoffs.fyi has no public API — using manual override.
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {getSignalWarnings(signals).length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3">
            <div className="text-xs font-semibold text-amber-300">Signal warnings — review before running:</div>
            {getSignalWarnings(signals).map((warning, index) => (
              <div key={index} className="text-xs text-amber-400/80">
                ⚠ {warning}
              </div>
            ))}
          </div>
        )}
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-white">All Historical Anchors</div>
            <div className="text-xs text-slate-400">
              {allAnalogies.length} analogies scored
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {allAnalogies.map((pattern) => (
              <div
                key={`all-${pattern.id}`}
                className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300"
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span>{pattern.period}</span>
                  <span>{(pattern.analogyScore * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{pattern.name}</div>
                <div className="mt-1 text-xs text-slate-400">{pattern.keyLesson}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {(() => {
            const models = prediction.modelOutputs
            const rrRisk = Math.round(models.reinhartRogoff.riskScore * 100)
            const rrPenalty = Number(models.reinhartRogoff.gdpPenalty.toFixed(2))
            const rrStatus = rrRisk > 60 ? 'red' : rrRisk > 35 ? 'amber' : 'green'

            const acemogluRisk = Math.round(models.acemoglu.displacementRisk * 100)
            const laborShareDelta = Number(models.acemoglu.laborShareDelta.toFixed(2))
            const acemogluStatus = acemogluRisk > 60 ? 'red' : acemogluRisk > 35 ? 'amber' : 'green'

            const nordhausDrag = Number(models.nordhaus.toFixed(2))
            const nordhausStatus = nordhausDrag > 2.0 ? 'red' : nordhausDrag > 1.0 ? 'amber' : 'green'

            const warProb = Math.round(models.richardson.warProbability12mo * 100)
            const armsStatus = warProb > 40 ? 'red' : warProb > 20 ? 'amber' : 'green'

            const jPhase = models.brynjolfsson.currentPhase
            const lagYears = Math.round(models.brynjolfsson.lagYearsRemaining)
            const jStatus = jPhase === 'investment' ? 'red' : jPhase === 'reorganisation' ? 'amber' : 'green'

            const dalioPhase = models.dalio.cyclePhase
            const yearsToCrisis = Math.round(models.dalio.yearsToNextCrisis)
            const dalioStatus = ['crisis', 'deleveraging'].includes(dalioPhase) ? 'red' : dalioPhase === 'peak' ? 'amber' : 'green'

            const statusStyles = {
              red: 'border-red-400/40 bg-red-500/10 text-red-200',
              amber: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
              green: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
            } as const

            const cards = [
              {
                title: 'Reinhart–Rogoff',
                status: rrStatus,
                lines: [
                  `Debt crisis risk: ${rrRisk}%`,
                  `GDP penalty: ${rrPenalty}%`,
                  rrRisk > 60 ? 'Debt thresholds breached; crisis odds elevated.' : 'Debt drag present but not extreme.'
                ]
              },
              {
                title: 'Acemoglu–Restrepo',
                status: acemogluStatus,
                lines: [
                  `Labor share Δ: ${laborShareDelta}%`,
                  `Displacement risk: ${acemogluRisk}%`,
                  acemogluRisk > 60 ? 'Automation shock likely; wage pressure rising.' : 'Displacement manageable if productivity follows.'
                ]
              },
              {
                title: 'Nordhaus DICE',
                status: nordhausStatus,
                lines: [
                  `Climate drag: −${nordhausDrag}%/yr`,
                  `Temp anomaly: ${signals.tempAnomalyC}°C`,
                  nordhausDrag > 2 ? 'Climate damages now a macro headwind.' : 'Climate drag rising but still contained.'
                ]
              },
              {
                title: 'Richardson Arms',
                status: armsStatus,
                lines: [
                  `War prob (12mo): ${warProb}%`,
                  `Conflict accel: ${Number(models.richardson.conflictAcceleration.toFixed(2))}`,
                  warProb > 40 ? 'Arms spiral risk rising; escalation plausible.' : 'Arms dynamics elevated but not runaway.'
                ]
              },
              {
                title: 'Brynjolfsson J-Curve',
                status: jStatus,
                lines: [
                  `Phase: ${jPhase}`,
                  `Years to harvest: ${lagYears}`,
                  jPhase === 'harvest' ? 'Productivity upside now compounding.' : 'Reorg phase still suppressing measured gains.'
                ]
              },
              {
                title: 'Dalio Debt Cycle',
                status: dalioStatus,
                lines: [
                  `Phase: ${dalioPhase}`,
                  `Years to crisis: ${yearsToCrisis}`,
                  dalioPhase === 'crisis' ? 'Late-cycle stress likely to intensify.' : 'Cycle pressure building but not decisive.'
                ]
              }
            ]

            return cards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-4 shadow-glow ${statusStyles[card.status]}`}
              >
                <div className="text-sm font-semibold">{card.title}</div>
                <div className="mt-3 space-y-1 text-xs">
                  {card.lines.map((line, index) => (
                    <div key={`${card.title}-${index}`}>{line}</div>
                  ))}
                </div>
              </div>
            ))
          })()}
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm font-semibold text-white">Plain English Summary</div>
          <div className="mt-3 space-y-3 text-sm text-slate-300">
            <p>{plainSummary.nowLine}</p>
            <p>{plainSummary.nearLine}</p>
            <p>{plainSummary.analogyLine}</p>
          </div>
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">What to watch</div>
            <div className="mt-2 grid gap-2 md:grid-cols-3 text-xs text-slate-300">
              {plainSummary.watchItems.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-black/20 p-2">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="text-sm font-semibold text-white">Uncertainty Bands (P10 / P50 / P90)</div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-300">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">GDP Next Year</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {prediction.uncertainty.gdp.p10}% / {prediction.uncertainty.gdp.p50}% / {prediction.uncertainty.gdp.p90}%
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">Conflict Index</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {prediction.uncertainty.conflict.p10} / {prediction.uncertainty.conflict.p50} / {prediction.uncertainty.conflict.p90}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">Oil Price Next Year</div>
              <div className="mt-2 text-sm font-semibold text-white">
                ${prediction.uncertainty.oil.p10} / ${prediction.uncertainty.oil.p50} / $
                {prediction.uncertainty.oil.p90}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Quant Core (Quarterly)</div>
              <div className="mt-1 text-xs text-slate-400">
                Regime-weighted quarterly GDP distribution for global + blocs.
              </div>
            </div>
            <div className="text-xs text-slate-400">Monte Carlo: 200 sims</div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs text-slate-300">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">Calm</div>
              <div className="mt-2 text-sm font-semibold text-white">{quantCore.regimes.calm}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">Stressed</div>
              <div className="mt-2 text-sm font-semibold text-white">{quantCore.regimes.stressed}%</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-400">Crisis</div>
              <div className="mt-2 text-sm font-semibold text-white">{quantCore.regimes.crisis}%</div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[
              { title: 'Global', series: quantCore.global },
              { title: 'United States', series: quantCore.blocs.US },
              { title: 'Europe', series: quantCore.blocs.EU },
              { title: 'China', series: quantCore.blocs.China }
            ].map((bloc) => (
              <div key={bloc.title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold text-white">{bloc.title}</div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-slate-300">
                  <div className="text-slate-500">Q</div>
                  <div className="text-slate-500">P10</div>
                  <div className="text-slate-500">P50</div>
                  <div className="text-slate-500">P90</div>
                  {bloc.series.map((row) => (
                    <div key={`${bloc.title}-${row.quarter}`} className="contents">
                      <div className="text-slate-400">Q{row.quarter}</div>
                      <div>{row.gdp.p10}%</div>
                      <div>{row.gdp.p50}%</div>
                      <div>{row.gdp.p90}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Sensitivity Analysis</div>
              <div className="mt-1 text-xs text-slate-400">Top 10 signals ranked by impact.</div>
            </div>
            <button
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200"
              onClick={() => setSensitivity(runSensitivityAnalysis(signals))}
            >
              Recompute
            </button>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sensitivity.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.6)" />
                <YAxis dataKey="signalLabel" type="category" width={140} stroke="rgba(255,255,255,0.6)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 15, 20, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="overallSensitivity" radius={[6, 6, 6, 6]}>
                  {sensitivity.slice(0, 10).map((entry, index) => (
                    <Cell
                      key={`cell-${entry.signalKey}`}
                      fill={index < 3 ? '#E24B4A' : index < 6 ? '#BA7517' : '#94A3B8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {sensitivity.length > 0 && (
              <>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                  Most important signal: {sensitivity[0].signalLabel} — moving it ±20% changes GDP forecast by ±
                  {Math.abs(sensitivity[0].gdpSensitivity).toFixed(2)}%
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                  Least important: {sensitivity[Math.min(9, sensitivity.length - 1)].signalLabel} — minimal prediction
                  impact
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                  Watch list: {sensitivity.slice(0, 3).map((item) => item.signalLabel).join(', ')}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Historical Backtest</div>
              <div className="mt-1 text-xs text-slate-400">Compares predicted GDP to actual next-year GDP.</div>
            </div>
          </div>
          {backtest ? (
            <div className="mt-4 space-y-2 text-xs text-slate-300">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                Mean absolute error (last {backtest.results.length} years): {backtest.mae}%
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {backtest.results.map((row) => (
                  <div key={row.baseYear} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-slate-400">{row.baseYear} → {row.baseYear + 1}</div>
                    <div className="mt-1">
                      Predicted: {row.predictedNext.toFixed(2)}% | Actual: {row.actualNext.toFixed(2)}% | Error:{' '}
                      {row.error.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-xs text-slate-400">
              Backtest data not found. Run scripts/fetch_historical_data.mjs and scripts/build_calibration.mjs.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">Share this prediction</div>
            {signalsFromUrl && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
                Loaded from shared link
              </span>
            )}
          </div>
          <button
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200"
            onClick={async () => {
              const url = encodeSignalsToUrl(signals)
              await navigator.clipboard.writeText(url)
              setShareStatus('copied')
              setTimeout(() => setShareStatus('idle'), 2000)
            }}
          >
            {shareStatus === 'copied' ? 'Copied!' : 'Copy shareable link'}
          </button>
        </section>
      </div>
    </div>
  )
}
