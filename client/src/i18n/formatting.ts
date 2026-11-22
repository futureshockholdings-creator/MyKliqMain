import { format, formatDistanceToNow, type FormatOptions } from 'date-fns';
import { enUS, es, fr, de, ptBR, it, zhCN, ja, ko, arSA } from 'date-fns/locale';
import i18n from './config';

const dateLocales = { en: enUS, es, fr, de, pt: ptBR, it, zh: zhCN, ja, ko, ar: arSA };
export function selectedDateLocale() {
  return dateLocales[displayLanguage()];
}
export function displayLanguage(): keyof typeof dateLocales {
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  return language in dateLocales ? language as keyof typeof dateLocales : 'en';
}

/** Display only: transport dates and stored identifiers must not use this. */
export function formatDisplayDate(date: Date | number | string, pattern: string, options?: FormatOptions): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  return format(value, pattern, { ...options, locale: dateLocales[displayLanguage()] });
}

export function formatRelativeDate(date: Date | number | string, options: { addSuffix?: boolean; includeSeconds?: boolean } = { addSuffix: true }): string {
  return formatDistanceToNow(typeof date === 'string' ? new Date(date) : date, {
    ...options,
    locale: dateLocales[displayLanguage()],
  });
}

export function formatDisplayNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(displayLanguage(), options).format(value);
}

export function formatNativeDate(date: Date | number | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(displayLanguage(), options).format(date instanceof Date ? date : new Date(date));
}
