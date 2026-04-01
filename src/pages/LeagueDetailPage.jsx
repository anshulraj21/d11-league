import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { copyToClipboard } from '../lib/upi'
import { getMissingMatches } from '../lib/iplSchedule'

const tabs = ['Matches', 'Members', 'Standings']

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const { league, loading } = useLeague(leagueId)
  const { matches, loading: matchesLoading } = useMatches(leagueId)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Matches')
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [scheduleLoaded, setScheduleLoaded] = useState(false)

  if (loading) return <><Navbar /><Spinner className="mt-12" /></>
  if (!league) return <><Navbar /><p className="text-center mt-12 text-text-muted">League not found</p></>

  const handleCopyCode = async () => {
    await copyToClipboard(league.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const defaults = league.defaults || { entryFee: 30, maxPlayers: 10, winners: 3 }
  const WINNER_PRESETS = {
    1: [{ rank: 1, percentage: 100 }],
    2: [{ rank: 1, percentage: 70 }, { rank: 2, percentage: 30 }],
    3: [{ rank: 1, percentage: 60 }, { rank: 2, percentage: 25 }, { rank: 3, percentage: 15 }],
    4: [{ rank: 1, percentage: 50 }, { rank: 2, percentage: 25 }, { rank: 3, percentage: 15 }, { rank: 4, percentage: 10 }],
  }

  const handleLoadIPLSchedule = async () => {
    setLoadingSchedule(true)
    const existingNames = matches.map((m) => m.matchName)
    const missing = getMissingMatches(existingNames)

    const w = defaults.winners || 3
    const prizeRules = WINNER_PRESETS[w] || WINNER_PRESETS[3]

    for (const m of missing) {
      await addDoc(collection(db, 'leagues', leagueId, 'matches'), {
        matchName: m.teams,
        entryFee: defaults.entryFee || 30,
        date: m.date,
        maxPlayers: defaults.maxPlayers || 10,
        prizeRules,
        joinedMembers: [],
        results: [],
        screenshotUrl: '',
        ocrRawText: '',
        status: 'open',
        addedBy: user.uid,
        createdAt: new Date(),
      })
    }

    setLoadingSchedule(false)
    setScheduleLoaded(true)
    setTimeout(() => setScheduleLoaded(false), 3000)
  }

  // Calculate standings from all completed matches
  const standings = computeStandings(matches, league.members)

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 mt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            <button
              onClick={handleCopyCode}
              className="text-sm text-text-muted hover:text-primary-light mt-1 cursor-pointer bg-transparent border-none"
            >
              Invite: {league.inviteCode} {copied ? '(Copied!)' : '(Click to copy)'}
            </button>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={handleLoadIPLSchedule} loading={loadingSchedule}>
              {scheduleLoaded ? 'Loaded!' : 'Load IPL Schedule'}
            </Button>
            <Button size="sm" onClick={() => navigate(`/league/${leagueId}/match/create`)}>+ New Match</Button>
          </div>
        </div>

        {/* League Defaults Info */}
        <div className="flex gap-3 mb-4 text-xs text-text-muted">
          <span>Default: ₹{defaults.entryFee}/match</span>
          <span>&middot;</span>
          <span>{defaults.maxPlayers} players</span>
          <span>&middot;</span>
          <span>{defaults.winners} winners</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-lighter mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent
                ${activeTab === tab
                  ? 'border-primary text-primary-light'
                  : 'border-transparent text-text-muted hover:text-text'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'Matches' && (
          <MatchesTab matches={matches} loading={matchesLoading} leagueId={leagueId} />
        )}
        {activeTab === 'Members' && (
          <MembersTab members={league.members} />
        )}
        {activeTab === 'Standings' && (
          <StandingsTab standings={standings} />
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function MatchesTab({ matches, loading, leagueId }) {
  if (loading) return <Spinner className="mt-8" />

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No matches yet. Create one or load the IPL schedule!</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  // Group matches by date
  const grouped = {}
  for (const match of matches) {
    const date = match.date || 'Unknown'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(match)
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, dateMatches]) => {
        const isToday = date === today
        return (
          <div key={date}>
            <div className={`flex items-center gap-2 mb-2 ${isToday ? 'text-accent' : 'text-text-muted'}`}>
              <span className="text-xs font-semibold uppercase tracking-wide">
                {formatDate(date)}
              </span>
              {isToday && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                  TODAY
                </span>
              )}
            </div>
            <div className="space-y-2">
              {dateMatches.map((match) => (
                <Link
                  key={match.id}
                  to={`/league/${leagueId}/match/${match.id}`}
                  className={`block rounded-xl p-4 hover:border-primary/50 transition-colors no-underline border
                    ${isToday
                      ? 'bg-accent/5 border-accent/30'
                      : 'bg-surface-light border-surface-lighter'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-text">{match.matchName}</h3>
                      <p className="text-sm text-text-muted mt-1">
                        ₹{match.entryFee} &middot; {match.joinedMembers?.length || 0}{match.maxPlayers ? `/${match.maxPlayers}` : ''} joined
                      </p>
                    </div>
                    <Badge variant={
                      match.status === 'settled' ? 'success' :
                      match.status === 'completed' ? 'accent' : 'primary'
                    }>
                      {match.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MembersTab({ members }) {
  const memberList = Object.entries(members || {})

  return (
    <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden">
      {memberList.map(([uid, m], i) => (
        <div
          key={uid}
          className={`flex items-center justify-between p-4 ${
            i < memberList.length - 1 ? 'border-b border-surface-lighter' : ''
          }`}
        >
          <div>
            <p className="font-medium">{m.displayName}</p>
            <p className="text-sm text-text-muted">D11: {m.dream11TeamName}</p>
          </div>
          {m.upiId && (
            <span className="text-xs text-text-muted bg-surface-lighter px-2 py-1 rounded">
              {m.upiId}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function StandingsTab({ standings }) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No completed matches yet</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-2 p-3 text-sm font-medium text-text-muted border-b border-surface-lighter">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Matches</span>
        <span className="text-right">Earnings</span>
      </div>
      {standings.map((s, i) => (
        <div
          key={s.userId}
          className={`grid grid-cols-[auto_1fr_auto_auto] gap-2 p-3 items-center text-sm
            ${i < standings.length - 1 ? 'border-b border-surface-lighter' : ''}`}
        >
          <span className={`font-bold ${i < 3 ? 'text-accent' : 'text-text-muted'}`}>
            {i + 1}
          </span>
          <span className="font-medium">{s.displayName}</span>
          <span className="text-right text-text-muted">{s.matchesPlayed}</span>
          <span className={`text-right font-semibold ${s.earnings >= 0 ? 'text-success' : 'text-danger'}`}>
            {s.earnings >= 0 ? '+' : ''}₹{s.earnings}
          </span>
        </div>
      ))}
    </div>
  )
}

function computeStandings(matches, members) {
  const stats = {}

  // Initialize all members
  for (const [uid, m] of Object.entries(members || {})) {
    stats[uid] = { userId: uid, displayName: m.displayName, earnings: 0, matchesPlayed: 0, wins: 0 }
  }

  // Process completed/settled matches
  for (const match of matches) {
    if (match.status !== 'completed' && match.status !== 'settled') continue
    if (!match.results?.length) continue

    const pool = match.entryFee * (match.joinedMembers?.length || 0)
    const prizeMap = {}
    for (const rule of (match.prizeRules || [])) {
      prizeMap[rule.rank] = Math.round((pool * rule.percentage) / 100)
    }

    for (const r of match.results) {
      if (!stats[r.userId]) continue
      stats[r.userId].matchesPlayed++
      const prize = prizeMap[r.rank] || 0
      stats[r.userId].earnings += prize - match.entryFee
      if (r.rank === 1) stats[r.userId].wins++
    }
  }

  return Object.values(stats).sort((a, b) => b.earnings - a.earnings)
}
