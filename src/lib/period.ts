/** Monday (UTC midnight) of the ISO week containing `date` (defaults to now). */
export function currentPeriodStart(date: Date = new Date()): Date {
  const day = date.getUTCDay() || 7; // Sunday -> 7
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
}

export function periodEndFor(periodStart: Date): Date {
  const end = new Date(periodStart);
  end.setUTCDate(end.getUTCDate() + 6);
  return end;
}

export function formatPeriod(periodStart: Date): string {
  return periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
