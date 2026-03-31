import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { useLeagues } from '../hooks/useLeagues'

export default function DashboardPage() {
  const { leagues, loading } = useLeagues()
  const navigate = useNavigate()

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Leagues</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/league/join')}>Join League</Button>
            <Button size="sm" onClick={() => navigate('/league/create')}>Create League</Button>
          </div>
        </div>

        {loading ? (
          <Spinner className="mt-12" />
        ) : leagues.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="text-lg mb-2">No leagues yet</p>
            <p className="text-sm">Create a league or join one with an invite code</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                to={`/league/${league.id}`}
                className="block bg-surface-light border border-surface-lighter rounded-xl p-4 hover:border-primary/50 transition-colors no-underline"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text">{league.name}</h3>
                    <p className="text-sm text-text-muted mt-1">
                      {league.memberIds?.length || 0} members
                    </p>
                  </div>
                  <Badge variant="primary">
                    {league.memberIds?.length || 0} players
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
