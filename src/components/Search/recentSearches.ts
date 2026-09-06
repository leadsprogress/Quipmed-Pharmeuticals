const STORAGE_KEY = 'amulya:recent-searches'
export const MAX_RECENT_SEARCHES = 8

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

function persist(terms: string[]): string[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms))
    } catch {
      // localStorage unavailable (private mode, quota, etc.) — fail silently, in-memory state still works
    }
  }
  return terms
}

export function addRecentSearch(term: string): string[] {
  const trimmed = term.trim()
  if (!trimmed) return getRecentSearches()

  const existing = getRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase())
  const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES)
  return persist(next)
}

export function removeRecentSearch(term: string): string[] {
  const next = getRecentSearches().filter((t) => t.toLowerCase() !== term.toLowerCase())
  return persist(next)
}

export function clearRecentSearches(): string[] {
  return persist([])
}
