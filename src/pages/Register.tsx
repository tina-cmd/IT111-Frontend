"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import DOMPurify from "dompurify"
import useDocumentTitle from "../hooks/useDocumentTitle"

const Register = () => {
  useDocumentTitle("Register - FoodShare")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Password validation regex: min 8 chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/

  // Sanitize input to prevent XSS using DOMPurify
  const sanitizeInput = (input: string) => {
    return DOMPurify.sanitize(input, {
      USE_PROFILES: { html: false }, // Disallow all HTML tags
      ALLOWED_TAGS: [], // Explicitly disallow all tags
      ALLOWED_ATTR: [], // Disallow all attributes
    }).trim()
  }

  // Validate password and confirm password on change
  useEffect(() => {
    const sanitizedPassword = sanitizeInput(password)
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword)

    // Check password requirements
    if (password && !passwordRegex.test(sanitizedPassword)) {
      setPasswordError(true)
      toast({
        title: "Invalid password",
        description: "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character (!@#$%^&*).",
        variant: "destructive",
      })
    } else {
      setPasswordError(false)
    }

    // Check if passwords match
    if (confirmPassword && sanitizedPassword !== sanitizedConfirmPassword) {
      setConfirmPasswordError(true)
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
    } else {
      setConfirmPasswordError(false)
    }
  }, [password, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Sanitize all inputs
    const sanitizedFirstName = sanitizeInput(firstName)
    const sanitizedLastName = sanitizeInput(lastName)
    const sanitizedEmail = sanitizeInput(email)
    const sanitizedUsername = sanitizeInput(username)
    const sanitizedPassword = sanitizeInput(password)
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword)

    // Validate password requirements
    if (!passwordRegex.test(sanitizedPassword)) {
      setPasswordError(true)
      toast({
        title: "Invalid password",
        description: "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character (!@#$%^&*).",
        variant: "destructive",
      })
      return
    }

    // Check if passwords match
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      setConfirmPasswordError(true)
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await register(sanitizedFirstName, sanitizedLastName, sanitizedEmail, sanitizedUsername, sanitizedPassword)
      toast({
        title: "Registration successful",
        description: "Welcome to FoodShare!",
      })
      navigate("/dashboard")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "There was an error creating your account.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-200 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <img
            src="/logo.png"
            alt="FoodShare Logo"
            className="mx-auto mb-8 h-36 w-auto"
          />
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a FoodShare account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(sanitizeInput(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(sanitizeInput(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="JohnDoe"
                value={username}
                onChange={(e) => setUsername(sanitizeInput(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(sanitizeInput(e.target.value))}
                required
                className={passwordError ? "border-red-500 focus:border-red-500" : ""}
              />
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters long, with at least one uppercase letter, one number, and one special character (!@#$%^&*).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(sanitizeInput(e.target.value))}
                required
                className={confirmPasswordError ? "border-red-500 focus:border-red-500" : ""}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-green-600 hover:text-green-500 font-medium">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Register