'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type View = 'profile' | 'tree'

interface ViewToggleProps {
  personId: string
  currentView: View
}

const tabs: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'tree',
    label: 'Tree',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
]

export function ViewToggle({ personId, currentView }: ViewToggleProps) {
  const router = useRouter()

  const navigate = (view: View) => {
    const url = view === 'tree'
      ? `/person/${personId}?view=tree`
      : `/person/${personId}`
    router.push(url)
  }

  return (
    <div className="flex gap-1 p-1
      bg-zinc-100 border border-zinc-200/70
      dark:bg-zinc-900 dark:border-zinc-700/50
      rounded-xl w-fit">
      {tabs.map((tab) => {
        const active = currentView === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium',
              'transition-all duration-150',
              active
                ? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/50'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
