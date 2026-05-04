'use client'

import { RefreshCw, Building2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  lastUpdate: Date | null
  isLoading: boolean
  onRefresh: () => void
}

export function Header({ lastUpdate, isLoading, onRefresh }: HeaderProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Building2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Colindante Inmobiliaria
              </div>
              <h1 className="text-lg font-semibold text-foreground -mt-0.5">
                Dashboard Gerencial
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Last update info */}
          {lastUpdate && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Actualizado: {formatDate(lastUpdate)}</span>
            </div>
          )}
          
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2 border-border/50 bg-secondary/50 hover:bg-secondary"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
