import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, updateDoc, collection, addDoc, writeBatch } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import { useSettlements } from '../hooks/useSettlements'
import { useAuth } from '../contexts/AuthContext'
import { generateSettlements } from '../lib/settlement'
import { generateUpiLink, isMobile, copyToClipboard } from '../lib/upi'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'

export default function SettlementPage() {
  const { leagueId, matchId } = useParams()
  const { league } = useLeague(leagueId)
  const { matches, loading: matchLoading } = useMatches(leagueId)
  const { settlements: existingSettlements, loading: settLoading } = useSettlements(leagueId, matchId)
  const { user } = useAuth()
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const match = matches.find((m) => m.id === matchId)

  if (matchLoading || settLoading) return <><Navbar /><Spinner className="mt-12" /></>
  if (!match) return <><Navbar /><p className="text-center mt-12 text-text-muted">Match not found</p></>

  const members = league?.members || {}
  const pool = match.entryFee * (match.joinedMembers?.length || 0)

  const handleGenerate = async () => {
    setGenerating(true)

    const results = match.results.map((r) => ({
      ...r,
      displayName: r.displayName || members[r.userId]?.displayName || 'Unknown',
    }))

    const { settlements } = generateSettlements(results, match.entryFee, match.prizeRules)

    const batch = writeBatch(db)
    const settlementsRef = collection(db, 'leagues', leagueId, 'matches', matchId, 'settlements')

    for (const s of settlements) {
      const toMember = members[s.to.userId]
      const upiLink = toMember?.upiId
        ? generateUpiLink({
            upiId: toMember.upiId,
            payeeName: s.to.displayName,
            amount: s.amount,
            note: `${match.matchName} settlement`,
          })
        : ''

      const docRef = doc(settlementsRef)
      batch.set(docRef, {
        fromUserId: s.from.userId,
        fromName: s.from.displayName,
        toUserId: s.to.userId,
        toName: s.to.displayName,
        amount: s.amount,
        upiLink,
        status: 'pending',
        createdAt: new Date(),
        paidAt: null,
      })
    }

    await batch.commit()
    // Don't mark as 'settled' yet — only when all payments are confirmed
    setGenerating(false)
  }

  const handleMarkPaid = async (settlementId) => {
    await updateDoc(
      doc(db, 'leagues', leagueId, 'matches', matchId, 'settlements', settlementId),
      { status: 'paid', paidAt: new Date() }
    )

    // Check if ALL settlements are now paid → mark match as settled
    const remaining = existingSettlements.filter(
      (s) => s.id !== settlementId && s.status === 'pending'
    )
    if (remaining.length === 0) {
      await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
        status: 'settled',
      })
    }
  }

  const handleCopyUpi = async (upiId, id) => {
    await copyToClipboard(upiId)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-lg mx-auto p-4 mt-4">
        <Link to={`/league/${leagueId}/match/${matchId}`} className="text-sm text-text-muted hover:text-primary-light no-underline">
          &larr; Back to match
        </Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">Settlement</h1>
        <p className="text-text-muted text-sm mb-6">{match.matchName} &middot; Pool: ₹{pool}</p>

        {/* Prize Winners */}
        {match.results?.length > 0 && (
          <div className="bg-surface-light border border-surface-lighter rounded-xl p-4 mb-4">
            <h3 className="text-sm font-medium text-text-muted mb-2">Winners</h3>
            {match.prizeRules?.map((rule) => {
              const winner = match.results.find((r) => r.rank === rule.rank)
              const prizeAmt = Math.round((pool * rule.percentage) / 100)
              return winner ? (
                <div key={rule.rank} className="flex justify-between py-1">
                  <span>
                    <span className="text-accent font-bold">#{rule.rank}</span>{' '}
                    {winner.displayName || members[winner.userId]?.displayName}
                  </span>
                  <span className="text-success font-semibold">₹{prizeAmt}</span>
                </div>
              ) : null
            })}
          </div>
        )}

        {/* Generate Settlements */}
        {existingSettlements.length === 0 && match.status === 'completed' && (
          <Button className="w-full mb-4" onClick={handleGenerate} loading={generating}>
            Generate Settlements
          </Button>
        )}

        {/* Settlement List */}
        {existingSettlements.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Payments</h3>
            {existingSettlements.map((s) => (
              <div
                key={s.id}
                className="bg-surface-light border border-surface-lighter rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <span className="font-medium">{s.fromName}</span>
                    <span className="text-text-muted"> pays </span>
                    <span className="font-medium">{s.toName}</span>
                  </div>
                  <Badge variant={s.status === 'paid' ? 'success' : 'accent'}>
                    {s.status}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-accent mb-3">₹{s.amount}</p>

                {s.status === 'pending' && (
                  <div className="flex gap-2">
                    {/* Pay via UPI — only visible to the payer */}
                    {s.fromUserId === user.uid && s.upiLink && isMobile() && (
                      <a href={s.upiLink} className="flex-1">
                        <Button size="sm" className="w-full">Pay via UPI</Button>
                      </a>
                    )}
                    {s.fromUserId === user.uid && s.upiLink && !isMobile() && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          const upiId = new URLSearchParams(s.upiLink.split('?')[1]).get('pa')
                          handleCopyUpi(upiId, s.id)
                        }}
                      >
                        {copiedId === s.id ? 'Copied!' : 'Copy UPI ID'}
                      </Button>
                    )}
                    {/* Mark Paid — only visible to the receiver */}
                    {s.toUserId === user.uid && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleMarkPaid(s.id)}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
