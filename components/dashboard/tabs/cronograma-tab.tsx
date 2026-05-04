'use client'

import { useMemo, useState } from 'react'
import { formatCurrency, num, str, parseFechaCron } from '@/lib/sheets-service'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { Calendar, AlertTriangle, Clock, CheckCircle2, DollarSign, User, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CronogramaTabProps {
  filtradoCron: Record<string, unknown>[]
  filtrado: Record<string, unknown>[]
}

type CuotaFilter = '' | 'Vencida' | 'Por Vencer' | 'Pendiente'

export function CronogramaTab({ filtradoCron, filtrado }: CronogramaTabProps) {
  const [filCuota, setFilCuota] = useState<CuotaFilter>('')
  
  const hoy = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const cuotas = useMemo(() => 
    filtradoCron.filter(r => str(r['ESTADO']) === 'Por Pagar'),
    [filtradoCron]
  )

  const stats = useMemo(() => {
    const nVencidas = cuotas.filter(r => str(r['SITUACION']) === 'Vencida').length
    const nPorVencer = cuotas.filter(r => str(r['SITUACION']) === 'Por Vencer').length
    const nPendientes = cuotas.filter(r => str(r['SITUACION']) === 'Pendiente').length
    const montoVencido = cuotas.filter(r => str(r['SITUACION']) === 'Vencida').reduce((a, r) => a + num(r['Monto Cuota']), 0)

    const activos = filtrado.filter(r => ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string))
    const totalIngr = activos.reduce((a, r) => a + num(r['Ingresos  S/.']), 0)
    const totalCobr = activos.reduce((a, r) => a + num(r['Por Pagar  S/.']), 0)

    return { nVencidas, nPorVencer, nPendientes, montoVencido, totalIngr, totalCobr }
  }, [cuotas, filtrado])

  const cuotasFiltradas = useMemo(() => 
    filCuota ? cuotas.filter(r => str(r['SITUACION']) === filCuota) : cuotas,
    [cuotas, filCuota]
  )

  const grupos = [
    { key: 'Vencida' as const, label: 'Vencidas', description: 'Atrasadas', variant: 'danger' as const, icon: AlertTriangle },
    { key: 'Por Vencer' as const, label: 'Por Vencer', description: 'Próximos 7 días', variant: 'warning' as const, icon: Clock },
    { key: 'Pendiente' as const, label: 'Pendientes', description: 'A tiempo', variant: 'info' as const, icon: CheckCircle2 }
  ]

  const gruposAMostrar = filCuota
    ? grupos.filter(g => g.key === filCuota)
    : grupos

  if (cuotas.length === 0) {
    return (
      <div className="space-y-8">
        <KPIGrid>
          <KPICard label="Total Ingresos" value={formatCurrency(stats.totalIngr)} variant="success" />
          <KPICard label="Total por Cobrar" value={formatCurrency(stats.totalCobr)} variant="warning" />
        </KPIGrid>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Calendar className="h-8 w-8 mb-2" />
          <p className="text-center">Sin datos de cronograma.<br />Asegúrate de haber exportado la hoja correspondiente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Cronograma de Cuotas</h2>
        </div>

        <KPIGrid>
          <KPICard label="Total Ingresos" value={formatCurrency(stats.totalIngr)} variant="success" icon={<DollarSign className="h-4 w-4" />} />
          <KPICard label="Total por Cobrar" value={formatCurrency(stats.totalCobr)} variant="warning" icon={<DollarSign className="h-4 w-4" />} />
          <KPICard 
            label="Cuotas Vencidas" 
            value={stats.nVencidas} 
            variant="danger" 
            subtext={formatCurrency(stats.montoVencido)}
            icon={<AlertTriangle className="h-4 w-4" />} 
          />
          <KPICard 
            label="Por Vencer (7 días)" 
            value={stats.nPorVencer} 
            variant="warning"
            subtext={`${stats.nPendientes} pendientes`}
            icon={<Clock className="h-4 w-4" />} 
          />
        </KPIGrid>
      </section>

      {/* Filter buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilCuota('')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
            !filCuota
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-border'
          )}
        >
          Todas
        </button>
        <button
          onClick={() => setFilCuota('Vencida')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
            filCuota === 'Vencida'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/50'
          )}
        >
          Vencidas
        </button>
        <button
          onClick={() => setFilCuota('Por Vencer')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
            filCuota === 'Por Vencer'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/50'
          )}
        >
          Por Vencer
        </button>
        <button
          onClick={() => setFilCuota('Pendiente')}
          className={cn(
            'px-4 py-2 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
            filCuota === 'Pendiente'
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/50'
          )}
        >
          Pendientes
        </button>
      </div>

      {/* Grupos */}
      <div className="space-y-6">
        {gruposAMostrar.map(grupo => {
          const items = cuotasFiltradas
            .filter(r => str(r['SITUACION']) === grupo.key)
            .sort((a, b) => {
              const fa = parseFechaCron(String(a['Fecha Cuota']))
              const fb = parseFechaCron(String(b['Fecha Cuota']))
              if (!fa || !fb) return 0
              return fa.getTime() - fb.getTime()
            })

          if (!items.length) return null

          const variantColors = {
            danger: {
              header: 'bg-red-500',
              badge: 'bg-red-400/20 text-red-200',
              row: 'border-red-500/20 bg-red-500/5',
              text: 'text-red-400'
            },
            warning: {
              header: 'bg-amber-600',
              badge: 'bg-amber-400/20 text-amber-200',
              row: 'border-amber-500/20 bg-amber-500/5',
              text: 'text-amber-400'
            },
            info: {
              header: 'bg-blue-500',
              badge: 'bg-blue-400/20 text-blue-200',
              row: 'border-blue-500/20 bg-blue-500/5',
              text: 'text-blue-400'
            }
          }

          const colors = variantColors[grupo.variant]
          const Icon = grupo.icon

          return (
            <div key={grupo.key} className="rounded-xl overflow-hidden border border-border/50">
              {/* Header */}
              <div className={cn('px-4 py-3 flex items-center justify-between', colors.header)}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-white" />
                  <span className="font-semibold text-white">{grupo.label}</span>
                  <span className="text-xs text-white/70">{grupo.description}</span>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', colors.badge)}>
                  {items.length} cuota{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Items */}
              <div className="bg-card divide-y divide-border/30">
                {items.map((r, i) => {
                  const cliente = str(r['Nombre del Cliente']) || 'Sin nombre'
                  const proy = str(r['PROYECTO'])
                  const dpto = str(r['DPTO'])
                  const torre = str(r['TORRE'])
                  const tipo = str(r['Tipo de Credito'])
                  const monto = num(r['Monto Cuota'])
                  const fechaStr = str(r['Fecha Cuota'])
                  const fecha = parseFechaCron(fechaStr)
                  const diffDias = fecha ? Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null

                  let diasTxt = ''
                  if (diffDias !== null) {
                    if (diffDias < 0) diasTxt = `${Math.abs(diffDias)} días de atraso`
                    else if (diffDias === 0) diasTxt = 'Vence hoy'
                    else if (diffDias === 1) diasTxt = 'Vence mañana'
                    else diasTxt = `Vence en ${diffDias} días`
                  }

                  const fechaFmt = fecha
                    ? fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : fechaStr

                  return (
                    <div key={i} className={cn('p-4', colors.row)}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <h4 className="text-sm font-semibold text-foreground truncate">{cliente}</h4>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span>{proy}{dpto ? ` · Dpto ${dpto}` : ''}{torre ? ` T${torre}` : ''}</span>
                            </div>
                            {tipo && (
                              <div className="text-[11px]">{tipo}</div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{fechaFmt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={cn('text-base font-bold', colors.text)}>
                            {formatCurrency(monto)}
                          </div>
                          {diasTxt && (
                            <div className={cn('text-[11px] mt-0.5', colors.text)}>
                              {diasTxt}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
