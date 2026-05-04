'use client'

import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { formatCurrency, num, str } from '@/lib/sheets-service'
import { Building2, DollarSign, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, Lock } from 'lucide-react'

interface ResumenTabProps {
  data: Record<string, unknown>[]
}

export function ResumenTab({ data }: ResumenTabProps) {
  const inmuebles = data
  const total = inmuebles.length
  const vendido = inmuebles.filter(r => str(r['SITUACION']) === 'VENDIDO').length
  const separado = inmuebles.filter(r => str(r['SITUACION']) === 'SEPARADO').length
  const bloq = inmuebles.filter(r => str(r['SITUACION']) === 'BLOQUEADO').length
  const xvender = inmuebles.filter(r => str(r['SITUACION']) === 'POR VENDER').length
  const pct = total > 0 ? Math.round(vendido / total * 1000) / 10 : 0

  const activos = inmuebles.filter(r => ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string))
  const ingresos = activos.reduce((a, r) => a + num(r['Ingresos  S/.']), 0)
  const xCobrar = activos.reduce((a, r) => a + num(r['Por Pagar  S/.']), 0)
  const valVendidoSolo = inmuebles.filter(r => str(r['SITUACION']) === 'VENDIDO').reduce((a, r) => a + num(r['VALOR S/']), 0)
  const valNegociado = inmuebles.filter(r => ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string)).reduce((a, r) => a + num(r['VALOR S/']), 0)

  return (
    <div className="space-y-8">
      {/* Hero KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Portafolio Inmobiliario</h2>
        </div>
        
        <KPIGrid>
          <KPICard
            label="Total Inmuebles"
            value={total}
            icon={<Building2 className="h-4 w-4" />}
          />
          <KPICard
            label="Vendidos"
            value={vendido}
            variant="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <KPICard
            label="Separados"
            value={separado}
            variant="warning"
            icon={<Clock className="h-4 w-4" />}
          />
          <KPICard
            label="Por Vender"
            value={xvender}
            variant="info"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </KPIGrid>
      </section>

      {/* Progress Section */}
      <section>
        <ProgressCard
          label="Avance Comercial"
          value={pct}
          variant="success"
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Bloqueados: {bloq}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>Activos: {vendido + separado}</span>
            </div>
          </div>
        </ProgressCard>
      </section>

      {/* Financial KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-foreground">Indicadores Financieros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Valor Vendido
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(valVendidoSolo)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Solo contratos firmados
            </div>
          </div>
          
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Valor Negociado
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(valNegociado)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Vendido + Separado
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <KPICard
            label="Ingresos Recibidos"
            value={formatCurrency(ingresos)}
            variant="success"
          />
          <KPICard
            label="Por Cobrar"
            value={formatCurrency(xCobrar)}
            variant="warning"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <KPICard
            label="Unidades Activas"
            value={activos.length}
            subtext="Vendidos + Separados"
          />
        </div>
      </section>
    </div>
  )
}
