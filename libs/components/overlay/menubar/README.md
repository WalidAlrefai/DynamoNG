# @dynamong/menubar

An always-visible, top-level horizontal navigation bar with dropdown
submenus that can themselves nest side-flyout submenus, and full keyboard
navigation — a desktop-app-style menu bar (File / Edit / View...).

## Usage

```html
<dg-menubar [items]="items" (itemSelect)="onItemSelect($event)">
  <img start src="/logo.svg" alt="Acme" />
</dg-menubar>
```

```ts
protected readonly items: DynamoMenubarItem[] = [
  {
    label: 'File',
    children: [
      { label: 'New', command: () => this.new() },
      {
        label: 'Export',
        children: [
          { label: 'PDF', command: () => this.exportAs('pdf') },
          { label: 'CSV', command: () => this.exportAs('csv') },
        ],
      },
    ],
  },
  { label: 'Help', command: () => this.openHelp() },
];

protected onItemSelect(item: DynamoMenubarItem): void { ... }
```

## Custom item template

One optional projected template, falling back to plain text when omitted — mirrors `@dynamong/select`'s
own `contentChild(TemplateRef)` idiom:

```html
<dg-menubar [items]="items">
  <ng-template #itemTemplate let-item>...</ng-template>
</dg-menubar>
```

- `#itemTemplate` (`let-item: DynamoMenubarItem`) — replaces every row's plain `{{ item.label }}` text,
  both at the bar level and inside every dropdown/flyout (they share the same item shape). The item's
  `icon`/`shortcut`/`badge`/children-chevron still render around it unconditionally.

## Inputs

| Input             | Type                             | Default          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`           | `DynamoMenubarItem[]` (required) | —                | Each: `{ label, icon?, disabled?, visible?, shortcut?, badge?, children?, command? }`. An item with non-empty `children` opens a dropdown (which can itself contain nested `children` flyouts, plus `{ separator: true }` divider entries); a leaf fires `command` directly. `icon` is a plain glyph/emoji string rendered before the label — same shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. `visible: false` omits the item from render AND keyboard nav entirely (not just dimmed, unlike `disabled`) — valid at the bar level too. `shortcut` is a display-only keyboard-hint string (e.g. `"⌘K"`), rendered as trailing `aria-hidden` text — no key binding is actually registered. `badge` (`string \| number`) renders a small trailing `dg-badge`. |
| `position`        | `DynamoMenubarPosition`          | `'bottom-start'` | Preferred corner for each bar item's level-0 dropdown; the other three are tried as CDK collision fallbacks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `ariaLabel`       | `string \| undefined`            | `undefined`      | Labels the `role="menubar"` bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ariaDescribedby` | `string \| undefined`            | `undefined`      | Forwarded as `aria-describedby` on the `role="menubar"` bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `fluid`           | `boolean`                        | `true`           | Fills the width of its container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `openIndex`       | `number \| null` (model)         | `null`           | Which bar item's dropdown is currently open, two-way bindable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

Content projected with a `start`/`end` attribute renders in wrapper slots outside the `role="menubar"` element — plain `ng-content`, no dedicated typed input.

## Outputs

| Output            | Payload             | Fires when                                                           |
| ----------------- | ------------------- | -------------------------------------------------------------------- |
| `openIndexChange` | `number \| null`    | `openIndex` changes (auto-generated by `model()`).                   |
| `itemSelect`      | `DynamoMenubarItem` | A leaf item (no `children`) is clicked or committed via Enter/Space. |

## Accessibility

- The bar is `role="menubar"`; items are `role="menuitem"` (temporarily `role="combobox"` while that item owns an open dropdown, since `aria-activedescendant` isn't valid on a plain `menuitem`), with `aria-haspopup`/`aria-expanded`/`aria-controls`/`aria-activedescendant` as appropriate. Real DOM focus stays on the open bar item (roving tabindex across the bar); a virtual-focus cursor tracks the active row within the open dropdown/flyout stack via `aria-activedescendant`. Each level is `role="menu"` with `role="menuitem"` rows.
- Keyboard (closed bar): `ArrowLeft`/`ArrowRight` move focus (wrapping, skipping disabled items), `Home`/`End` jump, `ArrowDown`/`Enter`/`Space` opens a branch item's dropdown, `Enter`/`Space` on a leaf commits it.
- Keyboard (open dropdown): `ArrowDown`/`ArrowUp` move the active row within the current level (no wrap), `Home`/`End` jump, `ArrowRight` drills into a branch row's flyout (or, at level 0, switches to the next sibling bar item if the active row is a leaf), `ArrowLeft` backs out one level (or, at level 0, switches to the previous sibling), `Enter`/`Space` drills in or commits, `Escape` closes everything and refocuses the same bar item, `Tab` closes without trapping focus.
- Hovering a sibling bar item while a dropdown is open switches to it, matching native desktop menu bars (File → Right → Edit).

## Tier / dependencies

- `tier:1` (composes `@dynamong/badge` for the `badge` field, which is `tier:0` — the `@nx/enforce-module-boundaries` rule requires any component that depends on another component to sit at least one tier above it). Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/badge`, `@angular/cdk`, `@angular/common`.

## Running unit tests

Run `nx test overlay-menubar` to execute the unit tests.
