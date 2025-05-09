"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import API from "../api" // make sure this path points to your axios setup

interface User {
  id: string
  token: string
  username: string
  first_name: string
  last_name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (first_name: string, last_name: string, email: string, username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    // alert(email, password)
    try {
      const response = await API.post("/login/", { username, password })
      const userData: User = response.data
      const token: string = response.data.token
      console.log(response.data)

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)
      API.defaults.headers.common["Authorization"] = `Token ${token}`
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (first_name: string, last_name: string, email: string, username: string, password: string) => {
    setLoading(true)
    try {
      const response = await API.post("/register/", { first_name, last_name, email, username, password})
      const userData: User = response.data
      const token: string = response.data.token

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("token", token)
      API.defaults.headers.common["Authorization"] = `Token ${token}`
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // const token = localStorage.getItem("token");

      const response = await API.post("/logout/")

      setUser(null)
      console.log(response.data.message)
      localStorage.removeItem("user") 
      localStorage.removeItem("token")
      delete API.defaults.headers.common["Authorization"]
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
