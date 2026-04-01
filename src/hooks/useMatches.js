import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

export function useMatches(leagueId) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueId) return

    const q = query(
      collection(db, 'leagues', leagueId, 'matches'),
      orderBy('date', 'asc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [leagueId])

  return { matches, loading }
}
