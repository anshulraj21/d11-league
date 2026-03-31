import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        setProfile(snap.exists() ? snap.data() : null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const register = async (email, password, profileData) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const userData = {
      displayName: profileData.displayName,
      email,
      dream11TeamName: profileData.dream11TeamName,
      upiId: profileData.upiId || '',
      createdAt: new Date(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), userData)
    setProfile(userData)
    return cred
  }

  const logout = () => signOut(auth)

  const updateProfile = async (data) => {
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), data)
    setProfile((prev) => ({ ...prev, ...data }))
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
