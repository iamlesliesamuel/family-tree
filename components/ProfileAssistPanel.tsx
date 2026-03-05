'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { MissingItem } from '@/lib/person-insights'
import { ProfilePhotoQuickUpload } from './ProfilePhotoQuickUpload'

interface ProfileAssistPanelProps {
  personId: string
  completeness: number
  missing: MissingItem[]
}

export function ProfileAssistPanel({ personId, completeness, missing }: ProfileAssistPanelProps) {
  const [name, setName] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  useEffect(() => {
    const saved = localStorage.getItem('family_tree_contributor') ?? ''
    setName(saved)
  }, [])

  const saveContributor = (value: string) => {
    setName(value)
    if (value.trim()) localStorage.setItem('family_tree_contributor', value.trim())
    else localStorage.removeItem('family_tree_contributor')
  }

  const goToTab = (tab: string) => {
    const next = new URLSearchParams(params.toString())
    if (tab === 'profile') next.delete('tab')
    else next.set('tab', tab)
    router.push(`${pathname}?${next.toString()}`)
  }

  const openProfileEdit = () => {
    const next = new URLSearchParams(params.toString())
    next.delete('tab')
    next.set('edit', '1')
    router.push(`${pathname}?${next.toString()}`)
  }

  const openAddParent = () => {
    const next = new URLSearchParams(params.toString())
    next.delete('tab')
    next.set('addParent', '1')
    router.push(`${pathname}?${next.toString()}#parents-section`)
  }

  const handleMissingAdd = (item: MissingItem) => {
    if (item.key === 'birth_date') {
      openProfileEdit()
      return
    }
    if (item.key === 'parents') {
      openAddParent()
      return
    }
    goToTab(item.tab ?? 'profile')
  }

  return (
    <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-lg text-zinc-900 dark:text-zinc-100">Improve This Record</h3>
        <span className="text-xs px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
          {completeness}% complete
        </span>
      </div>

      <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
        {missing.length === 0 ? (
          <p>Key profile fields look complete.</p>
        ) : (
          missing.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-2">
              <span>{item.label}</span>
              {item.key === 'profile_photo' ? (
                <ProfilePhotoQuickUpload
                  personId={personId}
                  label="Add"
                  buttonClassName="text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 disabled:opacity-50"
                />
              ) : (
                <button type="button" onClick={() => handleMissingAdd(item)} className="text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700">
                  Add
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="pt-1">
        <input
          value={name}
          onChange={(e) => saveContributor(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full md:w-80 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openProfileEdit} className="px-3 py-1.5 rounded-md text-xs border border-zinc-300 dark:border-zinc-700">Suggest Correction</button>
      </div>
      <p className="text-[11px] text-zinc-500">Record: {personId.slice(0, 8)}...</p>
    </section>
  )
}
