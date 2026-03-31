import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function JoinLeaguePage() {
  const { inviteCode: paramCode } = useParams()
  const [code, setCode] = useState(paramCode || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const q = query(collection(db, 'leagues'), where('inviteCode', '==', code.toUpperCase().trim()))
      const snap = await getDocs(q)

      if (snap.empty) {
        setError('No league found with this invite code')
        setLoading(false)
        return
      }

      const leagueDoc = snap.docs[0]
      const league = leagueDoc.data()

      if (league.memberIds.includes(user.uid)) {
        navigate(`/league/${leagueDoc.id}`)
        return
      }

      await updateDoc(doc(db, 'leagues', leagueDoc.id), {
        memberIds: arrayUnion(user.uid),
        [`members.${user.uid}`]: {
          displayName: profile.displayName,
          dream11TeamName: profile.dream11TeamName,
          upiId: profile.upiId || '',
        },
      })

      navigate(`/league/${leagueDoc.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Join League</h1>

        <form onSubmit={handleSubmit} className="bg-surface-light border border-surface-lighter rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Invite Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-character code"
            maxLength={6}
            className="uppercase"
            required
          />

          <Button type="submit" className="w-full" loading={loading}>
            Join League
          </Button>
        </form>
      </div>
    </div>
  )
}
