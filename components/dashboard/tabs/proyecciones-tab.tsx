'use client'

import { useMemo } from 'react'
import { formatCurrency, num, str, parseFechaExcel, TC } from '@/lib/sheets-service'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { TrendingUp, DollarSign, Building2, Calendar, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

interface ProyeccionesTabProps {
  filtrado: Record<string, unknown>[]
  rawAB: Record<string, unknown>[]
  rawProy: Record<string, unknown>[]
  rawCron: Record<string, unknown>[]
  filteredProyecto: string
}

export function ProyeccionesTab({ filtrado, rawAB, rawProy, rawCron, filteredProyecto: fp }: ProyeccionesTabProps) {
  const data = useMemo(() => {
    const proyecciones: Record<string, { vUnid: number; vMonto: number; iProy: number; iCuotas: number; iRealizado: number }> = {}
    
    const initMes = (k: string) => {
      if (!proyecciones[k]) {
        proyecciones[k] = { vUnid: 0, vMonto: 0, iProy: 0, iCuotas: 0, iRealizado: 0 }
      }
    }

    // Valor de vendidos
    const activosVendidos = filtrado.filter(r => str(r['SITUACION']) === 'VENDIDO')
    const valorVendidos = activosVendidos.reduce((a, r) => a + num(r['VALOR S/']), 0)

    // Ingresos realizados de Abonos
    rawAB.forEach(r => {
      const proy = str(r['PROYECTO'])
      if (fp && proy !== fp) return

      const valFechaFirma = r['FECHA FIRMA CV'] || r['FECHA FIRMA  CV'] || r['Fecha Firma CV']
      const fechaFirma = valFechaFirma ? parseFechaExcel(valFechaFirma) : null
      if (!fechaFirma || fechaFirma.getTime() < new Date(2024, 0, 1).getTime()) return

      let valFechaAbono: unknown = r['FECHA ABONO'] || r['FECHA  ABONO'] || r['Fecha Abono']
      if (!valFechaAbono && r['Mes'] && r['Año']) {
        const mes = num(r['Mes'])
        const anio = num(r['Año'])
        if (mes >= 1 && mes <= 12 && anio > 2000) {
          valFechaAbono = new Date(anio, mes - 1, 1)
        }
      }

      const fechaAbono = valFechaAbono ? parseFechaExcel(valFechaAbono) : null
      if (!fechaAbono) return

      const ingresoSol = num(r['INGRESO S/']) || num(r['Ingreso S/.'])
      const ingresoUsd = num(r['INGRESO US$']) || num(r['Ingreso US$'])
      const tipoCambio = num(r['TC']) || TC
      const monto = (ingresoSol || 0) + (ingresoUsd || 0) * tipoCambio

      if (monto > 0) {
        const mKey = `${fechaAbono.getFullYear()}-${String(fechaAbono.getMonth() + 1).padStart(2, '0')}`
        initMes(mKey)
        proyecciones[mKey].iRealizado += monto
      }
    })

    // Ventas proyectadas
    rawProy.forEach(r => {
      const nombreProy = str(r['Proyecto']) || str(r['PROYECTO'])
      if (fp && nombreProy !== fp) return
      
      const estatus = str(r['Estatus']).toUpperCase()
      if (estatus === 'VENDIDO') return

      const inicio = r['Inicio de Venta Proy.']
      let mesVenta: string | null = null

      if (typeof inicio === 'string' && inicio.startsWith('Date(')) {
        const p = inicio.substring(5, inicio.length - 1).split(',')
        mesVenta = `${p[0]}-${String(parseInt(p[1]) + 1).padStart(2, '0')}`
      } else if (inicio) {
        const d = new Date(String(inicio))
        if (!isNaN(d.getTime())) mesVenta = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      }

      if (mesVenta) {
        initMes(mesVenta)
        proyecciones[mesVenta].vUnid += 1
        proyecciones[mesVenta].vMonto += num(r['Precio Real'])
      }

      // Ingresos proyectados por fecha
      Object.keys(r).forEach(col => {
        const match = col.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
        if (match) {
          let m = parseInt(match[2])
          let y = parseInt(match[3])
          if (y < 100) y += 2000
          const mKey = `${y}-${String(m).padStart(2, '0')}`
          const monto = num(r[col])
          if (monto > 0) {
            initMes(mKey)
            proyecciones[mKey].iProy += monto
          }
        }
      })
    })

    // Cuotas de vendidos
    rawCron.forEach(r => {
      const nombreProy = str(r['PROYECTO']) || str(r['Proyecto'])
      if (fp && nombreProy !== fp) return

      const estadoVenta = str(r['ESTADO VENTA'])
      const estadoCuota = str(r['ESTADO'])

      if (estadoVenta === 'VENDIDO' && estadoCuota === 'Por Pagar') {
        const fecha = parseFechaExcel(r['Fecha Cuota'])
        if (fecha) {
          const mKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
          initMes(mKey)
          proyecciones[mKey].iCuotas += num(r['Monto Cuota'])
        }
      }
    })

    const keys = Object.keys(proyecciones).sort()
    
    let totalVU = 0, totalVM = 0, totalIP = 0, totalIC = 0, totalIR = 0
    const rows = keys.map(k => {
      const d = proyecciones[k]
      totalVU += d.vUnid
      totalVM += d.vMonto
      totalIP += d.iProy
      totalIC += d.iCuotas
      totalIR += d.iRealizado
      const totalIngreso = d.iProy + d.iCuotas

      const [y, m] = k.split('-')
      const nombreMes = MESES[parseInt(m) - 1] + ' ' + y

      return {
        key: k,
        nombreMes,
        ...d,
        totalIngreso
      }
    })

    const ventaTotalRevisado = valorVendidos + totalVM

    return {
      rows,
      totals: { totalVU, totalVM, totalIP, totalIC, totalIR, valorVendidos, ventaTotalRevisado },
      activosVendidos: activosVendidos.length
    }
  }, [filtrado, rawAB, rawProy, rawCron, fp])

  if (!data.rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <TrendingUp className="h-8 w-8 mb-2" />
        <p>No hay datos de proyecciones para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Card: Venta Total Revisado */}
      <section>
        <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-foreground">Venta Total Revisado</h2>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {formatCurrency(data.totals.ventaTotalRevisado)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500/20">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Vendidos (Activos)</div>
              <div className="text-lg font-semibold text-emerald-400">{formatCurrency(data.totals.valorVendidos)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Proyectados (No Vend)</div>
              <div className="text-lg font-semibold text-foreground">{formatCurrency(data.totals.totalVM)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Totales de Flujo y Proyección</h2>
        </div>

        <KPIGrid>
          <KPICard
            label="Total Unid. Vendidas"
            value={data.activosVendidos}
            variant="success"
            icon={<Building2 className="h-4 w-4" />}
          />
          <KPICard
            label="Valor Vendido"
            value={formatCurrency(data.totals.valorVendidos)}
            variant="success"
          />
          <KPICard
            label="Unid. Proyectadas"
            value={data.totals.totalVU}
            icon={<Building2 className="h-4 w-4" />}
          />
          <KPICard
            label="Ventas Proyectadas"
            value={formatCurrency(data.totals.totalVM)}
          />
        </KPIGrid>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <KPICard
            label="Ingresos Realizados"
            value={formatCurrency(data.totals.totalIR)}
            variant="success"
          />
          <KPICard
            label="Ingresos Proy. (No Vend)"
            value={formatCurrency(data.totals.totalIP)}
          />
          <KPICard
            label="Cuotas por Cobrar (Vend)"
            value={formatCurrency(data.totals.totalIC)}
            variant="success"
          />
        </div>

        {/* Total Flow */}
        <div className="mt-4 rounded-xl border border-border/50 bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Flujo de Ingreso Total Proyectado</span>
            <span className="text-xl font-bold text-blue-400">
              {formatCurrency(data.totals.totalIP + data.totals.totalIC)}
            </span>
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Detalle Mensual</h2>
        </div>

        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-500 text-white">
                  <th className="text-left px-4 py-3 font-semibold">Mes</th>
                  <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">Unid. a Vender</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Valor de Venta</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Ing. Realizados</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Ing. Proy.</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Cuotas</th>
                  <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">Flujo Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.rows.map((row, i) => (
                  <tr key={row.key} className={cn(i % 2 === 0 ? 'bg-card' : 'bg-card/50')}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.nombreMes}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{row.vUnid}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(row.vMonto)}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-semibold">{formatCurrency(row.iRealizado)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(row.iProy)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(row.iCuotas)}</td>
                    <td className="px-4 py-3 text-right text-blue-400 font-semibold">{formatCurrency(row.totalIngreso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
