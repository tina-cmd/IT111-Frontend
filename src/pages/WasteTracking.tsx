"use client"

import React, { useState, useEffect } from "react"
import { useToast } from "../components/ui/use-toast"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { PlusCircle, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import Navbar from "../components/Navbar"
import useDocumentTitle from "../hooks/useDocumentTitle"
import API from "../api"
import { useAuth } from "../contexts/AuthContext"
import { parseISO } from "date-fns"

interface WasteRecord {
  id: number
  date_logged: string
  food_name: string
  quantity: number
  reason: string
}

interface FoodItem {
  id: number
  food_name: string
  quantity: number
  donated_quantity: number
  wasted_quantity: number
  available_quantity: number
}

interface WasteByCategory {
  name: string
  value: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

const WasteTracking = () => {
  useDocumentTitle("Waste Tracking - FoodShare")

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([])
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [wasteByCategory, setWasteByCategory] = useState<WasteByCategory[]>([])
  const [foodItem, setFoodItem] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await API.get("/foodlogs/my")
        if (Array.isArray(response.data)) {
          const parsedItems: FoodItem[] = response.data.map((item: any) => ({
            id: item.id,
            food_name: item.food_name,
            quantity: parseFloat(item.quantity) || 0,
            donated_quantity: parseFloat(item.donated_quantity) || 0,
            wasted_quantity: parseFloat(item.wasted_quantity) || 0,
            available_quantity: parseFloat(item.quantity || 0) - (parseFloat(item.donated_quantity) || 0) - (parseFloat(item.wasted_quantity) || 0)
          }))
          setFoodItems(parsedItems)
        } else {
          setFoodItems([])
          toast({
            title: "Error",
            description: "Invalid food items data received.",
            variant: "destructive",
          })
        }
      } catch (error) {
        setFoodItems([])
        toast({
          title: "Error",
          description: "Failed to load food items",
          variant: "destructive",
        })
      }
    }

    const fetchWasteRecords = async () => {
      try {
        const response = await API.get("/wastelogs/my")
        const wasteData = response.data
        if (Array.isArray(wasteData)) {
          const parsedRecords: WasteRecord[] = wasteData.map((record: any) => ({
            id: record.id,
            date_logged: record.date_logged,
            food_name: record.food_name,
            quantity: parseFloat(record.quantity) || 0,
            reason: record.reason
          }))
          const sortedRecords = parsedRecords.sort((a, b) => 
            parseISO(b.date_logged).getTime() - parseISO(a.date_logged).getTime()
          )
          setWasteRecords(sortedRecords)
          updateAnalytics(sortedRecords)
        } else {
          setWasteRecords([])
          toast({
            title: "Error",
            description: "Invalid waste records data received.",
            variant: "destructive",
          })
        }
      } catch (error) {
        setWasteRecords([])
        toast({
          title: "Error",
          description: "Failed to load waste records",
          variant: "destructive",
        })
      }
    }

    fetchFoodItems()
    fetchWasteRecords()
  }, [])

  const updateAnalytics = (records: WasteRecord[]) => {
    const categoryData = records.reduce((acc: WasteByCategory[], record: WasteRecord) => {
      const { food_name, quantity } = record
      const amountValue = Number(quantity) || 0

      const existingCategory = acc.find((item) => item.name === food_name)
      if (existingCategory) {
        existingCategory.value += amountValue
      } else {
        acc.push({ name: food_name, value: amountValue })
      }

      return acc
    }, [])

    setWasteByCategory(categoryData)
  }

  const handleAddWaste = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!foodItem || !amount || !reason) {
      setModalMessage("Please fill in all required fields")
      setModalType("error")
      setIsModalOpen(true)
      return
    }

    const selectedFoodItem = foodItems.find(item => item.id.toString() === foodItem)
    if (!selectedFoodItem) {
      setModalMessage("Selected food item not found.")
      setModalType("error")
      setIsModalOpen(true)
      return
    }

    const foodItemAvailable = selectedFoodItem.available_quantity
    const wasteAmount = parseFloat(amount)

    if (isNaN(wasteAmount) || wasteAmount <= 0 || wasteAmount > foodItemAvailable) {
      setModalMessage(`Waste amount must be a number between 0.01 and ${foodItemAvailable.toFixed(2)}.`)
      setModalType("error")
      setIsModalOpen(true)
      return
    }

    try {
      const newWasteRecord = {
        user: user?.id,
        food_log: foodItem,
        quantity: wasteAmount.toString(),
        reason
      }

      await API.post("/wastelogs/add/", newWasteRecord)

      const response = await API.get("/wastelogs/my")
      const updatedWasteData = response.data.map((record: any) => ({
        id: record.id,
        date_logged: record.date_logged,
        food_name: record.food_name,
        quantity: parseFloat(record.quantity) || 0,
        reason: record.reason
      }))

      if (Array.isArray(updatedWasteData)) {
        const sortedRecords = updatedWasteData.sort((a, b) => 
          parseISO(b.date_logged).getTime() - parseISO(a.date_logged).getTime()
        )
        setWasteRecords(sortedRecords)
        updateAnalytics(sortedRecords)
      }

      setModalMessage(`${wasteAmount.toFixed(2)} of ${selectedFoodItem.food_name} has been logged as waste.`)
      setModalType("success")
      setIsModalOpen(true)

      setFoodItem("")
      setAmount("")
      setReason("")
    } catch (error) {
      setModalMessage("Failed to log the waste. Please try again.")
      setModalType("error")
      setIsModalOpen(true)
    }
  }

  const handleDeleteRecord = async (id: number) => {
    try {
      await API.delete(`/wastelogs/${id}`)
      const updatedRecords = wasteRecords.filter((record) => record.id !== id)
      const sortedRecords = updatedRecords.sort((a, b) => 
        parseISO(b.date_logged).getTime() - parseISO(a.date_logged).getTime()
      )
      setWasteRecords(sortedRecords)
      updateAnalytics(sortedRecords)
      setModalMessage("Waste record successfully deleted.")
      setModalType("success")
      setIsModalOpen(true)
    } catch (error) {
      setModalMessage("Failed to delete the waste record.")
      setModalType("error")
      setIsModalOpen(true)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Food Waste Tracking</h1>

          <Tabs defaultValue="history">
            <TabsList className="mb-6">
              <TabsTrigger value="history">Waste History</TabsTrigger>
              <TabsTrigger value="add">Log Waste</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Waste History</CardTitle>
                  <CardDescription>View your food waste records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Reason</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wasteRecords.map((record: WasteRecord) => (
                          <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {new Date(record.date_logged).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }).replace(/ (\d+)/, ', $1')}
                            </td>
                            <td className="px-6 py-4">{record.food_name}</td>
                            <td className="px-6 py-4">{Number(record.quantity).toFixed(2)}</td>
                            <td className="px-6 py-4">{record.reason}</td>
                            <td className="px-6 py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Log Food Waste</CardTitle>
                  <CardDescription>Record food items that were wasted</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddWaste} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="foodItem">Food Item</Label>
                        <Select value={foodItem} onValueChange={setFoodItem} required>
                          <SelectTrigger id="foodItem">
                            <SelectValue placeholder="Select food item" />
                          </SelectTrigger>
                          <SelectContent>
                            {foodItems.filter(item => item.available_quantity > 0).map((item: FoodItem) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.food_name} ({Number(item.available_quantity).toFixed(2)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Enter amount (e.g., 0.5)"
                          value={amount}
                          onChange={handleAmountChange}
                          required
                        />
                        {foodItem && (
                          <p className="text-sm text-gray-500">
                            Max: {Number(foodItems.find(item => item.id.toString() === foodItem)?.available_quantity || 0).toFixed(2)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select value={reason} onValueChange={setReason} required>
                          <SelectTrigger id="reason">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Expired">Expired</SelectItem>
                            <SelectItem value="Spoiled">Spoiled</SelectItem>
                            <SelectItem value="Stale">Stale</SelectItem>
                            <SelectItem value="Overcooked">Overcooked</SelectItem>
                            <SelectItem value="Leftover">Leftover</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <CardFooter className="px-0 pt-4">
                      <Button type="submit" className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Log Waste
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Waste Analytics</CardTitle>
                  <CardDescription>Visualize your food waste data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {wasteByCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-50">
          <div className={`p-6 rounded-lg shadow-lg w-full max-w-md ${modalType === "success" ? "bg-green-50" : "bg-red-50"}`}>
            <h3 className="text-xl font-semibold mb-4">
              {modalType === "success" ? "Success!" : "Error"}
            </h3>
            <p className="mb-6">{modalMessage}</p>
            <Button
              onClick={closeModal}
              className={`w-full ${modalType === "success" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WasteTracking