'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  subtext?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
  size?: 'default' | 'large'
}

export function KPICard({
  label,
  value,
  subtext,
  variant = 'default',
  change,
  changeLabel,
  icon,
  className,
  size = 'default'
}: KPICardProps) {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    info: 'text-blue-400'
  }

  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-3 w-3 text-emerald-400" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-400" />
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:bg-card/80',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {icon && (
            <span className="text-muted-foreground/60">
              {icon}
            </span>
          )}
        </div>
        
        <div className={cn(
          'font-semibold tracking-tight',
          variantStyles[variant],
          size === 'large' ? 'text-3xl' : 'text-2xl'
        )}>
          {value}
        </div>
        
        {(subtext || change !== undefined) && (
          <div className="flex items-center gap-2 mt-2">
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn(
                  'text-xs font-medium',
                  change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-muted-foreground'
                )}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
            {subtext && (
              <span className="text-xs text-muted-foreground">
                {changeLabel || subtext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function KPIGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'grid grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      {children}
    </div>
  )
}
