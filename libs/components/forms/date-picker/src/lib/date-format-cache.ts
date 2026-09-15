const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * Memoized `Intl.DateTimeFormat` factory. Locale/options are effectively
 * static for the lifetime of the page (`DYNAMONG_CONFIG.locale` is a plain
 * value, not a signal), so constructing a fresh formatter inside a
 * `computed()` on every recompute — as the month/weekday/trigger labels
 * used to — is pure waste. Module-level, not per-instance: formatters are
 * stateless once built, so sharing one across every DatePicker/
 * DateRangePicker instance on the page (even across different locales) is
 * safe.
 */
export function getCachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}
