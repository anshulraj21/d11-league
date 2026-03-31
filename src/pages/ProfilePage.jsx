import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth()
  const [form, setForm] = useState({ displayName: '', dream11TeamName: '', upiId: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        dream11TeamName: profile.dream11TeamName || '',
        upiId: profile.upiId || '',
      })
    }
  }, [profile])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <form onSubmit={handleSave} className="bg-surface-light border border-surface-lighter rounded-xl p-6 space-y-4">
          <Input
            label="Your Name"
            value={form.displayName}
            onChange={update('displayName')}
            required
          />
          <Input
            label="Dream11 Team Name"
            value={form.dream11TeamName}
            onChange={update('dream11TeamName')}
            required
          />
          <Input
            label="UPI ID"
            value={form.upiId}
            onChange={update('upiId')}
            placeholder="name@okaxis"
          />

          <Button type="submit" loading={saving} className="w-full">
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  )
}
