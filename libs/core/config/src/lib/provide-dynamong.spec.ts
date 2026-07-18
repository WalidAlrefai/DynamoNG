import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { DYNAMONG_CONFIG } from './dynamo-config';
import { provideDynamoNG } from './provide-dynamong';

describe('provideDynamoNG', () => {
  it('resolves the injected config to the built-in defaults when called with no arguments', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideDynamoNG()],
    });

    const config = TestBed.inject(DYNAMONG_CONFIG);

    expect(config).toEqual({ theme: 'aura', inputVariant: 'outlined', locale: 'en' });
  });

  it('merges caller-supplied options over the defaults', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideDynamoNG({ theme: 'nova', locale: 'fr' })],
    });

    const config = TestBed.inject(DYNAMONG_CONFIG);

    expect(config).toEqual({ theme: 'nova', inputVariant: 'outlined', locale: 'fr' });
  });

  it('falls back to the factory default when provideDynamoNG is never called', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });

    const config = TestBed.inject(DYNAMONG_CONFIG);

    expect(config.theme).toBe('aura');
  });
});
