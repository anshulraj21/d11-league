/**
 * Parse Dream11 leaderboard OCR text into structured results.
 *
 * Dream11 leaderboard rows typically look like:
 *   TeamName    T2    1089.5    #1
 *   TeamName    T3    782.5     #59,69,677
 *
 * The parser handles:
 * - Team names with or without variant suffix (T1, T2, etc.)
 * - Points as decimal numbers
 * - Ranks with # prefix and comma separators
 * - Partial/truncated team names (e.g. "Lastcom...")
 */

export function parseLeaderboardText(rawText) {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
  const results = []

  for (const line of lines) {
    const parsed = parseLine(line)
    if (parsed) results.push(parsed)
  }

  // Sort by points descending if we found results
  results.sort((a, b) => b.points - a.points)

  // Assign ranks based on sorted order
  results.forEach((r, i) => {
    r.rank = i + 1
  })

  return results
}

function parseLine(line) {
  // Remove commas from numbers for easier parsing
  const cleaned = line.replace(/(\d),(\d)/g, '$1$2')

  // Pattern: TeamName (possibly with T1/T2 suffix) ... points ... #rank
  // Try multiple patterns to handle OCR variations

  // Pattern 1: "TeamName T2 1089.5 #1"
  const p1 = cleaned.match(/^(.+?)\s+T(\d+)\s+([\d.]+)\s+#?(\d+)/)
  if (p1) {
    return {
      teamName: `${p1[1].replace(/\.{2,}$/, '').trim()} T${p1[2]}`,
      points: parseFloat(p1[3]),
      rank: parseInt(p1[4]),
    }
  }

  // Pattern 2: "TeamName 1089.5 #1" (no T-suffix)
  const p2 = cleaned.match(/^(.+?)\s+([\d.]+)\s+#?(\d+)$/)
  if (p2 && parseFloat(p2[2]) > 0) {
    return {
      teamName: p2[1].replace(/\.{2,}$/, '').trim(),
      points: parseFloat(p2[2]),
      rank: parseInt(p2[3]),
    }
  }

  // Pattern 3: "#1 TeamName 1089.5" (rank first)
  const p3 = cleaned.match(/^#?(\d+)\s+(.+?)\s+([\d.]+)$/)
  if (p3 && parseFloat(p3[3]) > 0) {
    return {
      teamName: p3[2].replace(/\.{2,}$/, '').trim(),
      points: parseFloat(p3[3]),
      rank: parseInt(p3[1]),
    }
  }

  return null
}

/**
 * Compute Levenshtein distance between two strings (case-insensitive).
 */
export function levenshtein(a, b) {
  a = a.toLowerCase()
  b = b.toLowerCase()
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/**
 * Match OCR-extracted team names to registered league members.
 * Uses fuzzy matching (Levenshtein distance) to handle OCR errors and truncation.
 *
 * Returns { matched: [...], unmatched: [...] }
 */
export function matchTeamsToMembers(ocrResults, members) {
  const matched = []
  const unmatched = []
  const usedMemberIds = new Set()

  for (const result of ocrResults) {
    let bestMatch = null
    let bestDistance = Infinity

    for (const [userId, member] of Object.entries(members)) {
      if (usedMemberIds.has(userId)) continue

      const memberName = member.dream11TeamName.toLowerCase()
      const ocrName = result.teamName.toLowerCase()

      // Check exact match first
      if (memberName === ocrName) {
        bestMatch = { userId, member }
        bestDistance = 0
        break
      }

      // Check if one contains the other (handles truncation)
      if (memberName.includes(ocrName) || ocrName.includes(memberName)) {
        const dist = Math.abs(memberName.length - ocrName.length)
        if (dist < bestDistance) {
          bestMatch = { userId, member }
          bestDistance = dist
        }
        continue
      }

      // Fuzzy match using Levenshtein
      // Compare against both full name and name without T-suffix
      const ocrBase = ocrName.replace(/\s*t\d+$/i, '')
      const dist = Math.min(
        levenshtein(memberName, ocrName),
        levenshtein(memberName, ocrBase)
      )
      if (dist < bestDistance) {
        bestMatch = { userId, member }
        bestDistance = dist
      }
    }

    // Accept match if distance is reasonable (less than 40% of name length)
    const threshold = Math.max(3, Math.floor(result.teamName.length * 0.4))
    if (bestMatch && bestDistance <= threshold) {
      usedMemberIds.add(bestMatch.userId)
      matched.push({
        ...result,
        userId: bestMatch.userId,
        displayName: bestMatch.member.displayName,
        matchedTeamName: bestMatch.member.dream11TeamName,
        confidence: bestDistance === 0 ? 'exact' : bestDistance <= 2 ? 'high' : 'low',
      })
    } else {
      unmatched.push(result)
    }
  }

  return { matched, unmatched }
}
