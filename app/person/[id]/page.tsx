import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPersonProfile } from '@/lib/queries'
import { getDisplayName, getYearRange } from '@/lib/types'
import { ProfileView } from '@/components/ProfileView'
import { TreeView } from '@/components/TreeView'
import { ViewToggle } from '@/components/ViewToggle'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

// Next.js 15: params and searchParams are Promises
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ view?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getPersonProfile(id)
  if (!profile) return { title: 'Person not found' }

  const name = getDisplayName(profile.person)
  const years = getYearRange(profile.person)
  return {
    title: years ? `${name} (${years})` : name,
    description: `Family tree profile for ${name}`,
  }
}

export default async function PersonPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { view } = await searchParams

  const profile = await getPersonProfile(id)
  if (!profile) notFound()

  const isTree = view === 'tree'

  return (
    <main className="flex flex-col flex-1 min-h-screen">
      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20
        bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/60
        dark:bg-zinc-950/85 dark:border-zinc-800/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Back button — archival chevron */}
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg
              text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/60
              dark:hover:text-zinc-300 dark:hover:bg-zinc-800/60
              border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/40
              transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            aria-label="Back to family tree"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Name + years */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-base font-semibold
              text-zinc-900 dark:text-zinc-100
              truncate leading-tight">
              {getDisplayName(profile.person)}
            </h1>
            {getYearRange(profile.person) && (
              <p className="text-xs text-zinc-500 dark:text-zinc-600 tabular-nums tracking-wider">
                {getYearRange(profile.person)}
              </p>
            )}
          </div>

          <ViewToggle personId={id} currentView={isTree ? 'tree' : 'profile'} />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {isTree ? (
          <TreeView profile={profile} />
        ) : (
          <ProfileView profile={profile} />
        )}
      </div>
    </main>
  )
}
