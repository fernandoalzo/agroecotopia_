import { NextResponse } from 'next/server';
import { calculateShippingAction } from "@/backend/modules/shipping/shipping.actions";
import logger from "@/utils/logger";

const log = logger.child("src/app/api/calculate-shipping/route.ts");

export async function POST(request: Request) {
  try {
    const { cartItems, destinationCity } = await request.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: true, totalShippingCost: 0, storeBreakdown: [] });
    }

    const result = await calculateShippingAction(cartItems, destinationCity);

    return NextResponse.json(result);
  } catch (error: any) {
    log.error("Error calculating shipping:", error);
    return NextResponse.json({ success: false, totalShippingCost: 0, storeBreakdown: [] }, { status: 500 });
  }
}
