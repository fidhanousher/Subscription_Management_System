import { addDays, addMonths, addWeeks, addYears, format } from "date-fns";
import { BillingInterval } from "@prisma/client";

export function addInterval(date: Date, interval: BillingInterval) {
  switch (interval) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addWeeks(date, 1);
    case "MONTHLY":
      return addMonths(date, 1);
    case "YEARLY":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

export function periodKey(date: Date, interval: BillingInterval) {
  if (interval === "DAILY") return format(date, "yyyy-MM-dd");
  if (interval === "WEEKLY") return format(date, "yyyy-'W'II");
  if (interval === "YEARLY") return format(date, "yyyy");
  return format(date, "yyyy-MM");
}
