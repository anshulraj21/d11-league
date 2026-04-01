/**
 * CricAPI (cricketdata.org) integration for live match status.
 * Free tier: 100 calls/day.
 * Endpoint: https://api.cricapi.com/v1/currentMatches
 */

const API_KEY = import.meta.env.VITE_CRICKET_API_KEY || ''
const BASE_URL = 'https://api.cricapi.com/v1'

// IPL team name mappings (API names → our short names)
const TEAM_MAP = {
  'chennai super kings': 'CSK',
  'mumbai indians': 'MI',
  'royal challengers bengaluru': 'RCB',
  'royal challengers bangalore': 'RCB',
  'kolkata knight riders': 'KKR',
  'rajasthan royals': 'RR',
  'delhi capitals': 'DC',
  'sunrisers hyderabad': 'SRH',
  'punjab kings': 'PBKS',
  'gujarat titans': 'GT',
  'lucknow super giants': 'LSG',
}

function normalizeTeam(name) {
  if (!name) return ''
  const lower = name.toLowerCase().trim()
  return TEAM_MAP[lower] || name
}

/**
 * Check if CricAPI is configured.
 */
export function isApiConfigured() {
  return !!API_KEY
}

/**
 * Fetch current/recent IPL matches from CricAPI.
 * Returns array of match objects with status info.
 */
export async function fetchCurrentMatches() {
  if (!API_KEY) return []

  try {
    const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`)
    if (!res.ok) return []
    const data = await res.json()
    if (data.status !== 'success' || !data.data) return []

    // Filter to IPL matches only
    return data.data
      .filter((m) => m.series_id && (
        m.name?.toLowerCase().includes('ipl') ||
        m.series_id?.includes('ipl') ||
        m.matchType === 't20'
      ))
      .map((m) => ({
        apiId: m.id,
        name: m.name,
        status: m.status, // e.g. "Match not started", "Match Started", "Result declared", etc.
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        date: m.date,
        teams: [normalizeTeam(m.teamInfo?.[0]?.name), normalizeTeam(m.teamInfo?.[1]?.name)],
        score: m.score || [],
        matchStatus: m.status, // human-readable status text
      }))
  } catch {
    return []
  }
}

/**
 * Find the API match data that corresponds to our match (by team names and date).
 */
export function findMatchingApiMatch(ourMatch, apiMatches) {
  if (!ourMatch?.matchName || !apiMatches?.length) return null

  // Parse our match name (e.g., "CSK vs RR") into team abbreviations
  const parts = ourMatch.matchName.split(/\s+vs\s+/i).map((t) => t.trim().toUpperCase())
  if (parts.length !== 2) return null

  return apiMatches.find((am) => {
    const apiTeams = am.teams.map((t) => t.toUpperCase())
    const teamsMatch =
      (apiTeams.includes(parts[0]) && apiTeams.includes(parts[1])) ||
      (am.name?.toUpperCase().includes(parts[0]) && am.name?.toUpperCase().includes(parts[1]))
    return teamsMatch
  })
}

/**
 * Determine the effective status of a match based on API data.
 * Returns: 'live' | 'match_ended' | null (no change)
 */
export function getApiMatchStatus(apiMatch) {
  if (!apiMatch) return null

  if (apiMatch.matchStarted && !apiMatch.matchEnded) return 'live'
  if (apiMatch.matchEnded) return 'match_ended'
  return null
}
