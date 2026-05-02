import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * BUG-004 FIX: Shared filtering function for upcoming deadlines
 * Ensures dashboard count and roadmap UI display the same data
 *
 * Filtering criteria:
 * 1. Valid deadline (string or Date, not null/undefined)
 * 2. Active status (status === "active" OR isActive === true, or no status field = assume active)
 * 3. Deadline >= today (timezone-safe comparison using UTC)
 * 4. Deadline <= today + daysFromToday
 */
export function getActiveUpcomingDeadlines(
  items: any[],
  daysFromToday: number = 30,
): any[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  // Get today's date at 00:00:00 UTC for timezone-safe comparison
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Calculate end date
  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + daysFromToday);

  return items.filter((item) => {
    // 1. Check if item has a valid deadline
    if (!item.deadline) {
      return false;
    }

    let deadlineDate: Date;
    try {
      deadlineDate = new Date(item.deadline);
      // Ensure it's a valid date
      if (isNaN(deadlineDate.getTime())) {
        return false;
      }
    } catch {
      return false;
    }

    // Set deadline to 00:00:00 UTC for fair comparison
    deadlineDate.setUTCHours(0, 0, 0, 0);

    // 2. Check if item is active
    // If no status field exists, assume it's active
    const isActive =
      item.status === "active" ||
      item.isActive === true ||
      (item.status === undefined && item.isActive === undefined);
    if (!isActive) {
      return false;
    }

    // 3. Check if deadline is >= today
    if (deadlineDate < today) {
      return false;
    }

    // 4. Check if deadline is <= endDate
    if (deadlineDate > endDate) {
      return false;
    }

    return true;
  });
}
