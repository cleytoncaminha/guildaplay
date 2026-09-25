export function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

export function formatRating(value: number | null) {
  return value === null ? null : value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
