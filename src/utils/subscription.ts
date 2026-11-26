/**
 * Calculate subscription end date (1 month after startDate)
 */
export function calculateSubscriptionEndDate(startDate: Date = new Date()): string {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + 1);
  return end.toISOString().split("T")[0];
}
