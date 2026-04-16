"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MenuCategory, MenuItem, Restaurant, Table } from "@/types";
import { useCart } from "@/context/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Utensils, 
  Coffee, 
  Pizza, 
  Dessert, 
  Wine,
  Search
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface MenuClientProps {
  qrCode: string | null;
  restaurantId: string | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  "Основные блюда": Utensils,
  "Салаты": Wine,
  "Супы": Utensils,
  "Десерты": Dessert,
  "Напитки": Coffee,
  "Выпечка": Pizza,
};

function getCategoryIcon(categoryName: string) {
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return Utensils;
}

export function MenuClient({ qrCode, restaurantId }: MenuClientProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { items, addItem, removeItem, updateQuantity, clearCart, totalAmount, totalCount } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        if (qrCode) {
          const { data: tableData, error: tableError } = await supabase
            .from("tables")
            .select("*, restaurants(*)")
            .eq("qr_code", qrCode)
            .single();

          if (tableError) {
            setError("Стол не найден");
            setLoading(false);
            return;
          }

          setTable(tableData);
          setRestaurant(tableData.restaurants);
        } else if (restaurantId) {
          const { data: restaurantData, error: restaurantError } = await supabase
            .from("restaurants")
            .select("*")
            .eq("id", restaurantId)
            .single();

          if (restaurantError) {
            setError("Ресторан не найден");
            setLoading(false);
            return;
          }

          setRestaurant(restaurantData);
        }

        setLoading(false);
      } catch (err) {
        setError("Ошибка загрузки данных");
        setLoading(false);
      }
    }

    fetchData();
  }, [qrCode, restaurantId]);

  useEffect(() => {
    if (!restaurant) return;

    async function fetchMenu() {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order");

      if (categoriesError || !categoriesData) {
        return;
      }

      const categoryIds = categoriesData.map((c) => c.id);

      if (categoryIds.length === 0) {
        setCategories([]);
        setMenuItems([]);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .in("category_id", categoryIds)
        .eq("is_available", true)
        .order("sort_order");

      setCategories(categoriesData);
      setMenuItems(itemsData || []);
    }

    fetchMenu();
  }, [restaurant]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = 
      activeCategory === "all" || 
      item.category_id === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (menuItem: MenuItem) => {
    addItem(menuItem);
  };

  const handleOrder = async () => {
    if (items.length === 0) return;

    const orderItems = items.map((item) => ({
      menu_item_id: item.menu_item.id,
      quantity: item.quantity,
      price: item.menu_item.price,
      notes: item.notes,
    }));

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant?.id,
          table_id: table?.id,
          type: table ? "dine_in" : "takeaway",
          items: orderItems,
        }),
      });

      if (response.ok) {
        clearCart();
        alert("Заказ успешно оформлен!");
      } else {
        alert("Ошибка при оформлении заказа");
      }
    } catch {
      alert("Ошибка при оформлении заказа");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-zinc-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const catId = item.category_id;
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900 border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="font-bold text-lg">{restaurant?.name || "Меню"}</h1>
            {table && (
              <p className="text-sm text-zinc-500">Стол №{table.number}</p>
            )}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                    {totalCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Корзина</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                {items.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">
                    Корзина пуста
                  </p>
                ) : (
                  <>
                    {items.map((item) => (
                      <div
                        key={item.menu_item.id}
                        className="flex gap-3 items-center"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.menu_item.name}</p>
                          <p className="text-sm text-zinc-500">
                            {item.menu_item.price} ₽ × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.menu_item.id,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              updateQuantity(
                                item.menu_item.id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Итого:</span>
                      <span>{totalAmount} ₽</span>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleOrder}>
                      Оформить заказ
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Поиск блюд..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="flex-1"
      >
        <TabsList className="w-full justify-start px-4 overflow-x-auto flex-nowrap bg-transparent h-auto p-0 gap-2">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4"
          >
            Все
          </TabsTrigger>
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 flex gap-2 items-center"
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Menu Items */}
        <div className="p-4 pb-24 max-w-md mx-auto space-y-6">
          {categories.map((category) => {
            const categoryItems = itemsByCategory[category.id] || [];
            if (categoryItems.length === 0) return null;

            return (
              <TabsContent key={category.id} value={category.id} className="mt-0">
                <h2 className="font-semibold text-lg mb-3">{category.name}</h2>
                <div className="space-y-3">
                  {categoryItems.map((item) => {
                    const cartItem = items.find(
                      (ci) => ci.menu_item.id === item.id
                    );
                    const quantity = cartItem?.quantity || 0;

                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {item.image_url && (
                            <div className="w-20 h-20 shrink-0 relative rounded-md overflow-hidden">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <CardContent className="flex-1 p-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-zinc-500 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <p className="font-semibold">{item.price} ₽</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              {quantity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      updateQuantity(item.id, quantity - 1)
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-medium">
                                    {quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleAddToCart(item)
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCart(item)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  В корзину
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}

          {/* All items tab */}
          <TabsContent value="all" className="mt-0">
            {filteredItems.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                Блюда не найдены
              </p>
            ) : (
              filteredItems.map((item) => {
                const cartItem = items.find(
                  (ci) => ci.menu_item.id === item.id
                );
                const quantity = cartItem?.quantity || 0;

                return (
                  <Card key={item.id} className="mb-3">
                    <div className="flex gap-3 p-3">
                      {item.image_url && (
                        <div className="w-20 h-20 shrink-0 relative rounded-md overflow-hidden">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="flex-1 p-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-zinc-500 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">{item.price} ₽</p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  updateQuantity(item.id, quantity - 1)
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleAddToCart(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              В корзину
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
            );
          })}
          </TabsContent>
        </div>
      </Tabs>

      {/* Floating Cart Button (mobile) */}
      {totalCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <Button
            className="w-full h-14 text-lg shadow-lg"
            onClick={handleOrder}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Оформить заказ · {totalAmount} ₽
          </Button>
        </div>
      )}
    </div>
  );
}