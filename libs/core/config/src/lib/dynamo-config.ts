import { InjectionToken } from '@angular/core';

export interface DynamoConfigOptions {
  /** Name of the installed theme preset, e.g. `'aura'`. Informational only — DynamoNG does not load CSS itself. */
  theme?: string;
  /** Default visual variant for form-field-style components. */
  inputVariant?: 'outlined' | 'filled';
  /** BCP 47 locale tag used for built-in ARIA label strings (e.g. `'close'`, `'previous page'`). */
  locale?: string;
}

export type DynamoResolvedConfig = Required<DynamoConfigOptions>;

export const DYNAMO_DEFAULT_CONFIG: DynamoResolvedConfig = {
  theme: 'aura',
  inputVariant: 'outlined',
  locale: 'en',
};

/** Injected global DynamoNG configuration. Always resolved (defaults applied by `provideDynamoNG`). */
export const DYNAMONG_CONFIG = new InjectionToken<DynamoResolvedConfig>('DYNAMONG_CONFIG', {
  factory: () => DYNAMO_DEFAULT_CONFIG,
});
