"use client"

import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, Phone, Clock, Info, Search } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L, { LatLngExpression } from "leaflet"
import API from "../api.tsx"
import { useAuth } from "@/contexts/AuthContext.tsx"
import useDocumentTitle from "../hooks/useDocumentTitle"
import { parseISO, format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

interface DonationCenter {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  contact_number: string
  email: string
}

interface FoodItem {
  id: number
  food_name: string
  quantity: number
  category_name: string
  category: number
  available_quantity: number
  date_logged: string
  expiration_date: string | null
  status: string
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
}

interface MultiDonationItem {
  food_log: number
  quantity: number
}

const DonationCenters = () => {
  useDocumentTitle("Donation Centers - FoodShare")
  const [donationCenters, setDonationCenters] = useState<DonationCenter[]>([])
  const [filteredCenters, setFilteredCenters] = useState<DonationCenter[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCenter, setSelectedCenter] = useState<DonationCenter | null>(null)
  const [availableFoodItems, setAvailableFoodItems] = useState<FoodItem[]>([])
  const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [donationItems, setDonationItems] = useState<{ [key: number]: number }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<DonationRecord | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const response = await API.get("/donationcenters/")
        const centers = response.data as DonationCenter[]
        setDonationCenters(centers)
        setFilteredCenters(centers) // Initially, all centers are shown
      } catch (error) {
        console.error("Failed to fetch donation centers:", error)
        toast({
          title: "Error",
          description: "Failed to load donation centers.",
          variant: "destructive",
        })
      }
    }

    const fetchFoodItems = async () => {
      try {
        const response = await API.get("/foodlogs/my/")
        const items = (response.data as FoodItem[]).filter(
          (item: FoodItem) => item.available_quantity > 0 && item.status !== "Expired"
        )
        setAvailableFoodItems(items)
        const initialDonationItems = items.reduce((acc, item) => {
          acc[item.id] = 0
          return acc
        }, {} as { [key: number]: number })
        setDonationItems(initialDonationItems)
      } catch (error) {
        console.error("Failed to fetch food items:", error)
        toast({
          title: "Error",
          description: "Failed to load food items.",
          variant: "destructive",
        })
      }
    }

    const fetchRecords = async () => {
      try {
        const response = await API.get("/donations/my")
        const records = response.data as DonationRecord[]
        const sortedRecords = records.sort((a, b) => 
          parseISO(b.date_donated).getTime() - parseISO(a.date_donated).getTime()
        )
        setDonationHistory(sortedRecords)
      } catch (error) {
        console.error("Failed to fetch donation history:", error)
        toast({
          title: "Error",
          description: "Failed to load donation history.",
          variant: "destructive",
        })
      }
    }

    fetchCenters()
    fetchFoodItems()
    fetchRecords()
  }, [])

  // Handle search functionality
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim()
    if (query === "") {
      setFilteredCenters(donationCenters)
    } else {
      const filtered = donationCenters.filter(
        (center) =>
          center.name.toLowerCase().includes(query) ||
          center.address.toLowerCase().includes(query)
      )
      setFilteredCenters(filtered)
    }
  }, [searchQuery, donationCenters])

  const handleCenterSelect = (center: DonationCenter) => {
    setSelectedCenter(center)
    setIsDialogOpen(true)
  }

  const handleItemQuantityChange = (itemId: number, value: string) => {
    const quantity = Number(value)
    const item = availableFoodItems.find(item => item.id === itemId)
    if (!item) return

    if (quantity >= 0 && quantity <= item.available_quantity) {
      setDonationItems(prev => ({ ...prev, [itemId]: quantity }))
    } else {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between 0 and ${item.available_quantity} for ${item.food_name}.`,
        variant: "destructive",
      })
    }
  }

  const handleDonate = async () => {
    if (!selectedCenter) {
      toast({
        title: "No Center Selected",
        description: "Please select a donation center.",
        variant: "destructive",
      })
      return
    }

    const itemsToDonate = Object.entries(donationItems)
      .filter(([_, qty]) => qty > 0)
      .map(([foodLogId, quantity]) => ({
        food_log: Number(foodLogId),
        quantity: Number(quantity),
      }))

    if (itemsToDonate.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item with a quantity to donate.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        center: selectedCenter.id,
        items: itemsToDonate,
      }

      const response = await API.post("multi-donations/", payload)
      const newDonations = response.data as DonationRecord[]

      // Update donation history with sorting
      const updatedHistory = [...donationHistory, ...newDonations].sort((a, b) => 
        parseISO(b.date_donated).getTime() - parseISO(a.date_donated).getTime()
      )
      setDonationHistory(updatedHistory)

      // Update available food items
      const updatedFoodItems = availableFoodItems.map(item => {
        const donatedItem = itemsToDonate.find(d => d.food_log === item.id)
        return donatedItem
          ? { ...item, available_quantity: item.available_quantity - donatedItem.quantity }
          : item
      }).filter(item => item.available_quantity > 0)
      setAvailableFoodItems(updatedFoodItems)

      // Reset donated quantities
      const updatedDonationItems = { ...donationItems }
      itemsToDonate.forEach(item => {
        updatedDonationItems[item.food_log] = 0
      })
      setDonationItems(updatedDonationItems)

      setIsDialogOpen(false)

      // Success alert with current date and time
      toast({
        title: "Donation Successful",
        description: `Donated ${itemsToDonate
          .map(item => `${item.quantity} of item #${item.food_log}`)
          .join(", ")} to ${selectedCenter.name} at 07:56 PM PST on Thursday, May 29, 2025.`,
      })
    } catch (error: any) {
      console.error("Donation failed:", error)
      const errorMsg = error.response?.data?.detail || "There was an error processing your donation."
      toast({
        title: "Donation Failed",
        description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateSafely = (dateString: string): string => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy")
    } catch (error) {
      console.error("Date parsing failed:", error)
      return "Invalid Date"
    }
  }

  const handleViewDetails = (donation: DonationRecord) => {
    setSelectedDonation(donation)
    setIsDetailModalOpen(true)
  }

  // Calculate donation impact metrics
  const totalItemsDonated = donationHistory.reduce((sum, record) => sum + record.quantity, 0)
  const estimatedMealsProvided = Math.round(totalItemsDonated * 0.5)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Donation Centers</h1>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Donation History</TabsTrigger>
              <TabsTrigger value="impact">Donation Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Map Section */}
                <div className="h-[600px]">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Map of Donation Centers</CardTitle>
                      <CardDescription>Click a marker to select a center and donate</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-80px)]">
                      <MapContainer
                        center={[8.9495, 125.5363] as LatLngExpression}
                        zoom={13}
                        style={{ height: "100%", width: "100%" }}
                        className="rounded-b-lg z-0"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {filteredCenters.map((center) => (
                          <Marker
                            key={center.id}
                            position={[center.latitude, center.longitude] as LatLngExpression}
                          >
                            <Popup>
                              <div className="p-3">
                                <h3 className="font-bold text-lg">{center.name}</h3>
                                <p className="text-sm text-gray-600">{center.address}</p>
                                <Button
                                  size="sm"
                                  className="mt-2 w-full"
                                  onClick={() => handleCenterSelect(center)}
                                >
                                  Select Center
                                </Button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Centers List */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Donation Centers</CardTitle>
                      <CardDescription>Select a center to donate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Search Bar */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search centers by name or address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 max-h-[510px] overflow-y-auto">
                        {filteredCenters.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No centers found.</p>
                        ) : (
                          filteredCenters.map((center) => (
                            <div
                              key={center.id}
                              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => handleCenterSelect(center)}
                            >
                              <h3 className="font-semibold text-lg">{center.name}</h3>
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{center.address}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2" />
                                  <span>{center.contact_number || "N/A"}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>{center.email || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Donation History</CardTitle>
                  <CardDescription>Your past donation records</CardDescription>
                </CardHeader>
                <CardContent>
                  {donationHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No donations recorded yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                      {donationHistory.map((donation) => (
                        <div key={donation.id} className="border rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{donation.center_name}</h4>
                              <p className="text-sm text-gray-600">
                                Date: {formatDateSafely(donation.date_donated)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Item: {donation.food_log_name} (Qty: {donation.quantity})
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                                Completed
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(donation)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impact">
              <Card>
                <CardHeader>
                  <CardTitle>Donation Impact</CardTitle>
                  <CardDescription>Your contribution to the community</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-medium text-green-800">Total Items Donated</h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">{totalItemsDonated} items</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <h3 className="text-lg font-medium text-blue-800">Estimated Meals Provided</h3>
                      <p className="text-3xl font-bold text-blue-600 mt-2">~{estimatedMealsProvided}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Donation Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] z-[10000]">
              <DialogHeader>
                <DialogTitle>Donate to {selectedCenter?.name}</DialogTitle>
                <DialogDescription>Select items and specify quantities to donate</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                <div className="space-y-2">
                  <Label>Available Items</Label>
                  <div className="border rounded-md divide-y">
                    {availableFoodItems.map((item) => (
                      <div key={item.id} className="p-3 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={item.available_quantity}
                          value={donationItems[item.id] || 0}
                          onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                          className="w-20 mr-2"
                        />
                        <label className="flex-1">
                          <span className="font-medium">{item.food_name}</span>
                          <span className="text-sm text-gray-500 block">
                            Available: {item.available_quantity} • {item.category_name} • Expires:{" "}
                            {item.expiration_date ? formatDateSafely(item.expiration_date) : "N/A"}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Center Details</Label>
                  {selectedCenter && (
                    <div className="text-sm space-y-2 border rounded-md p-3 bg-gray-50">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{selectedCenter.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{selectedCenter.contact_number || "N/A"}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{selectedCenter.email || "N/A"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Donation Summary */}
                {Object.entries(donationItems).some(([_, qty]) => qty > 0) && (
                  <div className="space-y-2">
                    <Label>Donation Summary</Label>
                    <div className="border rounded-md p-3 bg-gray-50">
                      {Object.entries(donationItems)
                        .filter(([_, qty]) => qty > 0)
                        .map(([itemId, qty]) => {
                          const item = availableFoodItems.find(i => i.id === Number(itemId))
                          return item ? (
                            <p key={itemId} className="text-sm">
                              {qty} x {item.food_name}
                            </p>
                          ) : null
                        })}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDonate} disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Confirm Donation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Donation Details Modal */}
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Donation Details</DialogTitle>
                <DialogDescription>Details of your donation record</DialogDescription>
              </DialogHeader>
              {selectedDonation && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Donation Center</Label>
                    <p className="text-sm">{selectedDonation.center_name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Date Donated</Label>
                    <p className="text-sm">{formatDateSafely(selectedDonation.date_donated)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Item Donated</Label>
                    <p className="text-sm">{selectedDonation.food_log_name} (Qty: {selectedDonation.quantity})</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Donated By</Label>
                    <p className="text-sm">{selectedDonation.user_username}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Status</Label>
                    <p className="text-sm">
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                        Completed
                      </span>
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setIsDetailModalOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}

export default DonationCenters