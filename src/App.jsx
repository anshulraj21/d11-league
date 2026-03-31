import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import CreateLeaguePage from './pages/CreateLeaguePage'
import JoinLeaguePage from './pages/JoinLeaguePage'
import LeagueDetailPage from './pages/LeagueDetailPage'
import CreateMatchPage from './pages/CreateMatchPage'
import MatchDetailPage from './pages/MatchDetailPage'
import UploadResultsPage from './pages/UploadResultsPage'
import SettlementPage from './pages/SettlementPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="/league/create" element={<ProtectedRoute><CreateLeaguePage /></ProtectedRoute>} />
          <Route path="/league/join/:inviteCode?" element={<ProtectedRoute><JoinLeaguePage /></ProtectedRoute>} />
          <Route path="/league/:leagueId" element={<ProtectedRoute><LeagueDetailPage /></ProtectedRoute>} />

          <Route path="/league/:leagueId/match/create" element={<ProtectedRoute><CreateMatchPage /></ProtectedRoute>} />
          <Route path="/league/:leagueId/match/:matchId" element={<ProtectedRoute><MatchDetailPage /></ProtectedRoute>} />
          <Route path="/league/:leagueId/match/:matchId/upload" element={<ProtectedRoute><UploadResultsPage /></ProtectedRoute>} />
          <Route path="/league/:leagueId/match/:matchId/settle" element={<ProtectedRoute><SettlementPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
