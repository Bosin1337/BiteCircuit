import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const restaurantId = searchParams.get("restaurant_id");
  const tableQr = searchParams.get("qr");

  if (!restaurantId && !tableQr) {
    return NextResponse.json(
      { error: "restaurant_id or qr parameter required" },
      { status: 400 }
    );
  }

  let query = supabase.from("menu_categories").select(`
    *,
    menu_items(*)
  `);

  if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }

  const { data: categories, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, table_id, type, items, notes } = body;

  if (!restaurant_id || !items?.length) {
    return NextResponse.json(
      { error: "restaurant_id and items required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("next-auth.session-token");
  
  let userId: string | null = null;
  if (sessionCookie) {
    const { data: { user } } = await supabase.auth.getUser(
      sessionCookie.value
    );
    userId = user?.id ?? null;
  }

  const totalAmount = items.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity,
    0
  );

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id,
      table_id,
      user_id: userId,
      type: type || "dine_in",
      total_amount: totalAmount,
      notes,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const orderItems = items.map((item: { menu_item_id: string; quantity: number; price: number; notes?: string }) => ({
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
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ order });
}