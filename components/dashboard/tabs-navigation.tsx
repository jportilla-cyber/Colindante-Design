'use client'

import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building, 
  BarChart3, 
  Wallet, 
  Calendar, 
  Users, 
  TrendingUp 
} from 'lucide-react'

export type TabId = 'resumen' | 'proyectos' | 'graficos' | 'cobranza' | 'cronograma' | 'cartera' | 'proyecciones'

interface Tab {
  id: TabId
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'proyectos', label: 'Proyectos', icon: <Building className="h-4 w-4" /> },
  { id: 'graficos', label: 'Gráficos', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'cobranza', label: 'Cobranza', icon: <Wallet className="h-4 w-4" /> },
  { id: 'cronograma', label: 'Cronograma', icon: <Calendar className="h-4 w-4" /> },
  { id: 'cartera', label: 'Cartera', icon: <Users className="h-4 w-4" /> },
  { id: 'proyecciones', label: 'Proyecciones', icon: <TrendingUp className="h-4 w-4" /> },
]

interface TabsNavigationProps {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export function TabsNavigation({ activeTab, onChange }: TabsNavigationProps) {
  return (
    <div className="border-b border-border/40 bg-card/50">
      <div className="container px-4 lg:px-8">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'group flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <span className={cn(
                'transition-colors',
                activeTab === tab.id ? 'text-blue-400' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
