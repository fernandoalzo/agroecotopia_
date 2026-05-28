import { NextResponse } from 'next/server';
import { placeOrderAction } from '@/backend/modules/orders/orders.actions';
import logger from "@/utils/logger";

const log = logger.child("src/app/api/place-order/route.ts");

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await placeOrderAction(data);
    return NextResponse.json(result);
  } catch (error: any) {
    log.error("Error in /api/place-order:", error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
