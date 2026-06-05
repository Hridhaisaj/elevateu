import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext, useAuthState } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import OnboardingPage from '@/pages/OnboardingPage'
import FeedPage from '@/pages/FeedPage'
import ProfilePage from '@/pages/ProfilePage'
import OpportunitiesPage from '@/pages/OpportunitiesPage'
import NewOpportunityPage from '@/pages/NewOpportunityPage'
import OpportunityDetailPage from '@/pages/OpportunityDetailPage'
import NetworkPage from '@/pages/NetworkPage'
import MessagesPage from '@/pages/MessagesPage'
import SearchPage from '@/pages/SearchPage'
import SettingsPage from '@/pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthState()
  if (loading) return <div className="flex items-center justify-center h-screen"><span className="text-text-muted text-sm">Loading…</span></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const authState = useAuthState()

  return (
    <AuthContext.Provider value={authState}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected routes */}
          <Route path="/onboarding" element={
            <RequireAuth><OnboardingPage /></RequireAuth>
          } />
          <Route element={
            <RequireAuth><AppLayout /></RequireAuth>
          }>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/opportunities/new" element={<NewOpportunityPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:userId" element={<MessagesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
