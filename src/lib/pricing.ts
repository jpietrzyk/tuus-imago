export const CANVAS_PRINT_UNIT_PRICE = 200;

export function formatPrice(price: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PLN",
  }).format(price);
}
