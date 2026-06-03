/**
 * Format a number as Ghana Cedis (GHS).
 * Business: LOCS ALLURE, Accra, Ghana — currency is always GHS.
 */

const ghsFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a number as GHS currency. E.g. 150 → "GH₵150.00" */
export function formatGHS(amount: number): string {
  return ghsFormatter.format(amount);
}

/** Format without the symbol — useful for inputs. E.g. 150 → "150.00" */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Apply a promo code discount and return the discounted price.
 * @param price - original price in GHS
 * @param discount - discount value (percentage 0–100, or fixed GHS amount)
 * @param type - 'PERCENTAGE' or 'FIXED'
 */
export function applyDiscount(
  price: number,
  discount: number,
  type: 'PERCENTAGE' | 'FIXED',
): number {
  if (type === 'PERCENTAGE') {
    return Math.max(0, price - (price * discount) / 100);
  }
  return Math.max(0, price - discount);
}

/** Format discounted price string. E.g. applyDiscount(200, 20, 'PERCENTAGE') → "GH₵160.00" */
export function formatDiscountedPrice(
  price: number,
  discount: number,
  type: 'PERCENTAGE' | 'FIXED',
): string {
  return formatGHS(applyDiscount(price, discount, type));
}