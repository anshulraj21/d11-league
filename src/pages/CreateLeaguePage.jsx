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

          <p className="text-sm text-text-muted">
            An invite code will be generated that you can share with friends.
          </p>

          <Button type="submit" className="w-full" loading={loading}>
            Create League
          </Button>
        </form>
      </div>
    </div>
  )
}
