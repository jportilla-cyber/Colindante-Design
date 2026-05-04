import { NextResponse } from 'next/server'

const SHEET_ID = '1VvhPWG1vByY0cm5NtDnuJZxbUGCSw730XUi5_8RWbgQ'

async function fetchSheet(sheetName: string): Promise<Record<string, unknown>[]> {
  const headersParam = sheetName === 'Proy_Flujo' ? '&headers=1' : ''
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}${headersParam}`
  
  try {
    const res = await fetch(url, { 
      next: { revalidate: 300 },
      headers: {
        'Accept': 'application/json',
      }
    })
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

export async function GET() {
  try {
    const [rawMC, rawAB, rawCron, rawProy] = await Promise.all([
      fetchSheet('Master_Clientes'),
      fetchSheet('Abonos'),
      fetchSheet('Cronograma'),
      fetchSheet('Proy_Flujo')
    ])

    return NextResponse.json({
      rawMC,
      rawAB,
      rawCron,
      rawProy
    })
  } catch (error) {
    console.error('Error fetching sheets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
