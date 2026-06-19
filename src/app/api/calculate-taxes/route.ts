import { NextResponse } from 'next/server';
import { auth } from "@/utils/auth";
import { storeTaxService } from '@/backend/modules/store';
import logger from "@/utils/logger";

const log = logger.child("src/app/api/calculate-taxes/route.ts");

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Se requiere autenticación para calcular impuestos." }, { status: 401 });
    }

    const { cartItems } = await request.json();

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: true, taxes: 0, taxBreakdown: [] });
    }

    // Group subtotals by store
    const storeSubtotals = cartItems.reduce((acc: Record<string, number>, item: any) => {
      if (item.storeId) {
        acc[item.storeId] = (acc[item.storeId] || 0) + (item.subtotal || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    let totalTaxes = 0;
    const breakdownMap: Record<string, { name: string; percentage: number; amount: number }> = {};

    for (const [storeId, subtotal] of Object.entries(storeSubtotals)) {
      const activeTaxes = await storeTaxService.getTaxesByStoreId(storeId);
      
      for (const tax of activeTaxes) {
        if (!tax.isActive) continue;
        
        const percentage = Number(tax.percentage);
        const amount = (subtotal as number) * (percentage / 100);
        totalTaxes += amount;
        
        const key = `${tax.name}_${percentage}`;
        if (!breakdownMap[key]) {
          breakdownMap[key] = {
            name: tax.name,
            percentage,
            amount: 0
          };
        }
        breakdownMap[key].amount += amount;
      }
    }

    const taxBreakdown = Object.values(breakdownMap);

    return NextResponse.json({ success: true, taxes: totalTaxes, taxBreakdown });
  } catch (error: any) {
    log.error("Error calculating cart taxes:", error);
    return NextResponse.json({ success: false, taxes: 0 }, { status: 500 });
  }
}
