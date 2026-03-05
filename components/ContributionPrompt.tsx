'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface ContributionPromptProps {
  personId: string
}

export function ContributionPrompt({ personId }: ContributionPromptProps) {
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

  return (
    <section className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 p-4 space-y-3">
      <h3 className="font-serif text-lg text-zinc-900 dark:text-zinc-100">Help Improve This Record</h3>
      <p className="text-xs text-zinc-500">Your name is optional. If entered, edits are attributed in history.</p>
      <input
        value={name}
        onChange={(e) => saveContributor(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full md:w-72 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => goToTab('photos')} className="px-3 py-1.5 rounded-md text-xs border border-zinc-300 dark:border-zinc-700">Upload Photo</button>
        <button type="button" onClick={() => goToTab('documents')} className="px-3 py-1.5 rounded-md text-xs border border-zinc-300 dark:border-zinc-700">Upload Document</button>
        <button type="button" onClick={() => goToTab('notes')} className="px-3 py-1.5 rounded-md text-xs border border-zinc-300 dark:border-zinc-700">Add Story/Notes</button>
        <button type="button" onClick={() => goToTab('profile')} className="px-3 py-1.5 rounded-md text-xs border border-zinc-300 dark:border-zinc-700">Suggest Correction</button>
      </div>
      <p className="text-[11px] text-zinc-500">Record: {personId.slice(0, 8)}...</p>
    </section>
  )
}
