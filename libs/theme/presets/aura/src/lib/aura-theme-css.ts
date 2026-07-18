import { compileThemeCss } from '@dynamong/theme/tokens';
import { auraDarkTokens, auraLightTokens } from './aura-tokens';

/**
 * The compiled `--dg-*` custom-properties stylesheet for the "Aura" preset, derived
 * directly from `auraLightTokens`/`auraDarkTokens` so the CSS can never drift from
 * the token source of truth. Also shipped as a prebuilt `theme.css` file (see the
 * package README) for consumers who prefer a plain CSS `@import`.
 */
export const AURA_THEME_CSS = compileThemeCss(auraLightTokens, { dark: auraDarkTokens });
