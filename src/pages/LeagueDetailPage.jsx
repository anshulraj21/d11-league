import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { copyToClipboard } from '../lib/upi'

const tabs = ['Matches', 'Members', 'Standings']

export default function LeagueDetailPage() {
  const { leagueId } = useParams()
  const { league, loading } = useLeague(leagueId)
  const { matches, loading: matchesLoading } = useMatches(leagueId)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Matches')
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  if (loading) return <><Navbar /><Spinner className="mt-12" /></>
  if (!league) return <><Navbar /><p className="text-center mt-12 text-text-muted">League not found</p></>

  const handleCopyCode = async () => {
    await copyToClipboard(league.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <Button size="sm" onClick={() => navigate(`/league/${leagueId}/match/create`)}>+ New Match</Button>
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

function MatchesTab({ matches, loading, leagueId }) {
  if (loading) return <Spinner className="mt-8" />

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No matches yet. Create one to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <Link
          key={match.id}
          to={`/league/${leagueId}/match/${match.id}`}
          className="block bg-surface-light border border-surface-lighter rounded-xl p-4 hover:border-primary/50 transition-colors no-underline"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text">{match.matchName}</h3>
              <p className="text-sm text-text-muted mt-1">
                Entry: ₹{match.entryFee} &middot; {match.joinedMembers?.length || 0} joined
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
