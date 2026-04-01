import { formatDistanceToNow, differenceInDays, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export function humanDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Due today';
  if (isTomorrow(date)) return 'Due tomorrow';
  if (isPast(date)) {
    const days = Math.abs(differenceInDays(new Date(), date));
    return `Overdue by ${days} day${days > 1 ? 's' : ''}`;
  }
  const days = differenceInDays(date, new Date());
  return `Due in ${days} day${days > 1 ? 's' : ''}`;
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
}

export function isDueToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return isToday(parseISO(dateStr));
}

export function daysUntilEvent(): number {
  return Math.max(0, differenceInDays(parseISO('2026-05-23'), new Date()));
}
