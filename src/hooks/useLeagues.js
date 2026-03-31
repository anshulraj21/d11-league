import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useLeagues() {
  const { user } = useAuth()
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLeagues([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'leagues'),
      where('memberIds', 'array-contains', user.uid)
    )

    const unsub = onSnapshot(q, (snap) => {
      setLeagues(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsub
  }, [user])

  return { leagues, loading }
}
