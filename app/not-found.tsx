import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 min-h-screen px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800
        flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-zinc-200 mb-2">Person not found</h1>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">
        This family member doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700
          text-sm font-medium text-zinc-300
          hover:bg-zinc-700 hover:text-zinc-100
          transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      >
        Back to family list
      </Link>
    </main>
  )
}
