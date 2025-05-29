"use client"

import React, { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import API from "../api"
import { useAuth } from "@/contexts/AuthContext"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { parseISO, format } from "date-fns"
import { useNavigate } from "react-router-dom"

interface UserInfo {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  prefers_dark_mode: boolean
}

interface ActivityStats {
  total_food_logs: number
  total_waste_logs: number
  total_donations: number
  recent_activities: RecentActivity[]
}

interface RecentActivity {
  type: "food_log" | "waste_log" | "donation"
  description: string
  date: string
}

const Profile = () => {
  useDocumentTitle("Profile - FoodShare")
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedInfo, setEditedInfo] = useState<UserInfo | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [stats, setStats] = useState<ActivityStats | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await API.get("/user/")
        setUserInfo(response.data)
        setEditedInfo(response.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user info.",
          variant: "destructive",
        })
      }
    }

    const fetchStats = async () => {
      try {
        const response = await API.get("/user/stats/")
        setStats(response.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user stats.",
          variant: "destructive",
        })
      }
    }

    fetchUserInfo()
    fetchStats()
  }, [])

  const handleEditChange = (field: keyof UserInfo, value: string | boolean) => {
    setEditedInfo(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSave = async () => {
    if (!editedInfo) return

    try {
      const payload: any = {
        username: editedInfo.username,
        email: editedInfo.email,
        first_name: editedInfo.first_name,
        last_name: editedInfo.last_name,
        profile: {
          prefers_dark_mode: editedInfo.prefers_dark_mode
        }
      }
      if (newPassword) {
        payload.password = newPassword
      }
      await API.patch("/user/", payload)
      setUserInfo(editedInfo)
      setIsEditing(false)
      setNewPassword("")
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      })

      // Update dark mode in the DOM
      if (editedInfo.prefers_dark_mode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await API.delete("/user/")
      logout()
      navigate("/login")
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive",
      })
    }
  }

  const formatDateSafely = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Invalid Date"
    }
  }

  return (
    <div className={`min-h-screen flex flex-col ${userInfo?.prefers_dark_mode ? "dark" : ""}`}>
      <Navbar />
      <main className="flex-grow p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View and manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userInfo && (
                <>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        {isEditing ? (
                          <Input
                            value={editedInfo?.username || ""}
                            onChange={(e) => handleEditChange("username", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{userInfo.username}</p>
                        )}
                      </div>
                      <div>
                        <Label>Email</Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedInfo?.email || ""}
                            onChange={(e) => handleEditChange("email", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{userInfo.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        {isEditing ? (
                          <Input
                            value={editedInfo?.first_name || ""}
                            onChange={(e) => handleEditChange("first_name", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{userInfo.first_name || "N/A"}</p>
                        )}
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        {isEditing ? (
                          <Input
                            value={editedInfo?.last_name || ""}
                            onChange={(e) => handleEditChange("last_name", e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{userInfo.last_name || "N/A"}</p>
                        )}
                      </div>
                    </div>
                    {isEditing && (
                      <div>
                        <Label>New Password (Optional)</Label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                        />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dark-mode"
                        checked={editedInfo?.prefers_dark_mode || false}
                        onCheckedChange={(checked) => handleEditChange("prefers_dark_mode", checked)}
                        disabled={!isEditing}
                      />
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave}>Save</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                          Delete Account
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Activity Stats</CardTitle>
              <CardDescription>Overview of your contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-medium text-blue-800">Total Food Logs</h3>
                    <p className="text-2xl font-bold text-blue-600">{stats.total_food_logs}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-medium text-green-800">Total Donations</h3>
                    <p className="text-2xl font-bold text-green-600">{stats.total_donations}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-medium text-red-800">Total Waste Logs</h3>
                    <p className="text-2xl font-bold text-red-600">{stats.total_waste_logs}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest actions in the app</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_activities.map((activity, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDateSafely(activity.date)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No recent activities.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default Profile