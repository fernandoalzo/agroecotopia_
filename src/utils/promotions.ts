export function calculateDiscountedPrice(productPrice: number, productPromotions?: any[], storePromotions?: any[]): number | null {
  const allPromos = [...(productPromotions || []), ...(storePromotions || [])];
  if (allPromos.length === 0) return null;

  let bestPrice = productPrice;
  let hasDiscount = false;

  const now = new Date();

  for (const promo of allPromos) {
    if (!promo.isActive || new Date(promo.expiresAt) < now) continue;

    let currentPrice = productPrice;
    const discountValue = Number(promo.discountValue);

    if (promo.discountType === "PERCENTAGE") {
      currentPrice = productPrice * (1 - discountValue / 100);
    } else if (promo.discountType === "FIXED_AMOUNT") {
      currentPrice = productPrice - discountValue;
    }

    if (currentPrice < bestPrice) {
      bestPrice = currentPrice;
      hasDiscount = true;
    }
  }

  if (bestPrice < 0) bestPrice = 0;

  return hasDiscount ? bestPrice : null;
}
