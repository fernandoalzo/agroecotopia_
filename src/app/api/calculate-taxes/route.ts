import { NextResponse } from 'next/server';
import { calculateCartTaxesAction } from '@/backend/modules/orders/orders.actions';
import logger from "@/utils/logger";

const log = logger.child("src/app/api/calculate-taxes/route.ts");

export async function POST(request: Request) {
  try {
    const { cartItems } = await request.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: true, taxes: 0, taxBreakdown: [] });
    }

    const result = await calculateCartTaxesAction(cartItems);

    return NextResponse.json(result);
  } catch (error: any) {
    log.error("Error calculating cart taxes:", error);
    return NextResponse.json({ success: false, taxes: 0, taxBreakdown: [] }, { status: 500 });
  }
}
