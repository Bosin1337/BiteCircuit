-- BiteCircuit RLS (Row Level Security) Policies
-- Run this SQL in Supabase SQL Editor after schema.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RESTAURANTS POLICIES
-- Anyone can read active restaurants
CREATE POLICY "Anyone can read active restaurants" ON public.restaurants
  FOR SELECT USING (is_active = true);

-- Restaurant owners can manage their restaurants
CREATE POLICY "Owners can manage restaurants" ON public.restaurants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      JOIN public.restaurants r ON rs.restaurant_id = r.id
      WHERE rs.user_id = auth.uid() AND rs.role = 'manager'
    )
    OR auth.uid() = owner_id
  );

-- RESTAURANT STAFF POLICIES
-- Staff can read their restaurant staff
CREATE POLICY "Staff can read" ON public.restaurant_staff
  FOR SELECT USING (user_id = auth.uid());

-- TABLES POLICIES
-- Anyone can read tables for active restaurants
CREATE POLICY "Anyone can read tables" ON public.tables
  FOR SELECT USING (is_active = true);

-- Restaurant staff can manage tables
CREATE POLICY "Staff can manage tables" ON public.tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      WHERE rs.restaurant_id = tables.restaurant_id AND rs.user_id = auth.uid()
    )
  );

-- MENU CATEGORIES POLICIES
-- Anyone can read active menu categories
CREATE POLICY "Anyone can read categories" ON public.menu_categories
  FOR SELECT USING (is_active = true);

-- Restaurant staff can manage categories
CREATE POLICY "Staff can manage categories" ON public.menu_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      WHERE rs.restaurant_id = menu_categories.restaurant_id AND rs.user_id = auth.uid()
    )
  );

-- MENU ITEMS POLICIES
-- Anyone can read available menu items
CREATE POLICY "Anyone can read menu items" ON public.menu_items
  FOR SELECT USING (is_available = true);

-- Restaurant staff can manage menu items
CREATE POLICY "Staff can manage menu items" ON public.menu_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      JOIN public.menu_categories mc ON rs.restaurant_id = mc.restaurant_id
      WHERE rs.user_id = auth.uid() AND mc.id = menu_items.category_id
    )
  );

-- ORDERS POLICIES
-- Customers can read their own orders
CREATE POLICY "Customers can read orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

-- Customers can create orders
CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Restaurant staff can read orders for their restaurant
CREATE POLICY "Staff can read restaurant orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      WHERE rs.restaurant_id = orders.restaurant_id AND rs.user_id = auth.uid()
    )
  );

-- Restaurant staff can update orders
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      WHERE rs.restaurant_id = orders.restaurant_id AND rs.user_id = auth.uid()
    )
  );

-- ORDER ITEMS POLICIES
-- Customers can read their order items
CREATE POLICY "Customers can read order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- LOYALTY PROGRAMS POLICIES
-- Anyone can read active loyalty programs
CREATE POLICY "Anyone can read loyalty programs" ON public.loyalty_programs
  FOR SELECT USING (is_active = true);

-- USER POINTS POLICIES
-- Users can read their own points
CREATE POLICY "Users can read own points" ON public.user_points
  FOR SELECT USING (user_id = auth.uid());

-- RESERVATIONS POLICIES
-- Anyone can read reservations for their restaurant
CREATE POLICY "Read restaurant reservations" ON public.reservations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.restaurant_staff rs
      WHERE rs.restaurant_id = reservations.restaurant_id AND rs.user_id = auth.uid()
    )
  );

-- Anyone can create reservations
CREATE POLICY "Anyone can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- WAITLIST POLICIES
-- Anyone can read waitlist
CREATE POLICY "Anyone can read waitlist" ON public.waitlist
  FOR SELECT USING (true);

-- Anyone can join waitlist
CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);