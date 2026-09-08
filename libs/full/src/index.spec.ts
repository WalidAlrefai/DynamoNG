import { describe, expect, it } from 'vitest';
import * as full from './index';

describe('@dynamong/full', () => {
  it('has no exports of its own — it exists only to be depended on', () => {
    // `export {}` compiles to a module with no named bindings; Vite's ESM
    // interop adds a synthetic `default` key when star-importing it, so
    // filter that out rather than asserting on it.
    expect(Object.keys(full).filter((key) => key !== 'default')).toEqual([]);
  });
});
