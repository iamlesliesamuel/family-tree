import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPeople } from '@/lib/queries'
import { PeopleSearch } from '@/components/SearchBar'

export const metadata: Metadata = { title: 'Directory' }
export const dynamic = 'force-dynamic'

export default async function DirectoryPage() {
  const people = await getAllPeople()

  return (
    <main className="flex flex-col flex-1 min-h-screen">
      <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg
              text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-zinc-200">Directory</h1>
            <p className="text-xs text-zinc-600">{people.length} family members</p>
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {people.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-16">No family members yet.</p>
        ) : (
          <PeopleSearch people={people} />
        )}
      </div>
    </main>
  )
}
