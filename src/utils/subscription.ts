/**
 * Calculate subscription end date based on start date and package type:
 * - monthly: +1 month
 * - quarterly: +3 months
 * - biannual: +6 months
 * - annual: +1 year
 */
export function calculateSubscriptionEndDate(
  startDate: Date = new Date(),
  packageType: string = "monthly"
): string {
  const end = new Date(startDate);
  switch (packageType) {
    case "monthly":
      end.setMonth(end.getMonth() + 1);
      break;
    case "quarterly":
      end.setMonth(end.getMonth() + 3);
      break;
    case "biannual":
      end.setMonth(end.getMonth() + 6);
      break;
    case "annual":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString().split("T")[0];
}
