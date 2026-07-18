import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DYNAMO_DEFAULT_CONFIG, DYNAMONG_CONFIG, DynamoConfigOptions } from './dynamo-config';

/**
 * Registers DynamoNG's global configuration. Call once in `app.config.ts`'s `providers` array,
 * mirroring Angular's own `provideRouter`/`provideHttpClient` environment-provider pattern.
 */
export function provideDynamoNG(options: DynamoConfigOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: DYNAMONG_CONFIG,
      useValue: { ...DYNAMO_DEFAULT_CONFIG, ...options },
    },
  ]);
}
