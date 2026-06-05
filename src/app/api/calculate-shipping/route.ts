import { NextResponse } from 'next/server';
import { shippingService } from '@/backend/modules/shipping/shipping.service';
import logger from "@/utils/logger";

const log = logger.child("src/app/api/calculate-shipping/route.ts");

export async function POST(request: Request) {
  try {
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
