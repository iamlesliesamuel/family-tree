'use client'

import { useEffect } from 'react'

export function ContributorProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const originalFetch = window.fetch.bind(window)

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const contributor = localStorage.getItem('family_tree_contributor')?.trim()
      if (!contributor) return originalFetch(input, init)

      const headers = new Headers(init?.headers ?? {})
      if (!headers.has('x-edited-by')) {
        headers.set('x-edited-by', contributor)
      }

      return originalFetch(input, { ...(init ?? {}), headers })
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [])

  return null
}
