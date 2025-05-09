"use client"

import React, { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Download, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import API from "../api.tsx"
import useDocumentTitle from "../hooks/useDocumentTitle"
import {
  parseISO,
  subMonths,
  isWithinInterval,
  format,
} from "date-fns"

// Interfaces matching backend serializers
interface WasteLog {
  id: number
  user: number
  food_name: string
  quantity: number
  reason: string
  date_logged: string
  food_log: number
  category_name?: string
}

interface DonationRecord {
  id: number
  date_donated: string
  center: number
  center_name: string
  user: number
  user_id: number
  user_username: string
  food_log: number
  food_log_name: string
  food_log_quantity: number
  quantity: number
  category_name?: string
}

interface FoodLog {
  id: number
  food_name: string
  quantity: number
  category: number | null
  category_name: string | null
  date_logged: string
  expiration_date: string | null
  status: string
  user: number
  donated_quantity: number
  wasted_quantity: number
  available_quantity: number
}

interface ChartData {
  month?: string
  name?: string
  amount?: number
  value?: number
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#FF1493",
  "#32CD32",
  "#FFD700",
]

const Reports: React.FC = () => {
  useDocumentTitle("Reports - FoodShare")

  const [timeRange, setTimeRange] = useState<string>("year")
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([])
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([])
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
  const [wasteByMonth, setWasteByMonth] = useState<ChartData[]>([])
  const [donationsByMonth, setDonationsByMonth] = useState<ChartData[]>([])
  const [wasteByFoodItem, setWasteByFoodItem] = useState<ChartData[]>([])
  const [donationsByCategory, setDonationsByCategory] = useState<ChartData[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wasteResponse, donationResponse, foodLogResponse] = await Promise.all([
          API.get("/wastelogs/my"),
          API.get("/donations/my"),
          API.get("/foodlogs/my/"),
        ])

        const wasteData: WasteLog[] = wasteResponse.data
        const donationData: DonationRecord[] = donationResponse.data
        const foodLogData: FoodLog[] = foodLogResponse.data

        // Map food_log id to category_name
        const foodLogCategoryMap = new Map<number, string>()
        foodLogData.forEach((fl) => {
          foodLogCategoryMap.set(
            Number(fl.id),
            fl.category_name?.trim() || "Uncategorized"
          )
        })

        const enrichedWasteLogs = wasteData.map((log) => ({
          ...log,
          category_name: foodLogCategoryMap.get(Number(log.food_log)) || "Uncategorized",
        }))

        const enrichedDonationRecords = donationData.map((record) => ({
          ...record,
          category_name: foodLogCategoryMap.get(Number(record.food_log)) || "Uncategorized",
        }))

        setWasteLogs(enrichedWasteLogs)
        setDonationRecords(enrichedDonationRecords)
        setFoodLogs(foodLogData)
      } catch (error: any) {
        console.error("Failed to fetch report data:", error)
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        })
      }
    }
    fetchData()
  }, [toast])

  useEffect(() => {
    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case "month":
        startDate = subMonths(now, 1)
        break
      case "quarter":
        startDate = subMonths(now, 3)
        break
      case "year":
        startDate = subMonths(now, 12)
        break
      case "all":
      default:
        startDate = new Date(0)
        break
    }

    const filteredWasteLogs = wasteLogs.filter((log) =>
      isWithinInterval(parseISO(log.date_logged), { start: startDate, end: now })
    )
    const filteredDonationRecords = donationRecords.filter((record) =>
      isWithinInterval(parseISO(record.date_donated), { start: startDate, end: now })
    )

    const monthsCount =
      timeRange === "month" ? 1 : timeRange === "quarter" ? 3 : 12

    const wasteMonthly: ChartData[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthKey = format(monthDate, "MMM yyyy")
      const amount = filteredWasteLogs
        .filter((log) => format(parseISO(log.date_logged), "MMM yyyy") === monthKey)
        .reduce((sum, log) => sum + log.quantity, 0)
      wasteMonthly.push({ month: format(monthDate, "MMM"), amount })
    }
    setWasteByMonth(wasteMonthly)

    const donationsMonthly: ChartData[] = []
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i)
      const monthKey = format(monthDate, "MMM yyyy")
      const amount = filteredDonationRecords
        .filter((record) => format(parseISO(record.date_donated), "MMM yyyy") === monthKey)
        .reduce((sum, record) => sum + record.quantity, 0)
      donationsMonthly.push({ month: format(monthDate, "MMM"), amount })
    }
    setDonationsByMonth(donationsMonthly)

    const wasteFoodItemTotals: { [foodItem: string]: number } = {}
    filteredWasteLogs.forEach((log) => {
      const foodItem = log.food_name?.trim() || "Unknown Item"
      wasteFoodItemTotals[foodItem] = (wasteFoodItemTotals[foodItem] || 0) + log.quantity
    })
    const sortedWasteByFoodItem = Object.entries(wasteFoodItemTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    setWasteByFoodItem(sortedWasteByFoodItem)

    const donationCategoryTotals: { [category: string]: number } = {}
    filteredDonationRecords.forEach((record) => {
      const cat = record.category_name?.trim() || "Uncategorized"
      donationCategoryTotals[cat] = (donationCategoryTotals[cat] || 0) + record.quantity
    })
    const sortedDonationsByCategory = Object.entries(donationCategoryTotals)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    setDonationsByCategory(sortedDonationsByCategory)
  }, [timeRange, wasteLogs, donationRecords])

  const handleExport = () => {
    const exportSections = [
      { title: "Waste by Month", data: wasteByMonth },
      { title: "Donations by Month", data: donationsByMonth },
      { title: "Waste by Food Item", data: wasteByFoodItem },
      { title: "Donations by Category", data: donationsByCategory },
    ]

    const csvContent = exportSections
      .map((section) => {
        if (section.data.length === 0) return ""
        const header = Object.keys(section.data[0]).join(",")
        const rows = section.data
          .map((row) =>
            Object.values(row)
              .map((val) => `"${val}"`)
              .join(",")
          )
          .join("\n")
        return `${section.title}\n${header}\n${rows}\n`
      })
      .filter((section) => section !== "")
      .join("\n")

    if (!csvContent) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      })
      return
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `FoodShare_Reports_${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalDonations = donationRecords.reduce((sum, rec) => sum + rec.quantity, 0)
  const totalWaste = wasteLogs.reduce((sum, log) => sum + log.quantity, 0)
  const mealsProvided = Math.round(totalDonations * 0.5)
  const co2Saved = Math.round(totalWaste * 2.5)

  const highestWasteFoodItem = wasteByFoodItem.reduce(
    (max, curr) => (curr.value && curr.value > (max.value ?? 0) ? curr : max),
    { name: "", value: 0 }
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Analyze your food waste and donation data</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={(val) => setTimeRange(val)}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="waste">Waste Analysis</TabsTrigger>
              <TabsTrigger value="donations">Donation Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Food Waste Trend</CardTitle>
                    <CardDescription>Monthly food waste over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={wasteByMonth}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value} kg`} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            name="Waste (kg)"
                            stroke="#ff8042"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Donation Trend</CardTitle>
                    <CardDescription>Monthly donations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={donationsByMonth}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value} items`} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            name="Donations (items)"
                            stroke="#4ade80"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Waste by Food Item</CardTitle>
                    <CardDescription>Distribution of waste by food item</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      {wasteByFoodItem.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                            <Pie
                              data={wasteByFoodItem}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({
                                name,
                                percent,
                                index,
                                cx,
                                cy,
                                midAngle,
                                outerRadius,
                              }) => {
                                if (index > 4) return null
                                const RADIAN = Math.PI / 180
                                const radius = outerRadius + 40
                                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#666"
                                    fontSize={10}
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                  >
                                    {`${name} (${(percent * 100).toFixed(1)}%)`}
                                  </text>
                                )
                              }}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {wasteByFoodItem.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  stroke={COLORS[index % COLORS.length]}
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => `${value} kg`}
                              labelFormatter={(label: string) => `Food Item: ${label}`}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No waste data available for this period.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Donations by Category</CardTitle>
                    <CardDescription>Distribution of donations by food category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      {donationsByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                            <Pie
                              data={donationsByCategory}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({
                                name,
                                percent,
                                index,
                                cx,
                                cy,
                                midAngle,
                                outerRadius,
                              }) => {
                                if (index > 4) return null
                                const RADIAN = Math.PI / 180
                                const radius = outerRadius + 40
                                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="#666"
                                    fontSize={10}
                                    textAnchor={x > cx ? "start" : "end"}
                                    dominantBaseline="central"
                                  >
                                    {`${name} (${(percent * 100).toFixed(1)}%)`}
                                  </text>
                                )
                              }}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {donationsByCategory.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  stroke={COLORS[index % COLORS.length]}
                                  strokeWidth={1}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => `${value} items`}
                              labelFormatter={(label: string) => `Category: ${label}`}
                            />
                            <Legend
                              layout="horizontal"
                              verticalAlign="bottom"
                              align="center"
                              wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          No donation data available for this period.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Impact Summary</CardTitle>
                  <CardDescription>Your contribution to reducing food waste</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-medium text-green-800">Total Donations</h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">{totalDonations} items</p>
                      <p className="text-sm text-green-700 mt-1">
                        Helped feed ~{mealsProvided} people
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-medium text-amber-800">Total Waste Recorded</h3>
                      <p className="text-3xl font-bold text-amber-600 mt-2">{totalWaste} kg</p>
                      <p className="text-sm text-amber-700 mt-1">Tracked over the period</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-medium text-blue-800">CO₂ Saved</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">~{co2Saved} kg</p>
                      <p className="text-sm text-blue-700 mt-1">By reducing waste</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="waste">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Waste Reduction Over Time</CardTitle>
                    <CardDescription>Track your progress in reducing waste</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={wasteByMonth}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value} kg`} />
                          <Legend />
                          <Bar dataKey="amount" name="Waste (kg)" fill="#ff8042" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Waste by Food Item</CardTitle>
                      <CardDescription>Breakdown of waste by food item</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        {wasteByFoodItem.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                              <Pie
                                data={wasteByFoodItem}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({
                                  name,
                                  percent,
                                  index,
                                  cx,
                                  cy,
                                  midAngle,
                                  outerRadius,
                                }) => {
                                  if (index > 4) return null
                                  const RADIAN = Math.PI / 180
                                  const radius = outerRadius + 40
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                  return (
                                    <text
                                      x={x}
                                      y={y}
                                      fill="#666"
                                      fontSize={10}
                                      textAnchor={x > cx ? "start" : "end"}
                                      dominantBaseline="central"
                                    >
                                      {`${name} (${(percent * 100).toFixed(1)}%)`}
                                    </text>
                                  )
                                }}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {wasteByFoodItem.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => `${value} kg`}
                                labelFormatter={(label: string) => `Food Item: ${label}`}
                              />
                              <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No waste data available for this period.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Waste Reduction Tips</CardTitle>
                      <CardDescription>Personalized suggestions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {highestWasteFoodItem.name && highestWasteFoodItem.value > 0 && (
                          <div className="border-l-4 border-amber-500 pl-4 py-2">
                            <h3 className="font-medium">
                              Reduce {highestWasteFoodItem.name} Waste
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              You’ve wasted {highestWasteFoodItem.value} kg of {highestWasteFoodItem.name}. Try buying smaller quantities or using leftovers.
                            </p>
                          </div>
                        )}
                        <div className="border-l-4 border-green-500 pl-4 py-2">
                          <h3 className="font-medium">Proper Storage</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Use the fridge’s crisper drawer to extend shelf life.
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4 py-2">
                          <h3 className="font-medium">Meal Planning</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Plan meals to avoid excess purchases.
                          </p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4 py-2">
                          <h3 className="font-medium">Freezing</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Freeze surplus food to prevent waste.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="donations">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Donation Impact Over Time</CardTitle>
                    <CardDescription>Track your community contributions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={donationsByMonth}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value} items`} />
                          <Legend />
                          <Bar dataKey="amount" name="Donations (items)" fill="#4ade80" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Donations by Category</CardTitle>
                      <CardDescription>Breakdown of donations by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-96">
                        {donationsByCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                              <Pie
                                data={donationsByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                label={({
                                  name,
                                  percent,
                                  index,
                                  cx,
                                  cy,
                                  midAngle,
                                  outerRadius,
                                }) => {
                                  if (index > 4) return null
                                  const RADIAN = Math.PI / 180
                                  const radius = outerRadius + 40
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                  return (
                                    <text
                                      x={x}
                                      y={y}
                                      fill="#666"
                                      fontSize={10}
                                      textAnchor={x > cx ? "start" : "end"}
                                      dominantBaseline="central"
                                    >
                                      {`${name} (${(percent * 100).toFixed(1)}%)`}
                                    </text>
                                  )
                                }}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {donationsByCategory.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={1}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => `${value} items`}
                                labelFormatter={(label: string) => `Category: ${label}`}
                              />
                              <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No donation data available for this period.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Community Impact</CardTitle>
                      <CardDescription>Your donation impact</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-medium">Total Donations</h3>
                          <p className="text-3xl font-bold text-green-600 mt-2">
                            {totalDonations} items
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-green-800">Meals Provided</h4>
                            <p className="text-2xl font-bold text-green-600 mt-1">~{mealsProvided}</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800">CO₂ Saved</h4>
                            <p className="text-2xl font-bold text-blue-600 mt-1">~{co2Saved} kg</p>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <h3 className="font-medium mb-2">Most Needed Items</h3>
                          <ul className="space-y-1 text-sm text-gray-600">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                              Canned proteins
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              Rice and pasta
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Cooking oils
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                              Shelf-stable milk
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default Reports