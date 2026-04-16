export type UserRole = "admin" | "manager" | "staff" | "customer";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  restaurant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  number: number;
  qr_code: string;
  seats: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  user_id?: string;
  status: OrderStatus;
  type: OrderType;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | "pending" 
  | "confirmed" 
  | "preparing" 
  | "ready" 
  | "completed" 
  | "cancelled";

export type OrderType = "dine_in" | "takeaway" | "delivery";

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface LoyaltyProgram {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  points_per_ruble: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPoints {
  id: string;
  user_id: string;
  program_id: string;
  points: number;
  updated_at: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  user_id?: string;
  table_id: string;
  guest_name?: string;
  guest_phone?: string;
  guest_count: number;
  date: string;
  time: string;
  status: ReservationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ReservationStatus = 
  | "pending" 
  | "confirmed" 
  | "seated" 
  | "cancelled" 
  | "no_show";