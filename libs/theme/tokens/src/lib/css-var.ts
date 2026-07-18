export const DYNAMO_CSS_VAR_PREFIX = 'dg';

/** Converts a camelCase (or camelCase+digit) name into kebab-case, e.g. `surface0` -> `surface-0`. */
function kebabCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
}

/** Converts a camelCase token name (e.g. `primaryHover`) into its kebab-case CSS custom property name. */
export function cssVarName(group: string, token: string): string {
  return `--${DYNAMO_CSS_VAR_PREFIX}-${kebabCase(group)}-${kebabCase(token)}`;
}
