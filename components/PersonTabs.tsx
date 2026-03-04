'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export type PersonTab = 'profile' | 'tree' | 'photos' | 'timeline' | 'notes' | 'documents' | 'tags'

interface PersonTabsProps {
  activeTab: PersonTab
}

const tabs: Array<{ id: PersonTab; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'tree', label: 'Tree' },
  { id: 'photos', label: 'Photos' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
  { id: 'documents', label: 'Documents' },
  { id: 'tags', label: 'Tags' },
]

export function PersonTabs({ activeTab }: PersonTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const navigate = (tab: PersonTab) => {
    const next = new URLSearchParams(params.toString())
    if (tab === 'profile') {
      next.delete('tab')
      next.delete('view')
      next.delete('ancestorDepth')
      next.delete('descendantDepth')
    } else {
      next.set('tab', tab)
      if (tab !== 'tree') {
        next.delete('view')
        next.delete('ancestorDepth')
        next.delete('descendantDepth')
      }
    }

    const query = next.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-1 p-1 bg-zinc-100 border border-zinc-200/70 dark:bg-zinc-900 dark:border-zinc-700/50 rounded-xl w-max min-w-full">
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                active
                  ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
