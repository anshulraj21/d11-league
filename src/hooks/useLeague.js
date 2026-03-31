import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

export function useLeague(leagueId) {
  const [league, setLeague] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueId) return

    const unsub = onSnapshot(doc(db, 'leagues', leagueId), (snap) => {
      setLeague(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    })

    return unsub
  }, [leagueId])

  return { league, loading }
}
