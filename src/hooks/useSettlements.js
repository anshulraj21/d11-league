import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

export function useSettlements(leagueId, matchId) {
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leagueId || !matchId) return

    const q = query(
      collection(db, 'leagues', leagueId, 'matches', matchId, 'settlements'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setSettlements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [leagueId, matchId])

  return { settlements, loading }
}
