/** UK-standard date formatting (DD/MM/YYYY) for all user-facing dates. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}
