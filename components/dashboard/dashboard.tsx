'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { Header } from '@/components/dashboard/header'
import { TabsNavigation, TabId } from '@/components/dashboard/tabs-navigation'
import { Filters } from '@/components/dashboard/filters'
import { ResumenTab } from '@/components/dashboard/tabs/resumen-tab'
import { ProyectosTab } from '@/components/dashboard/tabs/proyectos-tab'
import { GraficosTab } from '@/components/dashboard/tabs/graficos-tab'
import { CobranzaTab } from '@/components/dashboard/tabs/cobranza-tab'
import { CronogramaTab } from '@/components/dashboard/tabs/cronograma-tab'
import { CarteraTab } from '@/components/dashboard/tabs/cartera-tab'
import { ProyeccionesTab } from '@/components/dashboard/tabs/proyecciones-tab'
import { FilterState } from '@/lib/types'
import { str } from '@/lib/sheets-service'
import { Loader2 } from 'lucide-react'

interface DashboardData {
  rawMC: Record<string, unknown>[]
  rawAB: Record<string, unknown>[]
  rawCron: Record<string, unknown>[]
  rawProy: Record<string, unknown>[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('resumen')
  const [filters, setFilters] = useState<FilterState>({
    proyecto: '',
    situacion: '',
    inmueble: ''
  })
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/sheets',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60 * 60 * 1000, // 1 hour
      onSuccess: () => {
        setLastUpdate(new Date())
      }
    }
  )

  const handleRefresh = useCallback(() => {
    mutate()
  }, [mutate])

  // Extract filter options
  const proyectos = data?.rawMC
    ? [...new Set(data.rawMC.map(r => str(r['PROYECTO'])).filter(Boolean))].sort()
    : []

  const inmuebles = data?.rawMC
    ? [...new Set(data.rawMC.map(r => str(r['INMUEBLE'])).filter(Boolean))].sort()
    : []

  // Apply filters
  const filtrado = data?.rawMC
    ? data.rawMC.filter(r => {
        if (filters.proyecto && str(r['PROYECTO']) !== filters.proyecto) return false
        if (filters.situacion && str(r['SITUACION']) !== filters.situacion) return false
        if (filters.inmueble && str(r['INMUEBLE']) !== filters.inmueble) return false
        return true
      })
    : []

  const filtradoCron = data?.rawCron
    ? data.rawCron.filter(r => {
        if (filters.proyecto && str(r['PROYECTO']) !== filters.proyecto) return false
        if (filters.situacion && str(r['ESTADO VENTA']) !== filters.situacion) return false
        return true
      })
    : []

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Cargando datos...</p>
            <p className="text-xs text-muted-foreground mt-1">Conectando con Google Sheets</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-2">Error al cargar datos</p>
          <p className="text-xs text-muted-foreground mb-4">
            Verifica que el Sheet ID sea correcto y que la hoja sea pública.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <ResumenTab data={filtrado} />
      case 'proyectos':
        return (
          <ProyectosTab
            data={filtrado}
            rawMC={data?.rawMC || []}
            filteredProyecto={filters.proyecto}
          />
        )
      case 'graficos':
        return (
          <GraficosTab
            filtrado={filtrado}
            rawAB={data?.rawAB || []}
            rawProy={data?.rawProy || []}
            rawCron={data?.rawCron || []}
            filteredProyecto={filters.proyecto}
          />
        )
      case 'cobranza':
        return <CobranzaTab filtrado={filtrado} />
      case 'cronograma':
        return <CronogramaTab filtradoCron={filtradoCron} filtrado={filtrado} />
      case 'cartera':
        return <CarteraTab filtrado={filtrado} filtradoCron={filtradoCron} />
      case 'proyecciones':
        return (
          <ProyeccionesTab
            filtrado={filtrado}
            rawAB={data?.rawAB || []}
            rawProy={data?.rawProy || []}
            rawCron={data?.rawCron || []}
            filteredProyecto={filters.proyecto}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdate={lastUpdate}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
      
      <TabsNavigation
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      
      <Filters
        filters={filters}
        proyectos={proyectos}
        inmuebles={inmuebles}
        onChange={setFilters}
      />

      <main className="container px-4 lg:px-8 py-6 pb-20">
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3">
        <div className="container px-4 lg:px-8 text-center text-xs text-muted-foreground">
          Dashboard Colindante Inmobiliaria
          {lastUpdate && (
            <span className="ml-2">
              · Última actualización: {lastUpdate.toLocaleString('es-PE')}
            </span>
          )}
        </div>
      </footer>
    </div>
  )
}
