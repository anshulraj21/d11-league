import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  doc, updateDoc, collection, query, orderBy, onSnapshot, addDoc, runTransaction,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'

export default function MatchDetailPage() {
  const { leagueId, matchId } = useParams()
  const { league } = useLeague(leagueId)
  const { matches, loading } = useMatches(leagueId)
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualResults, setManualResults] = useState([])
  const [saving, setSaving] = useState(false)

  // Audit history
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const match = matches.find((m) => m.id === matchId)

  // Listen to history subcollection
  useEffect(() => {
    if (!leagueId || !matchId) return
    const q = query(
      collection(db, 'leagues', leagueId, 'matches', matchId, 'history'),
      orderBy('timestamp', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, () => {
      // Ignore permission errors for history subcollection
    })
    return unsub
  }, [leagueId, matchId])

  if (loading) return <><Navbar /><Spinner className="mt-12" /></>
  if (!match) return <><Navbar /><p className="text-center mt-12 text-text-muted">Match not found</p></>

  const hasJoined = match.joinedMembers?.includes(user.uid)
  const pool = match.entryFee * (match.joinedMembers?.length || 0)
  const isFull = match.maxPlayers && match.joinedMembers?.length >= match.maxPlayers
  const hasResults = match.results?.length > 0
  const canEditResults = match.status !== 'settled'

  const handleJoin = async () => {
    if (isFull) return
    setJoining(true)
    try {
      const matchRef = doc(db, 'leagues', leagueId, 'matches', matchId)
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(matchRef)
        const data = snap.data()
        if (data.maxPlayers && data.joinedMembers.length >= data.maxPlayers) {
          throw new Error('Match is full')
        }
        if (data.joinedMembers.includes(user.uid)) return
        transaction.update(matchRef, { joinedMembers: [...data.joinedMembers, user.uid] })
      })
    } catch (err) {
      console.error('Join error:', err)
    }
    setJoining(false)
  }

  // Manual entry handlers
  const openManualEntry = () => {
    const members = match.joinedMembers || []
    setManualResults(
      members.map((uid) => {
        const existing = match.results?.find((r) => r.userId === uid)
        return {
          userId: uid,
          displayName: league?.members?.[uid]?.displayName || '',
          dream11TeamName: league?.members?.[uid]?.dream11TeamName || '',
          points: existing ? String(existing.points) : '',
        }
      })
    )
    setShowManualEntry(true)
  }

  const updateManualResult = (index, value) => {
    const updated = [...manualResults]
    updated[index] = { ...updated[index], points: value }
    setManualResults(updated)
  }

  const handleSaveManualResults = async () => {
    setSaving(true)
    const results = manualResults
      .filter((r) => r.points !== '')
      .map((r) => ({
        userId: r.userId,
        displayName: r.displayName,
        dream11TeamName: r.dream11TeamName,
        points: parseFloat(r.points),
        rank: 0,
      }))
      .sort((a, b) => b.points - a.points)
      .map((r, i) => ({ ...r, rank: i + 1 }))

    // Write audit history
    await addDoc(collection(db, 'leagues', leagueId, 'matches', matchId, 'history'), {
      changedBy: { userId: user.uid, displayName: profile?.displayName || user.email },
      timestamp: new Date(),
      action: hasResults ? 'results_updated' : 'results_added',
      previousResults: match.results || [],
      newResults: results,
    })

    // Update match
    await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
      results,
      status: 'completed',
    })

    setSaving(false)
    setShowManualEntry(false)
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
              <p className="text-2xl font-bold text-primary-light">
                {match.joinedMembers?.length || 0}{match.maxPlayers ? `/${match.maxPlayers}` : ''}
              </p>
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
        {hasResults && (
          <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="text-sm font-medium text-text-muted">Results</h3>
              {canEditResults && (
                <button
                  onClick={openManualEntry}
                  className="text-xs text-primary-light hover:underline cursor-pointer bg-transparent border-none"
                >
                  Edit Results
                </button>
              )}
            </div>
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

        {/* Change History */}
        {history.length > 0 && (
          <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-sm font-medium text-text-muted cursor-pointer bg-transparent border-none text-left"
            >
              <span>Change History ({history.length})</span>
              <span>{showHistory ? '▲' : '▼'}</span>
            </button>
            {showHistory && (
              <div className="mt-3 space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="bg-surface rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{h.changedBy?.displayName || 'Unknown'}</span>
                      <span className="text-xs text-text-muted">
                        {h.timestamp?.toDate ? h.timestamp.toDate().toLocaleString() : new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant={h.action === 'results_added' ? 'success' : 'accent'}>
                      {h.action === 'results_added' ? 'Results Added' : 'Results Updated'}
                    </Badge>
                    {h.action === 'results_updated' && h.previousResults?.length > 0 && (
                      <div className="mt-2 text-xs text-text-muted space-y-0.5">
                        {h.newResults?.map((nr) => {
                          const prev = h.previousResults.find((p) => p.userId === nr.userId)
                          const changed = prev && prev.points !== nr.points
                          return (
                            <p key={nr.userId} className={changed ? 'text-accent' : ''}>
                              {nr.displayName}: {prev ? `${prev.points} → ` : ''}{nr.points} pts
                            </p>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {match.status === 'open' && !hasJoined && !isFull && (
            <Button className="w-full" loading={joining} onClick={handleJoin}>
              Join Match (₹{match.entryFee})
            </Button>
          )}

          {match.status === 'open' && !hasJoined && isFull && (
            <Button className="w-full" disabled>
              Match Full ({match.joinedMembers?.length}/{match.maxPlayers})
            </Button>
          )}

          {match.status === 'open' && hasJoined && (
            <>
              <Button className="w-full" variant="secondary" onClick={() => navigate(`/league/${leagueId}/match/${matchId}/upload`)}>
                Upload Screenshot + OCR
              </Button>
              <Button className="w-full" variant="ghost" onClick={openManualEntry}>
                {hasResults ? 'Edit Results' : 'Add Results Manually'}
              </Button>
            </>
          )}

          {(match.status === 'completed' || match.status === 'settled') && (
            <Button className="w-full" variant={match.status === 'settled' ? 'success' : 'primary'} onClick={() => navigate(`/league/${leagueId}/match/${matchId}/settle`)}>
              View Settlement
            </Button>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal open={showManualEntry} onClose={() => setShowManualEntry(false)} title={hasResults ? 'Edit Results' : 'Enter Results Manually'}>
        <div className="space-y-3">
          {manualResults.map((r, i) => (
            <div key={r.userId} className="bg-surface rounded-lg p-3">
              <p className="text-sm font-medium mb-1.5">
                {r.displayName} <span className="text-text-muted">({r.dream11TeamName})</span>
              </p>
              <input
                type="number"
                placeholder="Points"
                value={r.points}
                onChange={(e) => updateManualResult(i, e.target.value)}
                step="0.5"
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}
          <Button className="w-full" onClick={handleSaveManualResults} loading={saving}>
            Save Results
          </Button>
        </div>
      </Modal>
    </div>
  )
}
