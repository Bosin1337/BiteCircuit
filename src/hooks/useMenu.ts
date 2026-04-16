import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { MenuCategory, MenuItem, Restaurant, Table, Order } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useRestaurant(restaurantId: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    async function fetchRestaurant() {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setRestaurant(data);
      }
      setLoading(false);
    }

    fetchRestaurant();
  }, [restaurantId]);

  return { restaurant, loading, error };
}

export function useMenu(restaurantId: string) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    async function fetchMenu() {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("sort_order");

      if (categoriesError) {
        setError(categoriesError.message);
        setLoading(false);
        return;
      }

      const categoryIds = categoriesData?.map((c) => c.id) || [];

      if (categoryIds.length === 0) {
        setCategories([]);
        setMenuItems([]);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .in("category_id", categoryIds)
        .eq("is_available", true)
        .order("sort_order");

      if (itemsError) {
        setError(itemsError.message);
      } else {
        setCategories(categoriesData || []);
        setMenuItems(itemsData || []);
      }
      setLoading(false);
    }

    fetchMenu();
  }, [restaurantId]);

  return { categories, menuItems, loading, error };
}

export function useTable(qrCode: string) {
  const [table, setTable] = useState<Table | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCode) return;

    async function fetchTable() {
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*, restaurants(*)")
        .eq("qr_code", qrCode)
        .single();

      if (tableError) {
        setError(tableError.message);
      } else if (tableData) {
        setTable(tableData);
        setRestaurant(tableData.restaurants);
      }
      setLoading(false);
    }

    fetchTable();
  }, [qrCode]);

  return { table, restaurant, loading, error };
}

export function useOrders(restaurantId?: string, userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId && !userId) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (restaurantId) {
        query = query.eq("restaurant_id", restaurantId);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [restaurantId, userId]);

  return { orders, loading, error };
}