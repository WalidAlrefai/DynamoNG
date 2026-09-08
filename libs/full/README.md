# @dynamong/full

A meta package with no exports of its own. Installing it (`npm i @dynamong/full`) pulls in every
`@dynamong/*` component package — plus `@dynamong/core`, `@dynamong/utils`, and `@dynamong/theme` — as
real `dependencies`, guaranteed present on disk regardless of package manager.

This does **not** change how you import components. Keep importing each one from its own package, exactly
as if you'd installed it individually:

```ts
import { DynamoButton } from '@dynamong/button';
import { DynamoInputText } from '@dynamong/input-text';
```

`@dynamong/full` intentionally re-exports nothing itself — several component packages independently export
same-named convenience types (e.g. `DynamoSelectOption` from `select`, `listbox`, `select-button`, and
`picklist`), so a single barrel re-exporting all of them would collide. Use `@dynamong/full` when you want
the whole library available in one install; use individual packages when you want only what you use.

A theme preset (e.g. `@dynamong/theme-aura`) is still a separate, deliberate choice — install the one you
want alongside `@dynamong/full`.

## Building

Run `npx nx build full` to build the library.

## Running unit tests

Run `npx nx test full` to execute the unit tests via [Vitest](https://vitest.dev/).
