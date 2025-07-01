/**
 * Format a date for display based on locale
 * @param date The date to format
 * @param locale The locale to use for formatting (en or tr)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, locale: string = 'en'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', options);
}

/**
 * Format a date and time for display based on locale
 * @param date The date to format
 * @param locale The locale to use for formatting (en or tr)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | null | undefined, locale: string = 'en'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return dateObj.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', options);
}

export function timeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };

    for (const [interval, seconds] of Object.entries(intervals)) {
        const count = Math.floor(diffInSeconds / seconds);
        if (count > 0) {
            return `${count} ${interval}${count > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}
