'use client'

import { formatCurrency, num, str } from '@/lib/sheets-service'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { Building2, TrendingUp, DollarSign, CheckCircle2, Clock, AlertCircle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProyectosTabProps {
  data: Record<string, unknown>[]
  rawMC: Record<string, unknown>[]
  filteredProyecto: string
}

export function ProyectosTab({ data, rawMC, filteredProyecto }: ProyectosTabProps) {
  const proyectos = [...new Set(rawMC.map(r => str(r['PROYECTO'])).filter(Boolean))].sort()
  const lista = filteredProyecto ? [filteredProyecto] : proyectos

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Sin datos para los filtros seleccionados</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-foreground">Detalle por Proyecto</h2>
      </div>

      <div className="grid gap-6">
        {lista.map(p => {
          const dptos = data.filter(r => str(r['PROYECTO']) === p)
          if (!dptos.length) return null

          const v = dptos.filter(r => str(r['SITUACION']) === 'VENDIDO').length
          const s = dptos.filter(r => str(r['SITUACION']) === 'SEPARADO').length
          const b = dptos.filter(r => str(r['SITUACION']) === 'BLOQUEADO').length
          const pv = dptos.filter(r => str(r['SITUACION']) === 'POR VENDER').length
          const t = dptos.length
          const pct = t > 0 ? Math.round(v / t * 1000) / 10 : 0

          const activos = dptos.filter(r => ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string))
          const ingresos = activos.reduce((a, r) => a + num(r['Ingresos  S/.']), 0)
          const xCobrar = activos.reduce((a, r) => a + num(r['Por Pagar  S/.']), 0)
          const valVendido = dptos.filter(r => str(r['SITUACION']) === 'VENDIDO').reduce((a, r) => a + num(r['VALOR S/']), 0)

          return (
            <div
              key={p}
              className="rounded-xl border border-border/50 bg-card overflow-hidden"
            >
              {/* Project Header */}
              <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{p}</h3>
                      <p className="text-xs text-muted-foreground">{t} inmuebles</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">{pct}%</div>
                    <div className="text-xs text-muted-foreground">comercializado</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <StatCard
                    label="Vendidos"
                    value={v}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    variant="success"
                  />
                  <StatCard
                    label="Separados"
                    value={s}
                    icon={<Clock className="h-4 w-4" />}
                    variant="warning"
                  />
                  <StatCard
                    label="Por Vender"
                    value={pv}
                    icon={<TrendingUp className="h-4 w-4" />}
                    variant="info"
                  />
                  <StatCard
                    label="Bloqueados"
                    value={b}
                    icon={<Lock className="h-4 w-4" />}
                    variant={b > 0 ? 'danger' : 'default'}
                  />
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Avance comercial</span>
                    <span className="font-medium text-blue-400">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
                      style={{ width: `${Math.max(pct, 0.5)}%` }}
                    />
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Valor Vendido</div>
                      <div className="text-sm font-semibold text-emerald-400">{formatCurrency(valVendido)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Ingresos</div>
                      <div className="text-sm font-semibold text-blue-400">{formatCurrency(ingresos)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Por Cobrar</div>
                      <div className="text-sm font-semibold text-amber-400">{formatCurrency(xCobrar)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string
  value: number
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variants = {
    default: 'text-foreground bg-secondary/50',
    success: 'text-emerald-400 bg-emerald-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    danger: 'text-red-400 bg-red-500/10',
    info: 'text-blue-400 bg-blue-500/10'
  }

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg',
      variants[variant]
    )}>
      {icon}
      <div>
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
