// The server stores money as whole cents. We only divide by 100 to display it.
export function formatMoney(cents, { withCurrency = true } = {}) {
  const value = (Number(cents) || 0) / 100;
  const text = value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withCurrency ? `KES ${text}` : text;
}

export function formatDate(iso) {
  // The server sends UTC times without a "Z", so add one before converting to local time.
  return new Date(iso + "Z").toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// end of file
