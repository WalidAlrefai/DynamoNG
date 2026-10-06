# @dynamong/tiered-menu

A nested, multi-level dropdown action menu — items with `children` flyout to
the side on hover, click, or arrow-key drill-down, with keyboard navigation
across every open level at once.

## Usage

```html
<dg-tiered-menu
  label="File"
  [items]="items"
  [(open)]="isOpen"
  position="bottom-start"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(item: DynamoTieredMenuItem): void { ... }
```

## Inputs

| Input             | Type                                 | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`           | `DynamoTieredMenuEntry[]` (required) | —                | The root level's entries — either a `DynamoTieredMenuItem` (`label`, optional `icon` — a plain glyph/emoji string rendered before the label, same shape as `@dynamong/menu`'s `DynamoMenuItem.icon` — `disabled`, `visible`, `shortcut`, `badge`, `children`, `command`) or a `{ separator: true }` divider entry, valid at every level including the root (unlike Menubar/MegaMenu's bars, Tiered Menu's root IS a dropdown list). `visible: false` omits an item from render AND keyboard nav entirely (not just dimmed, unlike `disabled`). `shortcut` is a display-only keyboard-hint string (e.g. `"⌘K"`), rendered as trailing `aria-hidden` text — no key binding is actually registered. `badge` (`string \| number`) renders a small trailing `dg-badge`. |
| `label`           | `string` (required)                  | —                | Trigger button text, e.g. `<dg-tiered-menu label="File">`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `position`        | `DynamoTieredMenuPosition`           | `'bottom-start'` | Root panel position: `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ariaLabel`       | `string \| undefined`                | `undefined`      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ariaDescribedby` | `string \| undefined`                | `undefined`      | Forwarded as `aria-describedby` on the trigger button.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `fluid`           | `boolean`                            | `true`           | Fills the width of its container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `open`            | `boolean` (model)                    | `false`          | Two-way bindable: `<dg-tiered-menu [(open)]="isOpen">`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `autoDisplay`     | `boolean`                            | `true`           | Whether hovering a branch row opens its flyout automatically. Set `false` so hover only moves the active-row highlight — the flyout then opens via click, or `Enter`/`Space`/`ArrowRight` from the keyboard.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Outputs

| Output       | Payload                | Fires when                                                                                                                                                                                                                                                           |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openChange` | `boolean`              | `open` changes (auto-generated by `model()`).                                                                                                                                                                                                                        |
| `itemSelect` | `DynamoTieredMenuItem` | A user commits a leaf item (one with no `children`) via click or `Enter`/`Space`. Fires before the item's own `command` callback and before the menu closes. This is `tiered-menu`'s own dedicated selection output — it doesn't reuse or extend `@dynamong/menu`'s. |

There is no separate root wrapper element — the single top-level element IS
the trigger button, so a `pt` passthrough's `root` and `trigger` parts both
merge onto that same `<button>`.

## Accessibility

- Real DOM focus never leaves the trigger button — rows across every open level use virtual focus via `aria-activedescendant` instead (several levels can be portaled open at once, so focus can't live inside any one of them). The trigger carries `role="combobox"` purely to make `aria-activedescendant` a valid attribute there.
- Keyboard on the closed trigger: `ArrowDown`/`ArrowUp`/`Enter`/`Space` open the menu.
- Keyboard while open: `ArrowDown`/`ArrowUp` move within the currently active level, `Home`/`End` jump to the first/last enabled item, `ArrowRight` drills into a branch item's children and moves navigation into that level, `ArrowLeft` walks back up a level, `Enter`/`Space` drills into a branch or commits a leaf, `Escape` closes and refocuses the trigger, `Tab` closes without trapping focus.
- Hovering a branch item drills into its children the same way as `ArrowRight`/`Enter`, unless `autoDisplay` is `false`. Only the root panel has a backdrop; clicking it closes every open level.

## Tier / dependencies

- `tier:1` (composes `@dynamong/badge` for the `badge` field, which is `tier:0` — the `@nx/enforce-module-boundaries` rule requires any component that depends on another component to sit at least one tier above it). Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/badge` (plus Angular core/CDK).

## Running unit tests

Run `nx test overlay-tiered-menu` to execute the unit tests.
