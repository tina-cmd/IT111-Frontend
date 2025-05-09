"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { PlusCircle, Map, Utensils, Recycle } from "lucide-react"
import API from "../api.tsx"
import { parseISO, format } from "date-fns"
import useDocumentTitle from "../hooks/useDocumentTitle"

// Define interfaces based on backend serializers
interface FoodItem {
  id: number;
  food_name: string;
  quantity: number;
  category: number;
  category_name: string;
  date_logged: string;
  status: string;
  user: number;
  donated_quantity: number;
  wasted_quantity: number;
  available_quantity: number;
}

interface DonationRecord {
  id: number;
  date_donated: string;
  center: number;
  center_name: string;
  user: number;
  user_id: number;
  user_username: string;
  food_log: number;
  food_log_name: string;
  food_log_quantity: number;
  quantity: number;
}

interface WasteRecord {
  id: number;
  user: number;
  food_log: number;
  food_name: string;
  quantity: number;
  reason: string;
  date_logged: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

const Dashboard = () => {
  useDocumentTitle("Dashboard - FoodShare")
  const { user } = useAuth()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [wasteData, setWasteData] = useState<WasteRecord[]>([])
  const [donationData, setDonationData] = useState<DonationRecord[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/foodlogs/my/")
        const allFoodLogs = response.data
        // Filter to include only items with available_quantity > 0
        const availableFoodLogs = allFoodLogs.filter((item: FoodItem) => item.available_quantity > 0)
        setFoodItems(availableFoodLogs)
      } catch (error) {
        console.error("Data fetching error: ", error)
      }
    }

    const fetchWasteData = async () => {
      try {
        const response = await API.get("/wastelogs/my")
        setWasteData(response.data)
      } catch (error) {
        console.error("Waste data fetching error: ", error)
      }
    }

    const fetchDonationData = async () => {
      try {
        const response = await API.get("/donations/my")
        setDonationData(response.data)
      } catch (error) {
        console.error("Donation data fetching error: ", error)
      }
    }

    fetchData()
    fetchWasteData()
    fetchDonationData()
  }, [])

  // Process donation data for chart
  const monthlyDonationCount: { [month: string]: number } = {}
  donationData.forEach((donation) => {
    const month = format(parseISO(donation.date_donated), "MMMM yyyy")
    monthlyDonationCount[month] = (monthlyDonationCount[month] || 0) + 1
  })

  const chartData = Object.entries(monthlyDonationCount).map(([month, amount]) => ({
    month,
    amount,
  }))

  // Aggregate waste data by food name
  const aggregatedWasteData = wasteData.reduce((acc: { name: string; value: number }[], record) => {
    const existing = acc.find(item => item.name === record.food_name)
    if (existing) {
      existing.value += record.quantity
    } else {
      acc.push({ name: record.food_name, value: record.quantity })
    }
    return acc
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.first_name}</p>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <Link to="/food-logging">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Log Food
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Food Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Utensils className="w-5 h-5 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">{foodItems.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Waste Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Recycle className="w-5 h-5 text-amber-500 mr-2" />
                  <div className="text-2xl font-bold">{wasteData.reduce((acc, item) => acc + item.quantity, 0)} kg</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Map className="w-5 h-5 text-blue-500 mr-2" />
                  <div className="text-2xl font-bold">{donationData.length} items</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Food Waste by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Food Waste by Category</CardTitle>
                <CardDescription>Distribution of waste by food category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedWasteData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {aggregatedWasteData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donations Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Donations Over Time</CardTitle>
                <CardDescription>Number of items donated per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Items Donated" fill="#4ade80" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Food Inventory */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Food Inventory</CardTitle>
                  <CardDescription>Your current food items</CardDescription>
                </div>
                <Link to="/food-logging">
                  <Button variant="outline" size="sm">
                    Add Item
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Quantity</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foodItems.length > 0 ? (
                      foodItems.map((item) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{item.food_name}</td>
                          <td className="px-6 py-4">{item.available_quantity}</td>
                          <td className="px-6 py-4">{item.category_name}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                item.status === "Donated"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "Expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(item.date_logged).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }).replace(/ (\d+)/, ', $1')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-500 py-6">
                          No food logs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Link to="/food-logging">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2 text-green-500" />
                    Log Food
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Add new food items to your inventory</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/waste-tracking">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Recycle className="w-5 h-5 mr-2 text-amber-500" />
                    Track Waste
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Log and categorize your food waste</p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/donation-centers">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Map className="w-5 h-5 mr-2 text-blue-500" />
                    Donate Food
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Find nearby donation centers</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard