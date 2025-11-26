// Helper untuk format tarikh ikut keperluan
export default function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Tarikh & masa penuh (guna bila createdAt)
  const optionsDateTime = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  // Tarikh sahaja (guna bila tarikh cuti)
  const optionsDateOnly = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  // Kalau ada jam == 00:00 → anggap tarikh sahaja
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return date.toLocaleDateString("ms-MY", optionsDateOnly);
  }

  return date.toLocaleDateString("ms-MY", optionsDateTime);
}