import { createClient } from "@supabase/supabase-js";
import { MenuCategory, MenuItem, Restaurant, Table, Order, OrderItem } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getRestaurantByQr(qrCode: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("tables")
    .select("*, restaurants(*)")
    .eq("qr_code", qrCode)
    .single();

  if (error) return null;
  return data.restaurants;
}

export async function getTableByQr(qrCode: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("qr_code", qrCode)
    .single();

  if (error) return null;
  return data;
}

export async function getMenuByRestaurant(restaurantId: string): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
}> {
  const { data: categories, error: categoriesError } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("sort_order");

  if (categoriesError || !categories) {
    return { categories: [], items: [] };
  }

  const categoryIds = categories.map((c) => c.id);

  const { data: items, error: itemsError } = await supabase
    .from("menu_items")
    .select("*")
    .in("category_id", categoryIds)
    .eq("is_available", true)
    .order("sort_order");

  return {
    categories: categories || [],
    items: items || [],
  };
}

export async function createOrder(data: {
  restaurant_id: string;
  table_id?: string;
  user_id?: string;
  type: "dine_in" | "takeaway" | "delivery";
  items: Array<{
    menu_item_id: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  notes?: string;
}): Promise<Order | null> {
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: data.restaurant_id,
      table_id: data.table_id,
      user_id: data.user_id,
      type: data.type,
      total_amount: totalAmount,
      notes: data.notes,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Order error:", orderError);
    return null;
  }

  const orderItems = data.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
    notes: item.notes,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Order items error:", itemsError);
    return null;
  }

  return order;
}

export async function getOrderStatus(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, menu_items(*))")
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<boolean> {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return !error;
}

export async function getRestaurantTables(restaurantId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("number");

  if (error) return [];
  return data || [];
}

export async function createTable(data: {
  restaurant_id: string;
  number: number;
  seats?: number;
}): Promise<Table | null> {
  const qrCode = `${data.restaurant_id}-table-${data.number}-${Date.now()}`;

  const { data: table, error } = await supabase
    .from("tables")
    .insert({
      restaurant_id: data.restaurant_id,
      number: data.number,
      seats: data.seats || 4,
      qr_code: qrCode,
    })
    .select()
    .single();

  if (error) return null;
  return table;
}