'use client'

import { cn } from '@/lib/utils'

interface ProgressCardProps {
  label: string
  value: number
  maxValue?: number
  displayValue?: string
  variant?: 'default' | 'success' | 'warning' | 'info'
  size?: 'sm' | 'default' | 'lg'
  showPercentage?: boolean
  className?: string
  children?: React.ReactNode
}

export function ProgressCard({
  label,
  value,
  maxValue = 100,
  displayValue,
  variant = 'default',
  size = 'default',
  showPercentage = true,
  className,
  children
}: ProgressCardProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  
  const barColors = {
    default: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-400'
  }

  const heights = {
    sm: 'h-1.5',
    default: 'h-2',
    lg: 'h-3'
  }

  return (
    <div className={cn(
      'rounded-xl border border-border/50 bg-card p-4',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
        {showPercentage && (
          <span className="text-lg font-semibold text-blue-400">
            {displayValue || `${percentage.toFixed(1)}%`}
          </span>
        )}
      </div>
      
      <div className={cn('w-full rounded-full bg-secondary overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            barColors[variant]
          )}
          style={{ width: `${Math.max(percentage, 1)}%` }}
        />
      </div>
      
      {children && (
        <div className="mt-3 pt-3 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  )
}
