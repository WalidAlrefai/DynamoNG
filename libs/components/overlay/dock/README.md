# @dynamong/dock

A macOS-style dock: a row (or column) of tiles that magnify toward the
pointer, each running a command when activated. Use it for a compact,
always-visible launcher bar.

## Usage

```html
<dg-dock [items]="dockItems" position="bottom" [magnification]="true" />
```

```ts
protected readonly dockItems: DynamoDockItem[] = [
  { label: 'Finder', icon: 'F', command: () => this.openFinder() },
  { label: 'Mail', icon: 'M', command: () => this.openMail() },
  { label: 'Settings', icon: 'S', disabled: true },
];
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `DynamoDockItem[]` (required) | — | Each item: `{ label, icon?, disabled?, command? }`. `icon` falls back to the label's first letter when omitted. |
| `position` | `DynamoDockPosition` | `'bottom'` | `'bottom'`/`'top'` render a horizontal row; `'left'`/`'right'` render a vertical column. |
| `magnification` | `boolean` | `true` | Whether tiles scale up as the pointer nears them. |
| `magnificationScale` | `number` | `1.6` | Peak scale factor for the tile directly under the pointer. |
| `magnificationRange` | `number` | `140` | Pixel distance from the pointer at which magnification falls to zero. |
| `ariaLabel` | `string \| undefined` | `undefined` | Labels the `role="menu"` list. |

## Outputs

None — Dock has no `model()` or `output()`; wire behavior through each item's own `command` callback.

## Accessibility

- The list is `role="menu"` (`aria-orientation` reflects `position`) with `role="menuitem"` tile buttons; a roving `tabindex` keeps exactly one tile in the Tab order at a time.
- Keyboard: the axis-appropriate arrow keys (`ArrowRight`/`ArrowLeft` for a row, `ArrowDown`/`ArrowUp` for a column) move focus, wrapping and skipping disabled tiles; `Home`/`End` jump; `Enter`/`Space` runs the focused tile's `command`.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@angular/cdk`.

## Running unit tests

Run `nx test overlay-dock` to execute the unit tests.
