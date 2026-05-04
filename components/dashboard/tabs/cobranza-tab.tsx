'use client'

import { useMemo, useState } from 'react'
import { formatCurrency, num, str } from '@/lib/sheets-service'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { KPICard } from '@/components/dashboard/kpi-card'
import { Wallet, CreditCard, User, Building2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CobranzaTabProps {
  filtrado: Record<string, unknown>[]
}

export function CobranzaTab({ filtrado }: CobranzaTabProps) {
  const [tipoCredFiltro, setTipoCredFiltro] = useState('')

  const activos = useMemo(() => 
    filtrado.filter(r =>
      ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string) &&
      str(r['Nombre del Cliente'])
    ), [filtrado]
  )

  const totales = useMemo(() => {
    const totalCobrado = activos.reduce((a, r) => a + num(r['Ingresos  S/.']), 0)
    const totalPorCobrar = activos.reduce((a, r) => a + num(r['Por Pagar  S/.']), 0)
    const totalValor = activos.reduce((a, r) => a + num(r['VALOR S/']), 0)
    const pctCobrado = totalValor > 0 ? Math.round((totalCobrado / totalValor) * 1000) / 10 : 0
    return { totalCobrado, totalPorCobrar, totalValor, pctCobrado }
  }, [activos])

  const tiposCredito = useMemo(() => {
    const tipos: Record<string, { cobrado: number; porCobrar: number; contar: number }> = {
      'Hipotecario': { cobrado: 0, porCobrar: 0, contar: 0 },
      'Directo': { cobrado: 0, porCobrar: 0, contar: 0 },
      'Contado': { cobrado: 0, porCobrar: 0, contar: 0 },
      'Hipotecario Postergado': { cobrado: 0, porCobrar: 0, contar: 0 },
      'Ahorro Casa': { cobrado: 0, porCobrar: 0, contar: 0 },
      'Por Confirmar': { cobrado: 0, porCobrar: 0, contar: 0 }
    }

    activos.forEach(r => {
      let tipo = str(r['Tipo de  Credito']).trim()
      if (!tipo || !tipos[tipo]) tipo = 'Por Confirmar'
      tipos[tipo].cobrado += num(r['Ingresos  S/.'])
      tipos[tipo].porCobrar += num(r['Por Pagar  S/.'])
      tipos[tipo].contar += 1
    })

    return Object.entries(tipos).filter(([, data]) => data.contar > 0)
  }, [activos])

  const clientesPorPagar = useMemo(() => {
    const clientes: Record<string, {
      nombre: string
      proyecto: string
      tipoCredito: string
      dptos: Set<string>
      ests: Set<string>
      deps: Set<string>
      cobrado: number
      porCobrar: number
    }> = {}

    activos.forEach(r => {
      const nombre = str(r['Nombre del Cliente'])
      let tipoCredito = str(r['Tipo de  Credito']).trim()
      if (!tipoCredito) tipoCredito = 'Por Confirmar'
      const key = nombre + '|' + tipoCredito

      if (!clientes[key]) {
        clientes[key] = {
          nombre,
          proyecto: str(r['PROYECTO']),
          tipoCredito,
          dptos: new Set(),
          ests: new Set(),
          deps: new Set(),
          cobrado: 0,
          porCobrar: 0
        }
      }
      if (str(r['DPTO'])) clientes[key].dptos.add(str(r['DPTO']))
      if (str(r['EST'])) clientes[key].ests.add(str(r['EST']))
      if (str(r['DEP'])) clientes[key].deps.add(str(r['DEP']))
      clientes[key].cobrado += num(r['Ingresos  S/.'])
      clientes[key].porCobrar += num(r['Por Pagar  S/.'])
    })

    return Object.values(clientes)
      .filter(c => c.porCobrar > 0 || c.ests.size > 0)
      .filter(c => tipoCredFiltro ? c.tipoCredito === tipoCredFiltro : true)
      .sort((a, b) => b.porCobrar - a.porCobrar)
  }, [activos, tipoCredFiltro])

  const tiposParaFiltrar = useMemo(() => {
    return [...new Set(activos.map(r => {
      let tipo = str(r['Tipo de  Credito']).trim()
      if (!tipo) tipo = 'Por Confirmar'
      return tipo
    }))].sort()
  }, [activos])

  return (
    <div className="space-y-8">
      {/* Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Resumen de Cobranza</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <KPICard
            label="Total Cobrado"
            value={formatCurrency(totales.totalCobrado)}
            variant="success"
            size="large"
          />
          <KPICard
            label="Total por Cobrar"
            value={formatCurrency(totales.totalPorCobrar)}
            variant="warning"
            size="large"
          />
        </div>

        <ProgressCard
          label="Progreso de Cobranza"
          value={totales.pctCobrado}
          variant="success"
        />
      </section>

      {/* Credit Types */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Por Tipo de Crédito</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiposCredito.map(([tipo, datos]) => {
            const total = datos.cobrado + datos.porCobrar
            const pct = total > 0 ? Math.round((datos.cobrado / total) * 1000) / 10 : 0

            return (
              <div key={tipo} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{tipo}</h3>
                    <p className="text-xs text-muted-foreground">{datos.contar} cliente{datos.contar !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-400">{pct}%</span>
                </div>
                
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.max(pct, 0.5)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Cobrado</div>
                    <div className="text-sm font-semibold text-emerald-400">{formatCurrency(datos.cobrado)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Por cobrar</div>
                    <div className="text-sm font-semibold text-amber-400">{formatCurrency(datos.porCobrar)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Clients to collect */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Clientes por Pagar</h2>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setTipoCredFiltro('')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
              !tipoCredFiltro
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-border'
            )}
          >
            Todos
          </button>
          {tiposParaFiltrar.map(tipo => (
            <button
              key={tipo}
              onClick={() => setTipoCredFiltro(tipo)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
                tipoCredFiltro === tipo
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-border'
              )}
            >
              {tipo}
            </button>
          ))}
        </div>

        {clientesPorPagar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Todos los clientes están al día</p>
          </div>
        ) : (
          <div className="space-y-3">
            {clientesPorPagar.map((c, i) => {
              const unidades = []
              if (c.dptos.size) unidades.push(`Dpto ${[...c.dptos].join(', ')}`)
              if (c.ests.size) unidades.push(`Est ${[...c.ests].join(', ')}`)
              if (c.deps.size) unidades.push(`Dep ${[...c.deps].join(', ')}`)

              return (
                <div
                  key={i}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{c.nombre}</h3>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span className="font-medium">{c.tipoCredito}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{c.proyecto}{unidades.length ? ` · ${unidades.join(' · ')}` : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground mb-0.5">Por pagar</div>
                      <div className="text-base font-bold text-amber-400">{formatCurrency(c.porCobrar)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
