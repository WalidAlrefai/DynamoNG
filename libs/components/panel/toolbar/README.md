# @dynamong/toolbar

A horizontal action bar with three content-projection slots — start,
center, and end — for grouping buttons and other controls.

## Usage

```html
<dg-toolbar ariaLabel="Document actions">
  <div start>
    <dg-button>New</dg-button>
    <dg-button>Open</dg-button>
  </div>
  <div center>
    <h2>Untitled document</h2>
  </div>
  <div end>
    <dg-button>Save</dg-button>
  </div>
</dg-toolbar>
```

```ts
// No outputs — Toolbar is a purely presentational layout container.
```

## Inputs

| Input             | Type                  | Default     | Description                                                                                                |
| ----------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `ariaLabel`       | `string \| undefined` | `undefined` |                                                                                                            |
| `ariaLabelledBy`  | `string \| undefined` | `undefined` | References an external element's `id` for the toolbar's accessible name, as an alternative to `ariaLabel`. |
| `ariaDescribedby` | `string \| undefined` | `undefined` | Forwarded as `aria-describedby` on the `role="toolbar"` root.                                              |

Content is projected via three selectors: `[start]`, `[center]`, `[end]`.

## Outputs

None — Toolbar has no state of its own; interaction is entirely delegated to whatever controls are projected into it.

## Accessibility

- Root is `role="toolbar"` with `aria-label`/`aria-labelledby`/`aria-describedby`.
- **Real roving-tabindex keyboard navigation over whatever's projected in** — `role="toolbar"` carries a
  mandatory keyboard contract (one shared tab stop, arrow keys roving among the toolbar's own children),
  and Toolbar now provides it itself rather than assuming the projected content will: `ArrowRight`/
  `ArrowLeft` move the tab stop between every tabbable descendant across `[start]`/`[center]`/`[end]` (in
  DOM order, not per-slot), `Home`/`End` jump to the first/last. A disabled projected control is skipped
  automatically — no extra logic needed, since it's simply excluded from the candidate set.
- **Scope boundary, deliberate**: while focus is on a native control with its own meaningful arrow-key
  behavior — a text-like `<input>`, `<input type="range">`, `<input type="radio">`, `<select>`, or
  `<textarea>` — Toolbar leaves Left/Right/Home/End alone entirely, deferring to that control's own native
  editing/value/caret/group behavior instead of hijacking the keys. Only button-like content (`<button>`,
  `<a href>`, `input[type=button|submit|reset]`, or any other element bearing its own `tabindex`) gets
  toolbar-level roving navigation. A custom (non-native) focusable widget that sets its own `tabindex` but
  privately handles its own arrow keys is a known, accepted edge case this doesn't solve.
- Self-healing is DOM-observation-based (a `MutationObserver`), not an Angular lifecycle hook — a
  projected component re-rendering its own `tabindex`-bearing binding doesn't reliably notify this
  zoneless `OnPush` component, so the invariant (exactly one tab stop) is re-asserted by watching the real
  DOM directly instead.

## Design notes

**`pt` parts**: `root`, `start`, `center`, `end` — each a distinct real element.

**`fluid` deliberately NOT added**: unlike most other reviewed components, Toolbar's root style
(`'flex w-full items-center justify-between gap-2'`) is already unconditionally full-width by design — a
toolbar that didn't span its container would be an unusual, cramped look. There's no narrower default
state for a `fluid` toggle to opt into, so adding the input would be a no-op.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-toolbar` to execute the unit tests.
