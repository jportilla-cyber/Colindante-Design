// Google Sheets Service for Colindante Dashboard

const SHEET_ID = '1VvhPWG1vByY0cm5NtDnuJZxbUGCSw730XUi5_8RWbgQ'
const TC = 3.477 // Tipo de cambio default

export async function fetchSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  const headersParam = sheetName === 'Proy_Flujo' ? '&headers=1' : ''
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}${headersParam}`
  
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    const text = await res.text()
    
    if (!text.includes('google.visualization.Query.setResponse')) {
      console.error(`Sheet "${sheetName}" not found or not public`)
      return []
    }
    
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)
    if (!match) return []
    
    const json = JSON.parse(match[1])
    
    if (!json.table?.rows) return []
    
    const cols = json.table.cols.map((c: { label?: string }) => c.label || '')
    
    return json.table.rows.map((r: { c: Array<{ v?: unknown } | null> }) => {
      const obj: Record<string, unknown> = {}
      r.c.forEach((cell, i) => {
        obj[cols[i]] = cell ? (cell.v !== null && cell.v !== undefined ? cell.v : '') : ''
      })
      return obj
    })
  } catch (e) {
    console.error(`Error loading sheet "${sheetName}":`, e)
    return []
  }
}

export async function fetchAllData() {
  const [rawMC, rawAB, rawCron, rawProy] = await Promise.all([
    fetchSheet('Master_Clientes'),
    fetchSheet('Abonos'),
    fetchSheet('Cronograma'),
    fetchSheet('Proy_Flujo')
  ])
  
  return { rawMC, rawAB, rawCron, rawProy }
}

// Utility functions
export const num = (v: unknown): number => parseFloat(String(v).replace(/,/g, '')) || 0
export const str = (v: unknown): string => v ? String(v).trim() : ''

export function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e6) return 'S/ ' + (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return 'S/ ' + Math.round(n).toLocaleString('es-PE')
  return 'S/ ' + Math.round(n)
}

export function formatCompactCurrency(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k'
  return n.toString()
}

export function parseFechaExcel(val: unknown): Date | null {
  if (!val && val !== 0) return null
  const strVal = String(val).trim()
  
  if (strVal.includes('/') || strVal.includes('-') || strVal.startsWith('Date(')) {
    return parseFechaCron(strVal)
  }
  
  try {
    const numVal = Number(strVal)
    if (!isNaN(numVal) && numVal > 0 && numVal < 100000) {
      const excelEpoch = new Date(1899, 11, 30)
      const date = new Date(excelEpoch.getTime() + numVal * 24 * 60 * 60 * 1000)
      return !isNaN(date.getTime()) ? date : null
    }
    return parseFechaCron(strVal)
  } catch {
    return null
  }
}

export function parseFechaCron(s: string): Date | null {
  if (!s) return null
  const strVal = s.trim()
  
  if (strVal.startsWith('Date(')) {
    const p = strVal.substring(5, strVal.length - 1).split(',')
    const d = new Date(parseInt(p[0]), parseInt(p[1]), parseInt(p[2] || '1'))
    return isNaN(d.getTime()) ? null : d
  }
  
  if (strVal.includes('/')) {
    const partes = strVal.split('/')
    if (partes.length === 3) {
      let y = parseInt(partes[2])
      if (y < 100) y += 2000
      const d = new Date(y, parseInt(partes[1]) - 1, parseInt(partes[0]))
      return isNaN(d.getTime()) ? null : d
    }
  }
  
  try {
    const d = new Date(strVal.slice(0, 10))
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export { TC }
