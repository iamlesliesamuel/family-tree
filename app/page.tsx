import type { Metadata } from 'next'
import { getDefaultRootPerson, getAllPeopleSummary, getAllPeople } from '@/lib/queries'
import { fetchSubgraph } from '@/lib/subgraph'
import { TreeExplorer } from '@/components/TreeExplorer'

export const metadata: Metadata = { title: 'Family Tree' }
export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// Home page — Tree Explorer
//
// The tree automatically roots on the best patriarch/matriarch candidate:
// the person with no recorded parents, largest descendant count, earliest
// birth date (see get_default_root_person() Supabase RPC).
// ─────────────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const rootPerson = await getDefaultRootPerson()
  const focusId = rootPerson?.id ?? null

  if (!focusId) return <EmptyState />

  // Root view: no ancestors (root has none), 4 generations of descendants
  const [initialData, allPeople, allPeopleFull] = await Promise.all([
    fetchSubgraph(focusId, 0, 4),
    getAllPeopleSummary(),
    getAllPeople(),
  ])

  if (!initialData) {
    return <EmptyState message="Could not load tree data. Check your Supabase connection." />
  }

  return (
    <main className="flex flex-col flex-1 min-h-screen">
      <TreeExplorer
        initialData={initialData}
        defaultPersonId={focusId}
        allPeople={allPeople}
        allPeopleFull={allPeopleFull}
        initialAncestorDepth={0}
        initialDescendantDepth={4}
      />
    </main>
  )
}

function EmptyState({ message }: { message?: string }) {
  return (
    <main className="flex flex-col items-center justify-center flex-1 min-h-screen px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
        <svg
          className="w-8 h-8 text-zinc-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.25}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-300 mb-2">No family members yet</h2>
      <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">
        {message ?? (
          <>
            Add people to your Supabase{' '}
            <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
              people
            </code>{' '}
            table to see them here.
          </>
        )}
      </p>
    </main>
  )
}
