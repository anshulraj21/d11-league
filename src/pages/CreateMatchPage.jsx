import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const WINNER_PRESETS = {
  1: [{ rank: 1, percentage: 100 }],
  2: [{ rank: 1, percentage: 70 }, { rank: 2, percentage: 30 }],
  3: [{ rank: 1, percentage: 60 }, { rank: 2, percentage: 25 }, { rank: 3, percentage: 15 }],
  4: [{ rank: 1, percentage: 50 }, { rank: 2, percentage: 25 }, { rank: 3, percentage: 15 }, { rank: 4, percentage: 10 }],
}

function generateEvenSplit(n) {
  const base = Math.floor(100 / n)
  const remainder = 100 % n
  return Array.from({ length: n }, (_, i) => ({
    rank: i + 1,
    percentage: i === 0 ? base + remainder : base,
  }))
}

export default function CreateMatchPage() {
  const { leagueId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    matchName: '',
    entryFee: '',
    maxPlayers: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [numWinners, setNumWinners] = useState(3)
  const [prizeRules, setPrizeRules] = useState(WINNER_PRESETS[3])

  const updateForm = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleWinnerCountChange = (n) => {
    setNumWinners(n)
    setPrizeRules(WINNER_PRESETS[n] || generateEvenSplit(n))
  }

  const updatePrize = (index, field) => (e) => {
    const updated = [...prizeRules]
    updated[index] = { ...updated[index], [field]: parseInt(e.target.value) || 0 }
    setPrizeRules(updated)
  }

  const addPrizeSlot = () => {
    const newNum = prizeRules.length + 1
    setNumWinners(newNum)
    setPrizeRules([...prizeRules, { rank: newNum, percentage: 0 }])
  }

  const removePrizeSlot = (index) => {
    if (prizeRules.length <= 1) return
    const updated = prizeRules.filter((_, i) => i !== index)
    updated.forEach((r, i) => { r.rank = i + 1 })
    setNumWinners(updated.length)
    setPrizeRules(updated)
  }

  const totalPercentage = prizeRules.reduce((sum, r) => sum + r.percentage, 0)
  const maxPlayers = parseInt(form.maxPlayers) || 0
  const winnersExceedPlayers = maxPlayers > 0 && prizeRules.length >= maxPlayers
  const maxPlayersInvalid = form.maxPlayers !== '' && maxPlayers < 2
  const canSubmit = totalPercentage === 100 && !winnersExceedPlayers && !maxPlayersInvalid

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)

    await addDoc(collection(db, 'leagues', leagueId, 'matches'), {
      matchName: form.matchName,
      entryFee: parseInt(form.entryFee),
      date: form.date,
      maxPlayers: maxPlayers >= 2 ? maxPlayers : null,
      prizeRules,
      joinedMembers: [user.uid],
      results: [],
      screenshotUrl: '',
      ocrRawText: '',
      status: 'open',
      addedBy: user.uid,
      createdAt: new Date(),
    })

    navigate(`/league/${leagueId}`)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Create Match</h1>

        <form onSubmit={handleSubmit} className="bg-surface-light border border-surface-lighter rounded-xl p-6 space-y-4">
          <Input
            label="Match Name"
            value={form.matchName}
            onChange={updateForm('matchName')}
            placeholder="MI vs CSK"
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={updateForm('date')}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Entry Fee (₹)"
              type="number"
              value={form.entryFee}
              onChange={updateForm('entryFee')}
              placeholder="100"
              min="0"
              required
            />
            <Input
              label="Max Players"
              type="number"
              value={form.maxPlayers}
              onChange={updateForm('maxPlayers')}
              placeholder="No limit"
              min="2"
              error={maxPlayersInvalid ? 'Min 2 players' : ''}
            />
          </div>

          {/* Number of Winners */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Number of Winners
            </label>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleWinnerCountChange(n)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border
                    ${numWinners === n
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-surface-lighter text-text-muted hover:border-primary/50'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {winnersExceedPlayers && (
              <p className="text-sm text-danger mb-2">Winners must be less than max players ({maxPlayers})</p>
            )}
          </div>

          {/* Prize Distribution */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Prize Distribution
            </label>
            <div className="space-y-2">
              {prizeRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-text-muted w-16">#{rule.rank}</span>
                  <input
                    type="number"
                    value={rule.percentage}
                    onChange={updatePrize(i, 'percentage')}
                    className="w-20 px-2 py-1 bg-surface border border-surface-lighter rounded text-text text-sm"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-text-muted">%</span>
                  {prizeRules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePrizeSlot(i)}
                      className="text-danger text-sm hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={addPrizeSlot}
                className="text-sm text-primary-light hover:underline cursor-pointer bg-transparent border-none"
              >
                + Add winner slot
              </button>
              <span className={`text-sm font-medium ${totalPercentage === 100 ? 'text-success' : 'text-danger'}`}>
                Total: {totalPercentage}%
              </span>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading} disabled={!canSubmit}>
            Create Match
          </Button>
        </form>
      </div>
    </div>
  )
}
