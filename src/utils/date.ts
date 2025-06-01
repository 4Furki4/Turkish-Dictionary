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
