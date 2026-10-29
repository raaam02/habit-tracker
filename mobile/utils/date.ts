import {
  format,
  parseISO,
  addDays,
  subDays,
  differenceInCalendarDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday as dateFnsIsToday,
  isYesterday as dateFnsIsYesterday,
} from 'date-fns';

/**
 * Format a Date object into a local 'YYYY-MM-DD' string.
 * Never uses UTC conversion so local day is preserved.
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a 'YYYY-MM-DD' local date string into a Date at local midnight.
 */
export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

/**
 * Get today's local date string 'YYYY-MM-DD'.
 */
export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Return weekday number: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getWeekday(dateString: string): number {
  return parseLocalDate(dateString).getDay();
}

/**
 * Add or subtract days from a YYYY-MM-DD string.
 */
export function shiftDateString(dateString: string, deltaDays: number): string {
  const date = parseLocalDate(dateString);
  const shifted = addDays(date, deltaDays);
  return formatLocalDate(shifted);
}

/**
 * Calculate calendar days difference (dateB - dateA).
 */
export function daysBetween(dateA: string, dateB: string): number {
  return differenceInCalendarDays(parseLocalDate(dateB), parseLocalDate(dateA));
}

/**
 * Returns the 7 days of the week containing the specified date,
 * respecting weekStartDay (0 = Sunday, 1 = Monday).
 */
export function getWeekDates(dateString: string, weekStartDay: 0 | 1 = 0): string[] {
  const date = parseLocalDate(dateString);
  const start = startOfWeek(date, { weekStartsOn: weekStartDay });
  const end = endOfWeek(date, { weekStartsOn: weekStartDay });
  const days = eachDayOfInterval({ start, end });
  return days.map(d => formatLocalDate(d));
}

/**
 * Check if a date string is today.
 */
export function isTodayDate(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Check if a date string is yesterday.
 */
export function isYesterdayDate(dateString: string): boolean {
  return dateString === shiftDateString(getTodayDateString(), -1);
}

/**
 * Formats a date string for large display header (e.g. "Today, Oct 29" or "Wednesday, Oct 28")
 */
export function formatHeaderDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  if (isTodayDate(dateString)) {
    return `Today, ${format(date, 'MMM d')}`;
  }
  if (isYesterdayDate(dateString)) {
    return `Yesterday, ${format(date, 'MMM d')}`;
  }
  return format(date, 'EEEE, MMM d');
}

/**
 * Formats day abbreviation (e.g. "M", "T", "W")
 */
export function formatShortDay(dateString: string): string {
  const date = parseLocalDate(dateString);
  return format(date, 'EEEEE'); // single letter
}

/**
 * Formats day number (e.g. "29")
 */
export function formatDayNumber(dateString: string): string {
  const date = parseLocalDate(dateString);
  return format(date, 'd');
}

/**
 * Get days array for the past N days ending on today (inclusive).
 */
export function getPastNDays(n: number, referenceDate: string = getTodayDateString()): string[] {
  const result: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    result.push(shiftDateString(referenceDate, -i));
  }
  return result;
}