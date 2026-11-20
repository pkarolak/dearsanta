/** A path from the server, including any query, under the locale prefix. Safe to import from client components. */
export function localePath(locale: string, path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${suffix}`;
}
