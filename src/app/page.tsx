"use client";

import { useSearchParams } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { MenuClient } from "./MenuClient";

export default function Home() {
  const searchParams = useSearchParams();
  const qrCode = searchParams.get("qr");
  const restaurantId = searchParams.get("restaurant");

  

  if (!qrCode && !restaurantId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-black">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">BiteCircuit</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Отсканируйте QR-код на столе, чтобы открыть меню
          </p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <MenuClient qrCode={qrCode} restaurantId={restaurantId} />
    </CartProvider>
  );
}