import Link from 'next/link'
import { getRecentActivity } from '@/lib/activity'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

export default async function UpdatesPage() {
  const activity = await getRecentActivity(50).catch(() => [])

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-zinc-50/90 backdrop-blur-md border-b border-zinc-200/60 dark:bg-zinc-950/85 dark:border-zinc-800/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100">← Tree</Link>
          <h1 className="font-serif text-lg text-zinc-900 dark:text-zinc-100">Updates</h1>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <div className="space-y-3">
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">No activity yet.</p>
          ) : activity.map((item) => (
            <div key={item.id} className="rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 p-3">
              <div className="flex items-start justify-between gap-3">
                {item.person_id ? (
                  <Link href={`/person/${item.person_id}`} className="font-medium text-sm text-zinc-800 hover:text-amber-700 dark:text-zinc-100 dark:hover:text-amber-300">
                    {item.friendly_description}
                  </Link>
                ) : (
                  <p className="font-medium text-sm text-zinc-800 dark:text-zinc-100">{item.friendly_description}</p>
                )}
                <time className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleString()}</time>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {item.edited_by ? `By ${item.edited_by}` : 'Contributor not specified'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
