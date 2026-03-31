import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const DEFAULT_PRIZE_RULES = [
  { rank: 1, percentage: 60 },
  { rank: 2, percentage: 25 },
  { rank: 3, percentage: 15 },
]

export default function CreateMatchPage() {
  const { leagueId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    matchName: '',
    entryFee: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [prizeRules, setPrizeRules] = useState(DEFAULT_PRIZE_RULES)

  const updateForm = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const updatePrize = (index, field) => (e) => {
    const updated = [...prizeRules]
    updated[index] = { ...updated[index], [field]: parseInt(e.target.value) || 0 }
    setPrizeRules(updated)
  }

  const addPrizeSlot = () => {
    setPrizeRules([...prizeRules, { rank: prizeRules.length + 1, percentage: 0 }])
  }

  const removePrizeSlot = (index) => {
    const updated = prizeRules.filter((_, i) => i !== index)
    // Reindex ranks
    updated.forEach((r, i) => { r.rank = i + 1 })
    setPrizeRules(updated)
  }

  const totalPercentage = prizeRules.reduce((sum, r) => sum + r.percentage, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (totalPercentage !== 100) return
    setLoading(true)

    await addDoc(collection(db, 'leagues', leagueId, 'matches'), {
      matchName: form.matchName,
      entryFee: parseInt(form.entryFee),
      date: form.date,
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
          <Input
            label="Entry Fee (₹)"
            type="number"
            value={form.entryFee}
            onChange={updateForm('entryFee')}
            placeholder="100"
            min="0"
            required
          />

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

          <Button type="submit" className="w-full" loading={loading} disabled={totalPercentage !== 100}>
            Create Match
          </Button>
        </form>
      </div>
    </div>
  )
}
