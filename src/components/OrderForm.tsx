"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface OrderFormProps {
  restaurantId: string;
  tableId?: string;
  onSuccess: (orderId: string) => void;
}

export function OrderForm({ restaurantId, tableId, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const { items, clearCart, totalAmount } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "dine_in" as "dine_in" | "takeaway" | "delivery",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Корзина пуста");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderItems = items.map((item) => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: item.menu_item.price,
        notes: item.notes,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_id: tableId,
          type: formData.type,
          items: orderItems,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка при оформлении заказа");
      }

      const data = await response.json();
      clearCart();
      onSuccess(data.order?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при оформлении заказа");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
          <p className="text-zinc-500 mb-4">Корзина пуста</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Вернуться к меню
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Оформление заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input
              id="name"
              placeholder="Как к вам обращаться"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Тип заказа</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as typeof formData.type,
                })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dine_in" id="dine_in" />
                <Label htmlFor="dine_in" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  В заведении
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="takeaway" id="takeaway" />
                <Label htmlFor="takeaway" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  На вынос
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Доставка
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Input
              id="notes"
              placeholder="Особые пожелания"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Товаров:</span>
              <span>
                {items.reduce((sum, item) => sum + item.quantity, 0)} шт.
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>К оплате:</span>
              <span>{totalAmount} ₽</span>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Оформление...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Оформить заказ · {totalAmount} ₽
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}