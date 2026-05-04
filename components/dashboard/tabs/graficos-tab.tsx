'use client'

import { useMemo } from 'react'
import { formatCurrency, formatCompactCurrency, num, str, parseFechaExcel, TC } from '@/lib/sheets-service'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

// Chart colors
const COLORS = {
  ventas: '#3b82f6',
  ingresos: '#10b981',
  proyVentas: '#8b5cf6',
  proyIngr: '#f59e0b',
  acumReal: '#ef4444',
  acumProy: '#06b6d4'
}

interface GraficosTabProps {
  filtrado: Record<string, unknown>[]
  rawAB: Record<string, unknown>[]
  rawProy: Record<string, unknown>[]
  rawCron: Record<string, unknown>[]
  filteredProyecto: string
}

export function GraficosTab({ filtrado, rawAB, rawProy, rawCron, filteredProyecto: fp }: GraficosTabProps) {
  const chartData = useMemo(() => {
    // Build mes keys
    const all: string[] = []
    filtrado.forEach(r => {
      const m = num(r['MES DE VENTA']), y = num(r['AÑO DE VENTA'])
      if (m >= 1 && m <= 12 && y > 2000) all.push(`${y}-${String(m).padStart(2, '0')}`)
    })
    rawAB.forEach(r => {
      if (fp && str(r['PROYECTO']) !== fp) return
      const m = num(r['Mes']), y = num(r['Año'])
      if (m >= 1 && m <= 12 && y > 2000) all.push(`${y}-${String(m).padStart(2, '0')}`)
    })
    rawProy.forEach(r => {
      Object.keys(r).forEach(col => {
        const match = col.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
        if (match) {
          let m = parseInt(match[2]), y = parseInt(match[3])
          if (y < 100) y += 2000
          if (num(r[col]) > 0) all.push(`${y}-${String(m).padStart(2, '0')}`)
        }
      })
    })
    
    if (!all.length) return { monthly: [], kpis: { totalVR: 0, totalVP: 0, totalIR: 0, totalIP: 0, totalUVR: 0, totalUVP: 0 } }
    
    all.sort()
    const minKey = all[0]
    const now = new Date()
    const maxKey = `${now.getFullYear() + 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const keys: string[] = []
    let [cy, cm] = minKey.split('-').map(Number)
    const [ey, em] = maxKey.split('-').map(Number)
    while (cy < ey || (cy === ey && cm <= em)) {
      keys.push(`${cy}-${String(cm).padStart(2, '0')}`)
      cm++
      if (cm > 12) { cm = 1; cy++ }
    }

    // Calculate data per month
    const ventasRealesU: Record<string, number> = {}
    const ventasRealesS: Record<string, number> = {}
    const ingresosRealesS: Record<string, number> = {}
    const ventasProyU: Record<string, number> = {}
    const ventasProyS: Record<string, number> = {}
    const ingresosProyS: Record<string, number> = {}

    // Ventas reales
    filtrado.filter(r => str(r['SITUACION']) === 'VENDIDO').forEach(r => {
      const m = num(r['MES DE VENTA']), y = num(r['AÑO DE VENTA'])
      if (m >= 1 && m <= 12 && y > 2000) {
        const k = `${y}-${String(m).padStart(2, '0')}`
        ventasRealesU[k] = (ventasRealesU[k] || 0) + 1
        ventasRealesS[k] = (ventasRealesS[k] || 0) + num(r['VALOR S/'])
      }
    })

    // Ingresos reales
    rawAB.forEach(r => {
      if (fp && str(r['PROYECTO']) !== fp) return
      const m = num(r['Mes']), y = num(r['Año'])
      const monto = (num(r['INGRESO S/']) || 0) + (num(r['INGRESO US$']) || 0) * (num(r['TC']) || TC)
      if (m >= 1 && m <= 12 && y > 2000 && monto > 0) {
        const k = `${y}-${String(m).padStart(2, '0')}`
        ingresosRealesS[k] = (ingresosRealesS[k] || 0) + monto
      }
    })

    // Ventas proyectadas
    rawProy.forEach(r => {
      if (fp && str(r['PROYECTO'] || r['Proyecto']) !== fp) return
      if (str(r['Estatus']).toUpperCase() === 'VENDIDO') return
      const inicio = r['Inicio de Venta Proy.']
      let k: string | null = null
      if (typeof inicio === 'string' && inicio.startsWith('Date(')) {
        const p = inicio.substring(5, inicio.length - 1).split(',')
        k = `${p[0]}-${String(parseInt(p[1]) + 1).padStart(2, '0')}`
      } else if (inicio) {
        const d = new Date(String(inicio))
        if (!isNaN(d.getTime())) k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      }
      if (k) {
        ventasProyU[k] = (ventasProyU[k] || 0) + 1
        ventasProyS[k] = (ventasProyS[k] || 0) + num(r['Precio Real'])
      }
    })

    // Ingresos proyectados
    rawProy.forEach(r => {
      if (fp && str(r['PROYECTO'] || r['Proyecto']) !== fp) return
      if (str(r['Estatus']).toUpperCase() === 'VENDIDO') return
      Object.keys(r).forEach(col => {
        const match = col.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
        if (match) {
          let m = parseInt(match[2]), y = parseInt(match[3])
          if (y < 100) y += 2000
          const monto = num(r[col])
          if (monto > 0) {
            const k = `${y}-${String(m).padStart(2, '0')}`
            ingresosProyS[k] = (ingresosProyS[k] || 0) + monto
          }
        }
      })
    })

    // Cuotas pendientes de vendidos
    rawCron.forEach(r => {
      if (fp && str(r['PROYECTO'] || r['Proyecto']) !== fp) return
      if (str(r['ESTADO VENTA']) !== 'VENDIDO') return
      if (str(r['ESTADO']) !== 'Por Pagar') return
      const fecha = parseFechaExcel(r['Fecha Cuota'])
      if (fecha) {
        const k = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
        ingresosProyS[k] = (ingresosProyS[k] || 0) + num(r['Monto Cuota'])
      }
    })

    // Filter active keys
    const activeKeys = keys.filter(k =>
      ventasRealesU[k] || ventasRealesS[k] || ingresosRealesS[k] ||
      ventasProyU[k] || ventasProyS[k] || ingresosProyS[k]
    )

    // Current month for mixed projection logic
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Calculate accumulated values
    // For charts 3 & 4: separate Real vs Proy
    let acVRealU = 0, acVRealS = 0, acVProyU = 0, acVProyS = 0, acIRealS = 0, acIProyS = 0
    // For chart 2: mixed logic (pasado=real, actual=real+proy, futuro=proy)
    let acVentaMixta = 0, acIngresoMixto = 0

    // Build monthly data with accumulated values
    const monthly = activeKeys.map(k => {
      const [y, m] = k.split('-')
      
      // Accumulate separate values for charts 3 & 4
      acVRealU += ventasRealesU[k] || 0
      acVProyU += ventasProyU[k] || 0
      acVRealS += ventasRealesS[k] || 0
      acVProyS += ventasProyS[k] || 0
      acIRealS += ingresosRealesS[k] || 0
      acIProyS += ingresosProyS[k] || 0

      // Chart 2 mixed logic: pasado=real, actual=real+proy, futuro=proy
      const esPasado = k < mesActual
      const esActual = k === mesActual
      // esFuturo = k > mesActual (implicit)

      if (esPasado) {
        // Solo real
        acVentaMixta += ventasRealesS[k] || 0
        acIngresoMixto += ingresosRealesS[k] || 0
      } else if (esActual) {
        // Real + proyectado combinados
        acVentaMixta += (ventasRealesS[k] || 0) + (ventasProyS[k] || 0)
        acIngresoMixto += (ingresosRealesS[k] || 0) + (ingresosProyS[k] || 0)
      } else {
        // Solo proyectado (futuro)
        acVentaMixta += ventasProyS[k] || 0
        acIngresoMixto += ingresosProyS[k] || 0
      }
      
      return {
        name: `${MESES[parseInt(m) - 1]} ${y.slice(-2)}`,
        key: k,
        tipo: esPasado ? 'real' : esActual ? 'real+proy' : 'proy',
        // Monthly values
        ventasReales: Math.round(ventasRealesS[k] || 0),
        ingresosReales: Math.round(ingresosRealesS[k] || 0),
        ventasProy: Math.round(ventasProyS[k] || 0),
        ingresosProy: Math.round(ingresosProyS[k] || 0),
        // Accumulated values for charts 3 & 4 (separate)
        acumVentasReales: Math.round(acVRealS),
        acumVentasProy: Math.round(acVProyS),
        acumIngresosReales: Math.round(acIRealS),
        acumIngresosProy: Math.round(acIProyS),
        acumUnidReales: acVRealU,
        acumUnidProy: acVProyU,
        // Accumulated values for chart 2 (mixed: real+proy logic)
        acumVentasMixta: Math.round(acVentaMixta),
        acumIngresosMixto: Math.round(acIngresoMixto)
      }
    })

    // KPIs
    const totalVR = Object.values(ventasRealesS).reduce((a, b) => a + b, 0)
    const totalVP = Object.values(ventasProyS).reduce((a, b) => a + b, 0)
    const totalIR = Object.values(ingresosRealesS).reduce((a, b) => a + b, 0)
    const totalIP = Object.values(ingresosProyS).reduce((a, b) => a + b, 0)
    const totalUVR = Object.values(ventasRealesU).reduce((a, b) => a + b, 0)
    const totalUVP = Object.values(ventasProyU).reduce((a, b) => a + b, 0)

    return { monthly, kpis: { totalVR, totalVP, totalIR, totalIP, totalUVR, totalUVP } }
  }, [filtrado, rawAB, rawProy, rawCron, fp])

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload) return null
    return (
      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-xl">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === 'number' && entry.value > 100 
                ? formatCurrency(entry.value) 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (!chartData.monthly.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Sin datos de gráficos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Indicadores de Ventas e Ingresos</h2>
        </div>
        
        <KPIGrid className="grid-cols-2 lg:grid-cols-3">
          <KPICard label="Unid. Vendidas (Real)" value={chartData.kpis.totalUVR} variant="success" />
          <KPICard label="Unid. Proy. (No Vendidas)" value={chartData.kpis.totalUVP} />
          <KPICard label="Ventas Reales S/" value={formatCurrency(chartData.kpis.totalVR)} variant="success" />
          <KPICard label="Ventas Proyectadas S/" value={formatCurrency(chartData.kpis.totalVP)} />
          <KPICard label="Ingresos Realizados S/" value={formatCurrency(chartData.kpis.totalIR)} variant="success" />
          <KPICard label="Ingresos Proyectados S/" value={formatCurrency(chartData.kpis.totalIP)} />
        </KPIGrid>
      </section>

      {/* Chart 1: Ventas vs Ingresos Reales */}
      <section>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Ventas Reales vs Ingresos Reales (S/)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Comparativa mensual de valores de venta e ingresos recibidos</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.ventas }} />
              <span className="text-xs text-muted-foreground">Ventas Reales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.ingresos }} />
              <span className="text-xs text-muted-foreground">Ingresos Reales</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ventasReales" name="Ventas Reales" fill={COLORS.ventas} radius={[4, 4, 0, 0]} />
                <Bar dataKey="ingresosReales" name="Ingresos Reales" fill={COLORS.ingresos} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Chart 2: Proyección Acumulada de Ventas e Ingresos */}
      <section>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Proyección Acumulada de Ventas e Ingresos (S/)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Evolución acumulada: pasado (real) - actual (real+proy) - futuro (proyectado)</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.proyVentas }} />
              <span className="text-xs text-muted-foreground">Ventas Acum.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.proyIngr }} />
              <span className="text-xs text-muted-foreground">Ingresos Acum.</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="acumVentasMixta" 
                  name="Ventas Acumuladas" 
                  stroke={COLORS.proyVentas} 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="acumIngresosMixto" 
                  name="Ingresos Acumulados" 
                  stroke={COLORS.proyIngr}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Chart 3: Ventas Acumuladas Proyectado vs Real (Unidades) */}
      <section>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Ventas Acumuladas: Proyectado vs Real (Unidades)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Comparativa de unidades vendidas acumuladas vs proyección</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.acumProy }} />
              <span className="text-xs text-muted-foreground">Proy. Acum.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.acumReal }} />
              <span className="text-xs text-muted-foreground">Real Acum.</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="acumUnidProy" 
                  name="Unidades Proyectadas" 
                  stroke={COLORS.acumProy} 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="acumUnidReales" 
                  name="Unidades Reales" 
                  stroke={COLORS.acumReal}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Chart 4: Ingresos Acumulados Proyectado vs Real (S/) */}
      <section>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Ingresos Acumulados: Proyectado vs Real (S/)</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Comparativa de ingresos acumulados vs proyección</p>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.acumProy }} />
              <span className="text-xs text-muted-foreground">Ingresos Proy. Acum.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: COLORS.acumReal }} />
              <span className="text-xs text-muted-foreground">Ingresos Real Acum.</span>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={{ stroke: '#27272a' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#71717a', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="acumIngresosProy" 
                  name="Ingresos Proyectados" 
                  stroke={COLORS.acumProy} 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="acumIngresosReales" 
                  name="Ingresos Reales" 
                  stroke={COLORS.acumReal}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}
