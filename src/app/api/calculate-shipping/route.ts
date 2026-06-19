import { NextResponse } from 'next/server';
import { auth } from "@/utils/auth";
import { shippingService } from "@/backend/modules/shipping";
import logger from "@/utils/logger";

const log = logger.child("src/app/api/calculate-shipping/route.ts");

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Se requiere autenticación para calcular envío." }, { status: 401 });
    }

    const { cartItems, destinationCity } = await request.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: true, totalShippingCost: 0, storeBreakdown: [] });
    }

    // Call the service
    const result = await shippingService.calculateShipping(cartItems, destinationCity);

    return NextResponse.json({ 
      success: true, 
      totalShippingCost: result.totalShippingCost, 
      storeBreakdown: result.storeBreakdown 
    });
  } catch (error: any) {
    log.error("Error calculating shipping:", error);
    return NextResponse.json({ success: false, totalShippingCost: 0 }, { status: 500 });
  }
}
