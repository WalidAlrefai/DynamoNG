import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { compileThemeCss } from '@dynamong/theme/tokens';
import { auraDarkTokens, auraLightTokens } from '../src/lib/aura-tokens';

const outFile = resolve(
  __dirname,
  '../../../../../dist/libs/theme/presets/aura/theme.css',
);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  compileThemeCss(auraLightTokens, { dark: auraDarkTokens }),
  'utf8',
);

console.log(`Wrote ${outFile}`);
