'use client'

import { FilterState } from '@/lib/types'
import { Filter } from 'lucide-react'

interface FiltersProps {
  filters: FilterState
  proyectos: string[]
  inmuebles: string[]
  onChange: (filters: FilterState) => void
}

export function Filters({ filters, proyectos, inmuebles, onChange }: FiltersProps) {
  const situaciones = ['VENDIDO', 'SEPARADO', 'BLOQUEADO', 'POR VENDER']

  return (
    <div className="border-b border-border/40 bg-card/30">
      <div className="container px-4 lg:px-8 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 text-muted-foreground shrink-0">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Filtros</span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={filters.proyecto}
              onChange={(e) => onChange({ ...filters, proyecto: e.target.value })}
              className="h-8 px-3 pr-8 text-xs font-medium rounded-lg border border-border/50 bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 appearance-none cursor-pointer min-w-[140px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filters.situacion}
              onChange={(e) => onChange({ ...filters, situacion: e.target.value })}
              className="h-8 px-3 pr-8 text-xs font-medium rounded-lg border border-border/50 bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 appearance-none cursor-pointer min-w-[140px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
            >
              <option value="">Todas las situaciones</option>
              {situaciones.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filters.inmueble}
              onChange={(e) => onChange({ ...filters, inmueble: e.target.value })}
              className="h-8 px-3 pr-8 text-xs font-medium rounded-lg border border-border/50 bg-secondary/50 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 appearance-none cursor-pointer min-w-[140px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center'
              }}
            >
              <option value="">Todos los inmuebles</option>
              {inmuebles.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
