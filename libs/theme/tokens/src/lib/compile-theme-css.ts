import { cssVarName } from './css-var';
import type { DynamoThemeTokens, DynamoThemeTokensOverride } from './theme-tokens.types';

export interface CompileThemeCssOptions {
  /** CSS selector the base tokens are written under. Defaults to `:root`. */
  lightSelector?: string;
  /** CSS selector the dark override tokens are written under. Defaults to `.dark`. */
  darkSelector?: string;
  /** Partial token overrides applied under `darkSelector`, e.g. dark-mode surface/text colors. */
  dark?: DynamoThemeTokensOverride;
}

function declarationsFor(tokens: DynamoThemeTokensOverride): string[] {
  const lines: string[] = [];
  for (const group of Object.keys(tokens) as (keyof DynamoThemeTokens)[]) {
    const groupTokens = tokens[group];
    if (!groupTokens) continue;
    for (const [token, value] of Object.entries(groupTokens)) {
      lines.push(`  ${cssVarName(group, token)}: ${value};`);
    }
  }
  return lines;
}

/**
 * Compiles a set of design tokens into a CSS custom-properties stylesheet.
 * This is the boundary between the token layer and Tailwind: consumers never
 * see token values baked into utility classes, only these `--dg-*` variables.
 */
export function compileThemeCss(tokens: DynamoThemeTokens, options: CompileThemeCssOptions = {}): string {
  const lightSelector = options.lightSelector ?? ':root';
  const darkSelector = options.darkSelector ?? '.dark';

  const blocks = [`${lightSelector} {\n${declarationsFor(tokens).join('\n')}\n}`];

  if (options.dark) {
    const darkLines = declarationsFor(options.dark);
    if (darkLines.length > 0) {
      blocks.push(`${darkSelector} {\n${darkLines.join('\n')}\n}`);
    }
  }

  return blocks.join('\n\n') + '\n';
}
