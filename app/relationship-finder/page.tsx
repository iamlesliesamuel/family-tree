import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { RelationshipFinder } from '@/components/RelationshipFinder'
import { getAllPeopleSummary } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function RelationshipFinderPage() {
  const people = await getAllPeopleSummary().catch(() => [])

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/60 dark:bg-zinc-950/85 dark:border-zinc-800/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100">← Tree</Link>
          <h1 className="font-serif text-lg text-zinc-900 dark:text-zinc-100">Relationship Finder</h1>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <RelationshipFinder people={people} />
      </div>
    </main>
  )
}
