export function formatNumber(value?: number | null, digits = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : 'n/a'
}

export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : 'n/a'
}
