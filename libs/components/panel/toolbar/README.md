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

| Input | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string \| undefined` | `undefined` | |

Content is projected via three selectors: `[start]`, `[center]`, `[end]`.

## Outputs

None — Toolbar has no state of its own; interaction is entirely delegated to whatever controls are projected into it.

## Accessibility

- Root is `role="toolbar"` with `aria-label`. Keyboard navigation between the projected controls (e.g. roving tabindex, arrow-key movement) is the responsibility of whatever component is projected in — Toolbar itself imposes no navigation model beyond the standard tab order.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-toolbar` to execute the unit tests.
