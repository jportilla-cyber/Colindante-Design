'use client'

import { useMemo } from 'react'
import { formatCurrency, num, str } from '@/lib/sheets-service'
import { KPICard, KPIGrid } from '@/components/dashboard/kpi-card'
import { Users, CheckCircle2, Clock, Building2, DollarSign, User, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarteraTabProps {
  filtrado: Record<string, unknown>[]
  filtradoCron: Record<string, unknown>[]
}

const pillVariants = {
  VENDIDO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SEPARADO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  BLOQUEADO: 'bg-red-500/10 text-red-400 border-red-500/20',
  'POR VENDER': 'bg-secondary text-muted-foreground border-border/50'
}

export function CarteraTab({ filtrado, filtradoCron }: CarteraTabProps) {
  const activos = useMemo(() =>
    filtrado.filter(r =>
      ['VENDIDO', 'SEPARADO'].includes(str(r['SITUACION']) as string) &&
      str(r['Nombre del Cliente'])
    ), [filtrado]
  )

  const clientes = useMemo(() => {
    const clienteMap: Record<string, {
      nombre: string
      proyecto: string
      situacion: string
      vendedor: string
      dptos: Set<string>
      ests: Set<string>
      deps: Set<string>
      valor: number
      ingresos: number
      porCobrar: number
      cuotaInicialPend: number
    }> = {}

    activos.forEach(r => {
      const nombre = str(r['Nombre del Cliente'])
      if (!clienteMap[nombre]) {
        clienteMap[nombre] = {
          nombre,
          proyecto: str(r['PROYECTO']),
          situacion: str(r['SITUACION']),
          vendedor: str(r['VENDEDOR']),
          dptos: new Set(),
          ests: new Set(),
          deps: new Set(),
          valor: 0,
          ingresos: 0,
          porCobrar: 0,
          cuotaInicialPend: 0
        }
      }

      if (str(r['DPTO'])) clienteMap[nombre].dptos.add(str(r['DPTO']))
      if (str(r['EST'])) clienteMap[nombre].ests.add(str(r['EST']))
      if (str(r['DEP'])) clienteMap[nombre].deps.add(str(r['DEP']))
      clienteMap[nombre].valor += num(r['VALOR S/'])
      clienteMap[nombre].ingresos += num(r['Ingresos  S/.'])
      clienteMap[nombre].porCobrar += num(r['Por Pagar  S/.'])
    })

    // Add cuota inicial pendiente from cronograma
    filtradoCron.forEach(r => {
      const nombre = str(r['Nombre del Cliente'])
      if (clienteMap[nombre]) {
        const tipoCredito = str(r['Tipo de Credito']) || str(r['Tipo Credito'])
        const estado = str(r['ESTADO'])
        if (tipoCredito.trim().toLowerCase() === 'cuota inicial' && estado.trim().toLowerCase() === 'por pagar') {
          clienteMap[nombre].cuotaInicialPend += num(r['Monto Cuota'])
        }
      }
    })

    return Object.values(clienteMap).sort((a, b) => b.valor - a.valor)
  }, [activos, filtradoCron])

  const vendidos = clientes.filter(c => c.situacion === 'VENDIDO').length
  const separados = clientes.filter(c => c.situacion === 'SEPARADO').length

  if (!activos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Users className="h-8 w-8 mb-2" />
        <p>Sin clientes activos para los filtros seleccionados</p>
      </div>
    )
  }

  const formatUnidades = (c: typeof clientes[0]) => {
    const partes = []
    if (c.dptos.size) partes.push(`Dpto ${[...c.dptos].join(', ')}`)
    if (c.ests.size) {
      const arr = [...c.ests]
      partes.push(`Est ${arr.length > 1 ? arr.slice(0, -1).join(', ') + ' y ' + arr.slice(-1) : arr[0]}`)
    }
    if (c.deps.size) {
      const arr = [...c.deps]
      partes.push(`Dep ${arr.length > 1 ? arr.slice(0, -1).join(', ') + ' y ' + arr.slice(-1) : arr[0]}`)
    }
    return partes.join(' · ')
  }

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-foreground">Cartera de Clientes</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <KPICard
            label="Contratos Firmados"
            value={vendidos}
            variant="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <KPICard
            label="En Proceso"
            value={separados}
            variant="warning"
            icon={<Clock className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Client list */}
      <section>
        <div className="text-sm text-muted-foreground mb-4">
          Clientes activos ({clientes.length})
        </div>

        <div className="space-y-3">
          {clientes.map((c, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-colors"
            >
              {/* Client header */}
              <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{c.nombre}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className={cn(
                          'px-2 py-0.5 text-[10px] font-semibold rounded-full border uppercase',
                          pillVariants[c.situacion as keyof typeof pillVariants] || pillVariants['POR VENDER']
                        )}>
                          {c.situacion}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {c.proyecto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="px-4 py-3">
                {/* Units and vendor */}
                <div className="text-xs text-muted-foreground mb-3 space-y-1">
                  {formatUnidades(c) && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{formatUnidades(c)}</span>
                    </div>
                  )}
                  {c.vendedor && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span>{c.vendedor}</span>
                    </div>
                  )}
                </div>

                {/* Financial stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <div className="text-[10px] text-muted-foreground uppercase">Valor</div>
                    <div className="text-sm font-semibold text-foreground">{formatCurrency(c.valor)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Cobrado</div>
                    <div className="text-sm font-semibold text-emerald-400">{formatCurrency(c.ingresos)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Pendiente</div>
                    <div className="text-sm font-semibold text-amber-400">{formatCurrency(c.porCobrar)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <div className="text-[10px] text-muted-foreground uppercase">C.I. Pend.</div>
                    <div className="text-sm font-semibold text-amber-400">{formatCurrency(c.cuotaInicialPend)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
