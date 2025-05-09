"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Home, LayoutDashboard, PlusCircle, BarChart3, Map, LogOut, Menu, X, User } from "lucide-react"

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path: string) => location.pathname === path

  if (!user) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-green-600 font-bold text-xl">FoodShare</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-800 dark:to-emerald-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white font-bold text-xl">FoodShare</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <Link
              to="/dashboard"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/dashboard") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <Link
              to="/food-logging"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/food-logging") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Log Food
            </Link>
            <Link
              to="/waste-tracking"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/waste-tracking") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Track Waste
            </Link>
            <Link
              to="/donation-centers"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/donation-centers") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <Map className="w-4 h-4 mr-1" />
              Donate
            </Link>
            <Link
              to="/reports"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/reports") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Reports
            </Link>
            <Link
              to="/profile"
              className={`text-white hover:bg-teal-500 dark:hover:bg-teal-700 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-200 ${
                isActive("/profile") ? "bg-emerald-700 dark:bg-emerald-900" : ""
              }`}
            >
              <User className="w-4 h-4 mr-1" />
              Profile
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-black border-white hover:bg-teal-500 dark:hover:bg-teal-700 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-teal-500 dark:hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-teal-600 dark:bg-teal-800">
            <Link
              to="/"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Home
              </div>
            </Link>
            <Link
              to="/dashboard"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </div>
            </Link>
            <Link
              to="/food-logging"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <PlusCircle className="w-4 h-4 mr-2" />
                Log Food
              </div>
            </Link>
            <Link
              to="/waste-tracking"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Track Waste
              </div>
            </Link>
            <Link
              to="/donation-centers"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Map className="w-4 h-4 mr-2" />
                Donate
              </div>
            </Link>
            <Link
              to="/reports"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </div>
            </Link>
            <Link
              to="/profile"
              className="text-white hover:bg-teal-500 dark:hover:bg-teal-700 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Profile
              </div>
            </Link>
            <button
              onClick={() => {
                handleLogout()
                setIsMenuOpen(false)
              }}
              className="text-black bg-teal-600 hover:bg-emerald-500 dark:hover:bg-emerald-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
            >
              <div className="flex items-center">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar