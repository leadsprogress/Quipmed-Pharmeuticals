// Robust-but-conservative product name matching: normalize away case/spacing/punctuation noise,
// then walk a strict hierarchy (exact -> slug -> fuzzy [+composition tiebreak] -> give up) so a
// near-miss on an unrelated product never gets silently treated as a match.

export type MatchCandidate = {
  id: number
  title: string
  slug: string
  composition?: string | null
}

export type MatchMethod = 'exact_normalized' | 'slug' | 'fuzzy' | 'composition_secondary' | 'none'

export type MatchResult = {
  product: MatchCandidate | null
  confidence: number
  method: MatchMethod
}

export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9./ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugifyName(input: string): string {
  return normalizeName(input).replace(/[./ ]+/g, '-')
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0))

  for (let i = 0; i < rows; i++) dp[i][0] = i
  for (let j = 0; j < cols; j++) dp[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  return dp[rows - 1][cols - 1]
}

function similarity(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

// Below this, a candidate is not worth surfacing even as a manual-review suggestion.
const MIN_SUGGESTION_SIMILARITY = 0.55
// At/above this, a fuzzy (or composition-boosted) match is trusted automatically.
export const AUTO_MATCH_CONFIDENCE = 0.85

export function matchProduct(
  detected: { name: string; composition?: string | null },
  candidates: MatchCandidate[],
): MatchResult {
  if (!detected.name?.trim() || candidates.length === 0) {
    return { product: null, confidence: 0, method: 'none' }
  }

  const normDetected = normalizeName(detected.name)
  const slugDetected = slugifyName(detected.name)

  // 1. Exact normalized name match
  const exact = candidates.find((c) => normalizeName(c.title) === normDetected)
  if (exact) {
    return { product: exact, confidence: 0.99, method: 'exact_normalized' }
  }

  // 2. Exact slug match (product slug = title-slug + packing-slug suffix, e.g.
  // "dapagotfil-5-10-10" for title "Dapagotfil 5" + packing "10*10")
  const slugMatch = candidates.find(
    (c) => c.slug === slugDetected || c.slug.startsWith(`${slugDetected}-`),
  )
  if (slugMatch) {
    return { product: slugMatch, confidence: 0.95, method: 'slug' }
  }

  // 3. Strong fuzzy match, with composition as a tiebreak/confidence-booster for borderline scores
  let best: { candidate: MatchCandidate; score: number } | null = null
  for (const candidate of candidates) {
    const score = similarity(normDetected, normalizeName(candidate.title))
    if (!best || score > best.score) {
      best = { candidate, score }
    }
  }

  if (!best || best.score < MIN_SUGGESTION_SIMILARITY) {
    return { product: null, confidence: best?.score ?? 0, method: 'none' }
  }

  if (best.score >= AUTO_MATCH_CONFIDENCE) {
    return { product: best.candidate, confidence: best.score, method: 'fuzzy' }
  }

  if (detected.composition && best.candidate.composition) {
    const compositionSimilarity = similarity(
      normalizeName(detected.composition),
      normalizeName(best.candidate.composition),
    )
    if (compositionSimilarity >= 0.7) {
      const boosted = Math.min(0.97, Math.max(best.score + 0.1, AUTO_MATCH_CONFIDENCE))
      return { product: best.candidate, confidence: boosted, method: 'composition_secondary' }
    }
  }

  // Below the auto-match bar — surfaced as a suggestion for manual review, not applied automatically.
  return { product: best.candidate, confidence: best.score, method: 'none' }
}
