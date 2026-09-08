// The @dynamong/full package has no exports of its own — it exists purely so
// `npm i @dynamong/full` installs every @dynamong/* component package (plus
// @dynamong/core, @dynamong/utils, @dynamong/theme) as one unit, guaranteed
// present on disk regardless of package manager. Keep importing each
// component from its own package as usual, e.g.:
//   import { DynamoButton } from '@dynamong/button';
// A single barrel re-exporting all 58 component packages from here was
// deliberately rejected: several packages independently export same-named
// types for convenience (e.g. `DynamoSelectOption` from `select`, `listbox`,
// `select-button`, and `picklist`), which a combined `export *` would collide
// on.
export {};
