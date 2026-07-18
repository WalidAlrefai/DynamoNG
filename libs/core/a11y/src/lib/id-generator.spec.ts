import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { DynamoIdGenerator } from './id-generator';

describe('DynamoIdGenerator', () => {
  let generator: DynamoIdGenerator;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    generator = TestBed.inject(DynamoIdGenerator);
  });

  it('prefixes every generated id with the given prefix', () => {
    expect(generator.next('dialog')).toMatch(/^dialog-\d+$/);
  });

  it('never returns the same id twice, even for the same prefix', () => {
    const first = generator.next('select');
    const second = generator.next('select');

    expect(first).not.toBe(second);
  });

  it('is a singleton within a single injector, so ids stay unique across components', () => {
    const other = TestBed.inject(DynamoIdGenerator);

    expect(other).toBe(generator);
  });
});
