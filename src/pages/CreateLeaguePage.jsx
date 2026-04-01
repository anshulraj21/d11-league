import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CreateLeaguePage() {
  const [name, setName] = useState('')
  const [defaultEntryFee, setDefaultEntryFee] = useState('30')
  const [defaultMaxPlayers, setDefaultMaxPlayers] = useState('10')
  const [defaultWinners, setDefaultWinners] = useState('3')
  const [loading, setLoading] = useState(false)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const inviteCode = generateInviteCode()
    const leagueRef = await addDoc(collection(db, 'leagues'), {
      name,
      inviteCode,
      createdBy: user.uid,
      memberIds: [user.uid],
      members: {
        [user.uid]: {
          displayName: profile.displayName,
          dream11TeamName: profile.dream11TeamName,
          upiId: profile.upiId || '',
        },
      },
      defaults: {
        entryFee: parseInt(defaultEntryFee) || 30,
        maxPlayers: parseInt(defaultMaxPlayers) || 10,
        winners: parseInt(defaultWinners) || 3,
      },
      createdAt: new Date(),
    })

    navigate(`/league/${leagueRef.id}`)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Create League</h1>

        <form onSubmit={handleSubmit} className="bg-surface-light border border-surface-lighter rounded-xl p-6 space-y-4">
          <Input
            label="League Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bros IPL 2026"
            required
          />

          <p className="text-xs text-text-muted">Default settings for auto-created matches:</p>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Entry Fee (₹)"
              type="number"
              value={defaultEntryFee}
              onChange={(e) => setDefaultEntryFee(e.target.value)}
              min="0"
            />
            <Input
              label="Max Players"
              type="number"
              value={defaultMaxPlayers}
              onChange={(e) => setDefaultMaxPlayers(e.target.value)}
              min="2"
            />
            <Input
              label="Winners"
              type="number"
              value={defaultWinners}
              onChange={(e) => setDefaultWinners(e.target.value)}
              min="1"
            />
          </div>

          <p className="text-sm text-text-muted">
            An invite code will be generated. You can load the full IPL 2026 schedule after creation.
          </p>

          <Button type="submit" className="w-full" loading={loading}>
            Create League
          </Button>
        </form>
      </div>
    </div>
  )
}
