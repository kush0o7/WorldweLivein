import fs from 'node:fs'
import path from 'node:path'

const WORLD_BANK_BASE = 'https://api.worldbank.org/v2'
const INDICATORS = {
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  inflation: 'FP.CPI.TOTL.ZG',
  unemployment: 'SL.UEM.TOTL.ZS'
}

const fetchIndicator = async (indicator) => {
  const url = `${WORLD_BANK_BASE}/country/WLD/indicator/${indicator}?format=json&per_page=200`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`World Bank fetch failed: ${response.status}`)
  }
  const data = await response.json()
  return data?.[1] ?? []
}

const fetchOilHistory = async () => {
  const response = await fetch('https://stooq.com/q/d/l/?s=cl.f&i=d')
  if (!response.ok) {
    throw new Error(`Stooq fetch failed: ${response.status}`)
  }
  const text = await response.text()
  const lines = text.trim().split('\n')
  const header = lines.shift()
  if (!header) return {}
  const oilByYear = {}
  const counts = {}
  lines.forEach((line) => {
    const [date, , , , close] = line.split(',')
    if (!date || !close) return
    const year = date.slice(0, 4)
    const value = Number(close)
    if (Number.isNaN(value)) return
    oilByYear[year] = (oilByYear[year] ?? 0) + value
    counts[year] = (counts[year] ?? 0) + 1
  })
  Object.keys(oilByYear).forEach((year) => {
    oilByYear[year] = Number((oilByYear[year] / counts[year]).toFixed(2))
  })
  return oilByYear
}

const main = async () => {
  const [gdp, inflation, unemployment, oilByYear] = await Promise.all([
    fetchIndicator(INDICATORS.gdpGrowth),
    fetchIndicator(INDICATORS.inflation),
    fetchIndicator(INDICATORS.unemployment),
    fetchOilHistory()
  ])

  const seriesByYear = {}

  const assign = (series, key) => {
    series.forEach((row) => {
      if (!row?.date) return
      const year = row.date
      if (!seriesByYear[year]) seriesByYear[year] = { year: Number(year) }
      seriesByYear[year][key] = row.value
    })
  }

  assign(gdp, 'gdpGrowth')
  assign(inflation, 'inflation')
  assign(unemployment, 'unemployment')

  Object.entries(oilByYear).forEach(([year, value]) => {
    if (!seriesByYear[year]) seriesByYear[year] = { year: Number(year) }
    seriesByYear[year].oilAvg = value
  })

  const rows = Object.values(seriesByYear)
    .filter((row) => row.year >= 1970)
    .sort((a, b) => a.year - b.year)

  const outputPath = path.join(process.cwd(), 'public', 'data', 'historical_worldbank.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2))
  console.log(`Saved ${rows.length} rows to ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
