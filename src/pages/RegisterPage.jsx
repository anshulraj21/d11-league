import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    dream11TeamName: '',
    upiId: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.email, form.password, {
        displayName: form.displayName,
        dream11TeamName: form.dream11TeamName,
        upiId: form.upiId,
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-light">D11 League</h1>
          <p className="text-text-muted mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-light border border-surface-lighter rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-center">Register</h2>

          {error && (
            <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Your Name"
            value={form.displayName}
            onChange={update('displayName')}
            placeholder="Anshu"
            required
          />
          <Input
            label="Dream11 Team Name"
            value={form.dream11TeamName}
            onChange={update('dream11TeamName')}
            placeholder="Your team name on Dream11"
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="UPI ID (optional)"
            value={form.upiId}
            onChange={update('upiId')}
            placeholder="name@okaxis"
          />

          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-light hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
