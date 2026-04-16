import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("order_id");
  const restaurantId = searchParams.get("restaurant_id");
  const userId = searchParams.get("user_id");
  const status = searchParams.get("status");

  if (!orderId && !restaurantId && !userId) {
    return NextResponse.json(
      { error: "order_id, restaurant_id or user_id required" },
      { status: 400 }
    );
  }

  let query = supabase.from("orders").select(`
    *,
    order_items(*),
    tables(*),
    restaurants(*)
  `);

  if (orderId) {
    query = query.eq("id", orderId);
  }
  if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { order_id, status, notes } = body;

  if (!order_id || !status) {
    return NextResponse.json(
      { error: "order_id and status required" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", order_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "order_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}