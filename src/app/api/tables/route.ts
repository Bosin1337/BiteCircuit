import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const restaurantId = searchParams.get("restaurant_id");
  const qrCode = searchParams.get("qr");

  if (!restaurantId && !qrCode) {
    return NextResponse.json(
      { error: "restaurant_id or qr parameter required" },
      { status: 400 }
    );
  }

  let query = supabase.from("tables").select("*");

  if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }
  if (qrCode) {
    query = query.eq("qr_code", qrCode);
  }

  const { data: tables, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tables });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { restaurant_id, number, seats } = body;

  if (!restaurant_id || !number) {
    return NextResponse.json(
      { error: "restaurant_id and number required" },
      { status: 400 }
    );
  }

  const qrCode = `${restaurant_id}-table-${number}-${Date.now()}`;

  const { data: table, error } = await supabase
    .from("tables")
    .insert({
      restaurant_id,
      number,
      seats: seats || 4,
      qr_code: qrCode,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ table });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { table_id, number, seats, is_active } = body;

  if (!table_id) {
    return NextResponse.json({ error: "table_id required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (number !== undefined) updateData.number = number;
  if (seats !== undefined) updateData.seats = seats;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data: table, error } = await supabase
    .from("tables")
    .update(updateData)
    .eq("id", table_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ table });
}