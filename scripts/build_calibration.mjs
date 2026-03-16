import fs from 'node:fs'
import path from 'node:path'

const inputPath = path.join(process.cwd(), 'public', 'data', 'historical_worldbank.json')
if (!fs.existsSync(inputPath)) {
  console.error('Missing historical_worldbank.json. Run scripts/fetch_historical_data.mjs first.')
  process.exit(1)
}

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

const hasNumber = (value) => typeof value === 'number' && !Number.isNaN(value)

const clean = rows.filter(
  (row) => hasNumber(row.gdpGrowth) && hasNumber(row.inflation) && hasNumber(row.unemployment)
)

if (clean.length < 10) {
  console.error('Not enough data to calibrate. Check historical_worldbank.json values.')
  process.exit(1)
}

const cleanWithOil = clean.filter((row) => hasNumber(row.oilAvg))

const mean = (arr) => arr.reduce((sum, val) => sum + val, 0) / arr.length

const inflationMean = mean(clean.map((r) => r.inflation))
const unemploymentMean = mean(clean.map((r) => r.unemployment))
const gdpMean = mean(clean.map((r) => r.gdpGrowth))
const oilMean = cleanWithOil.length ? mean(cleanWithOil.map((r) => r.oilAvg)) : 0

const toFeatures2 = (row) => [row.inflation - inflationMean, row.unemployment - unemploymentMean]
const toFeatures3 = (row) => [
  row.inflation - inflationMean,
  row.unemployment - unemploymentMean,
  ((row.oilAvg - oilMean) / oilMean) * 100
]

const transpose = (m) => m[0].map((_, i) => m.map((row) => row[i]))
const multiply = (a, b) =>
  a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, val, i) => sum + val * b[i][j], 0))
  )

const invert2 = (m) => {
  const [[a, b], [c, d]] = m
  const det = a * d - b * c
  if (det === 0) throw new Error('Singular matrix')
  const invDet = 1 / det
  return [
    [d * invDet, -b * invDet],
    [-c * invDet, a * invDet]
  ]
}

const invert3 = (m) => {
  const [a, b, c] = m[0]
  const [d, e, f] = m[1]
  const [g, h, i] = m[2]
  const A = e * i - f * h
  const B = -(d * i - f * g)
  const C = d * h - e * g
  const D = -(b * i - c * h)
  const E = a * i - c * g
  const F = -(a * h - b * g)
  const G = b * f - c * e
  const H = -(a * f - c * d)
  const I = a * e - b * d
  const det = a * A + b * B + c * C
  if (det === 0) throw new Error('Singular matrix')
  const invDet = 1 / det
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet]
  ]
}

let inflationCoef = 0
let unemploymentCoef = 0
let oilCoef = 0

if (cleanWithOil.length >= 15) {
  const y = cleanWithOil.map((row) => row.gdpGrowth)
  const yCol = y.map((value) => [value])
  const X = cleanWithOil.map(toFeatures3)
  const Xt = transpose(X)
  const XtX = multiply(Xt, X)
  const XtY = multiply(Xt, yCol)
  const inv = invert3(XtX)
  const coefMatrix = multiply(inv, XtY)
  ;[inflationCoef, unemploymentCoef, oilCoef] = coefMatrix.map((row) => Number(row[0].toFixed(4)))
} else {
  const y = clean.map((row) => row.gdpGrowth)
  const yCol = y.map((value) => [value])
  const X = clean.map(toFeatures2)
  const Xt = transpose(X)
  const XtX = multiply(Xt, X)
  const XtY = multiply(Xt, yCol)
  const inv = invert2(XtX)
  const coefMatrix = multiply(inv, XtY)
  ;[inflationCoef, unemploymentCoef] = coefMatrix.map((row) => Number(row[0].toFixed(4)))
  oilCoef = 0
}

const output = {
  inflationCoef,
  unemploymentCoef,
  oilCoef,
  meanInflation: Number(inflationMean.toFixed(4)),
  meanUnemployment: Number(unemploymentMean.toFixed(4)),
  meanGdp: Number(gdpMean.toFixed(4)),
  baselineOil: Number(oilMean.toFixed(2))
}

const outputPath = path.join(process.cwd(), 'public', 'data', 'calibration.json')
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
console.log(`Saved calibration to ${outputPath}`)
