import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function MatchDetailPage() {
  const { leagueId, matchId } = useParams()
  const { league } = useLeague(leagueId)
  const { matches, loading } = useMatches(leagueId)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  const match = matches.find((m) => m.id === matchId)

  if (loading) return <><Navbar /><Spinner className="mt-12" /></>
  if (!match) return <><Navbar /><p className="text-center mt-12 text-text-muted">Match not found</p></>

  const hasJoined = match.joinedMembers?.includes(user.uid)
  const pool = match.entryFee * (match.joinedMembers?.length || 0)

  const handleJoin = async () => {
    setJoining(true)
    await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
      joinedMembers: arrayUnion(user.uid),
    })
    setJoining(false)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 mt-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link to={`/league/${leagueId}`} className="text-sm text-text-muted hover:text-primary-light no-underline">
              &larr; Back to league
            </Link>
            <h1 className="text-2xl font-bold mt-2">{match.matchName}</h1>
            <p className="text-text-muted text-sm mt-1">{match.date}</p>
          </div>
          <Badge variant={
            match.status === 'settled' ? 'success' :
            match.status === 'completed' ? 'accent' : 'primary'
          }>
            {match.status}
          </Badge>
        </div>

        {/* Match Info Card */}
        <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-accent">₹{match.entryFee}</p>
              <p className="text-xs text-text-muted">Entry Fee</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-light">{match.joinedMembers?.length || 0}</p>
              <p className="text-xs text-text-muted">Joined</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">₹{pool}</p>
              <p className="text-xs text-text-muted">Pool</p>
            </div>
          </div>
        </div>

        {/* Prize Breakdown */}
        <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium text-text-muted mb-2">Prize Distribution</h3>
          <div className="space-y-1">
            {match.prizeRules?.map((rule) => (
              <div key={rule.rank} className="flex justify-between text-sm">
                <span>#{rule.rank} place</span>
                <span className="text-accent font-medium">
                  ₹{Math.round((pool * rule.percentage) / 100)} ({rule.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Joined Members */}
        <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium text-text-muted mb-2">Joined Players</h3>
          <div className="flex flex-wrap gap-2">
            {match.joinedMembers?.map((uid) => (
              <span key={uid} className="bg-surface-lighter px-3 py-1 rounded-full text-sm">
                {league?.members?.[uid]?.displayName || uid}
              </span>
            ))}
          </div>
        </div>

        {/* Results (if completed) */}
        {match.results?.length > 0 && (
          <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden mb-4">
            <h3 className="text-sm font-medium text-text-muted p-4 pb-2">Results</h3>
            {match.results.sort((a, b) => a.rank - b.rank).map((r, i) => (
              <div
                key={r.userId}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < match.results.length - 1 ? 'border-b border-surface-lighter' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${r.rank <= 3 ? 'text-accent' : 'text-text-muted'}`}>
                    #{r.rank}
                  </span>
                  <div>
                    <p className="font-medium">{r.displayName || league?.members?.[r.userId]?.displayName}</p>
                    <p className="text-xs text-text-muted">{r.dream11TeamName}</p>
                  </div>
                </div>
                <span className="font-semibold">{r.points} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Screenshot */}
        {match.screenshotUrl && (
          <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-text-muted mb-2">Dream11 Screenshot</h3>
            <img src={match.screenshotUrl} alt="D11 Leaderboard" className="w-full rounded-lg" />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {match.status === 'open' && !hasJoined && (
            <Button className="w-full" loading={joining} onClick={handleJoin}>
              Join Match (₹{match.entryFee})
            </Button>
          )}

          {match.status === 'open' && hasJoined && (
            <Button className="w-full" variant="secondary" onClick={() => navigate(`/league/${leagueId}/match/${matchId}/upload`)}>
              Upload Results
            </Button>
          )}

          {(match.status === 'completed' || match.status === 'settled') && (
            <Button className="w-full" variant={match.status === 'settled' ? 'success' : 'primary'} onClick={() => navigate(`/league/${leagueId}/match/${matchId}/settle`)}>
              View Settlement
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
