export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Format EUR cents as "€1,234.56" (no decimals when whole). */
export function formatEuro(cents: number): string {
  const eur = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Number.isInteger(eur) ? 0 : 2,
  }).format(eur);
}
