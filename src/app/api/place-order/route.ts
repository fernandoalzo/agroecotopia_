import { NextResponse } from 'next/server';
import { placeOrderAction } from '@/backend/modules/orders/orders.actions';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await placeOrderAction(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/place-order:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
