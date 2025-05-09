import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ToastProvider } from "@/components/ui/toast"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import FoodLogging from "./pages/FoodLogging"
import WasteTracking from "./pages/WasteTracking"
import DonationCenters from "./pages/DonationCenters"
import Reports from "./pages/Reports"
import Profile from "./pages/Profile"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-logging"
            element={
              <ProtectedRoute>
                <FoodLogging />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waste-tracking"
            element={
              <ProtectedRoute>
                <WasteTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donation-centers"
            element={
              <ProtectedRoute>
                <DonationCenters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <ToastProvider />
    </AuthProvider>
  )
}

export default App