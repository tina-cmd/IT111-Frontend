"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PlusCircle, Trash2 } from "lucide-react";
import API from "../api";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { parseISO, format } from "date-fns";

// Define interfaces based on backend serializers
interface Category {
  id: number;
  name: string;
}

interface FoodItem {
  id: number;
  food_name: string;
  quantity: number;
  category: number;
  category_name: string;
  date_logged: string;
  expiration_date: string | null;
  status: string;
  user: number;
  donated_quantity: number;
  wasted_quantity: number;
  available_quantity: number;
}

const FoodLogging = () => {
  useDocumentTitle("Food Logging - FoodShare");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [food_name, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category_id, setCategoryId] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get("/categories/");
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    const fetchFoodItems = async () => {
      try {
        const response = await API.get("/foodlogs/my/");
        const allFoodLogs = response.data;
        // Filter to include only items with available_quantity > 0
        const availableFoodLogs = allFoodLogs.filter(
          (item: FoodItem) => item.available_quantity > 0 && item.status != "Expired"
        );
        setFoodItems(availableFoodLogs);
        console.log(availableFoodLogs)
      } catch (error) {
        console.error("Failed to load food items:", error);
      }
    };

    fetchFoodItems();
    fetchCategories();
  }, []);

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!food_name || !quantity || !category_id || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setModalError("Please fill in all required fields with a valid positive quantity.");
      setModalMessage(null);
      setIsModalOpen(true);
      return;
    }

    try {
      const newItem = {
        food_name,
        quantity: Number(quantity),
        category: category_id,
        expiration_date: expiryDate || null,
      };

      const response = await API.post("/foodlogs/", newItem);
      const item = response.data;
      setFoodItems((prev) => [...prev, item]);

      setFoodName("");
      setQuantity("");
      setCategoryId(null);
      setExpiryDate(null);

      setModalMessage(`${item.food_name} has been added to your inventory.`);
      setModalError(null);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Error adding food:", error);
      setModalError(
        error.response?.data?.detail || "Failed to add food item. Please try again."
      );
      setModalMessage(null);
      setIsModalOpen(true);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await API.delete(`/foodlogs/${id}/`);
      setFoodItems(foodItems.filter((item) => item.id !== id));
      toast({
        title: "Food item removed",
        description: "The item has been removed from your inventory.",
      });
    } catch (error: any) {
      console.error("Error deleting food:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete food item. Please try again.",
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage(null);
    setModalError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Food Inventory Management</h1>

          <Tabs defaultValue="inventory">
            <TabsList className="mb-6">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="add">Add Food</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Food Inventory</CardTitle>
                  <CardDescription>Manage your food items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    {foodItems.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Available Quantity</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date Logged</th>
                            <th className="px-6 py-3">Expiration Date</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foodItems.map((item) => (
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
                                {format(parseISO(item.date_logged), "MMM d, yyyy")}
                              </td>
                              <td className="px-6 py-4">
                                {item.expiration_date
                                  ? format(parseISO(item.expiration_date), "MMM d, yyyy")
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center text-gray-500 py-8">No food logs yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add Food Item</CardTitle>
                  <CardDescription>Log new food items in your inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddFood} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="food_name">Food Name</Label>
                        <Input
                          id="food_name"
                          placeholder="e.g., Apples, Bread, etc."
                          value={food_name}
                          onChange={(e) => setFoodName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          step="1"
                          placeholder="e.g., 5"
                          value={quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || (/^\d+$/.test(value) && Number(value) > 0)) {
                              setQuantity(value);
                            }
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={category_id?.toString() || ""}
                          onValueChange={(value) => setCategoryId(Number(value))}
                          required
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={expiryDate || ""}
                          onChange={(e) => setExpiryDate(e.target.value || null)}
                        />
                      </div>
                    </div>

                    <CardFooter className="px-0 pt-4">
                      <Button type="submit" className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add Food Item
                      </Button>
                    </CardFooter>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h2 className="text-xl font-bold">{modalError ? "Error" : "Success"}</h2>
            <p className="mt-2 text-gray-600">{modalError || modalMessage}</p>
            <Button onClick={closeModal} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLogging;