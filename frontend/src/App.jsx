import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Machines from './pages/Machines'
import Workers from './pages/Workers'
import Production from './pages/Production'
import Onboarding from './pages/Onboarding'
import ScreenshotMappingConfig from './pages/ScreenshotMappingConfig'
import TableVisualization from './pages/TableVisualization'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import PublicRoute from './components/PublicRoute'
import { useAuth } from './context/AuthContext'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Landing Page - Public route */}
        <Route path="/home" element={<Landing />} />
        
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - Require authentication */}
        <Route 
          path="/onboarding" 
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="machines" element={<Machines />} />
          <Route path="workers" element={<Workers />} />
          <Route path="production" element={<Production />} />
          <Route path="screenshot-mapping" element={<ScreenshotMappingConfig />} />
          <Route path="table-visualization" element={<TableVisualization />} />
        </Route>

        {/* Root route - Redirect based on authentication */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// Component to redirect based on authentication status
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/home" replace />;
}

export default App
