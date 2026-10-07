# @dynamong/mega-menu

A horizontal (or vertical) navigation bar whose items open a single
multi-column "mega panel" of links — simpler than Menubar (one panel level
per bar item, no nested flyouts). Use it for site-wide navigation with
grouped link listings.

## Usage

```html
<dg-mega-menu
  [items]="items"
  orientation="horizontal"
  (linkSelect)="onLinkSelect($event)"
>
  <img start src="/logo.svg" alt="Acme" />
  <dg-button end variant="text">Sign in</dg-button>
</dg-mega-menu>
```

```ts
protected readonly items: DynamoMegaMenuItem[] = [
  {
    label: 'Products',
    columns: [
      { header: 'Platform', items: [{ label: 'Overview', command: () => this.go('/platform') }] },
      { header: 'Solutions', items: [{ label: 'Enterprise', command: () => this.go('/enterprise') }] },
    ],
  },
  { label: 'Pricing', command: () => this.go('/pricing') },
];

protected onLinkSelect(link: DynamoMegaMenuLink): void { ... }
```

## Custom item/link templates

Two independent, optional projected templates — each falls back to plain text when omitted, mirroring
`@dynamong/select`'s own `contentChild(TemplateRef)` idiom:

```html
<dg-mega-menu [items]="items">
  <ng-template #itemTemplate let-item>...</ng-template>
  <ng-template #linkTemplate let-link>...</ng-template>
</dg-mega-menu>
```

- `#itemTemplate` (`let-item: DynamoMegaMenuItem`) — replaces every bar item's plain `{{ item.label }}`
  text.
- `#linkTemplate` (`let-link: DynamoMegaMenuLink`) — replaces every panel link's plain
  `{{ link.label }}` text. Independent from `#itemTemplate` since bar items and panel links are distinct
  types. Either item/link's `icon`/`shortcut`/`badge`/children-chevron still render around it
  unconditionally.

## Inputs

| Input                | Type                              | Default        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `items`              | `DynamoMegaMenuItem[]` (required) | —              | Each: `{ label, icon?, disabled?, visible?, shortcut?, badge?, columns?, command?, routerLink?, queryParams?, fragment? }`. An item with non-empty `columns` opens a mega panel on click/hover/keyboard; otherwise it's a leaf that fires `command` directly. Each `DynamoMegaMenuColumn` is `{ header?, items: DynamoMegaMenuLinkEntry[] }` — either a `DynamoMegaMenuLink` (`{ label, icon?, disabled?, visible?, shortcut?, badge?, command?, routerLink?, queryParams?, fragment? }`) or a `{ separator: true }` divider entry. `icon` (on either shape) is a plain glyph/emoji string rendered before the label — same shape as `@dynamong/menu`'s `DynamoMenuItem.icon`. `visible: false` (on either shape) omits the item/link from render AND keyboard nav entirely (not just dimmed, unlike `disabled`). `shortcut` is a display-only keyboard-hint string (e.g. `"⌘K"`), rendered as trailing `aria-hidden` text — no key binding is actually registered. `badge` (`string \| number`) renders a small trailing `dg-badge`. `routerLink` (on either shape; only honored on a leaf bar item — a branch always opens its panel regardless) renders a real `<a [routerLink]>` instead of a `<button>`/`<div>`, so middle-click/ctrl-click "open in new tab" work natively; `queryParams`/`fragment` forward to RouterLink's own inputs. If `command` is also set, both fire — `command()` runs as a side-effect alongside the navigation, never as a guard. |
| `orientation`        | `DynamoMegaMenuOrientation`       | `'horizontal'` | `'horizontal'` or `'vertical'` bar layout.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ariaLabel`          | `string \| undefined`             | `undefined`    | Labels the `role="menubar"` bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `ariaDescribedby`    | `string \| undefined`             | `undefined`    | Forwarded as `aria-describedby` on the `role="menubar"` bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `fluid`              | `boolean`                         | `true`         | Fills the width of its container in horizontal orientation. Vertical orientation keeps its own intrinsic width regardless.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `openIndex`          | `number \| null` (model)          | `null`         | Which bar item's mega panel is open, two-way bindable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `collapseBreakpoint` | `number \| null`                  | `null`         | px width threshold below which the bar collapses into a hamburger trigger. `null` disables the feature entirely — zero behavior change.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Content projected with a `start`/`end` attribute renders in wrapper slots outside the `role="menubar"` element (e.g. a logo or a sign-in button) — plain `ng-content`, no dedicated typed input.

## Outputs

| Output            | Payload              | Fires when                                                     |
| ----------------- | -------------------- | -------------------------------------------------------------- |
| `openIndexChange` | `number \| null`     | `openIndex` changes (auto-generated by `model()`).             |
| `linkSelect`      | `DynamoMegaMenuLink` | An enabled panel link is clicked or committed via Enter/Space. |

## Accessibility

- The bar is `role="menubar"`; items are `role="menuitem"` (temporarily `role="combobox"` while that item's own panel is open, since `aria-activedescendant` isn't valid on a plain `menuitem`), with `aria-haspopup`/`aria-expanded`/`aria-controls`/`aria-activedescendant` as appropriate. Real DOM focus stays on the open bar item (roving tabindex across the bar); a virtual-focus cursor moves over the open panel's links via `aria-activedescendant`. The panel itself is `role="menu"` with `role="group"` columns and `role="menuitem"` links.
- Keyboard (closed bar): the axis-appropriate arrow keys move focus (wrapping, skipping disabled items), `Home`/`End` jump, the perpendicular arrow key (or `Enter`/`Space`) opens a branch item's panel, `Enter`/`Space` on a leaf commits it.
- Keyboard (open panel): the sibling-switch keys always match whichever pair roves the closed bar for the current `orientation` (`ArrowLeft`/`ArrowRight` horizontal, `ArrowUp`/`ArrowDown` vertical) — so a key never changes meaning the instant a panel opens. The orthogonal pair moves the virtual-focus cursor within the open panel (no wrap). `Home`/`End` jump within the panel, `Enter`/`Space` commits the active link, `Escape` closes and refocuses the bar item, `Tab` closes without trapping focus.
- Hovering a sibling bar item while a panel is open switches to it, mirroring native desktop menu bars.

## Responsive collapse

Set `collapseBreakpoint` to a px width; once the bar's own measured width (via `ResizeObserver`, observing
its root element, not `window`) drops below it, the bar's `@for` of items is replaced by a single
hamburger trigger. Clicking/`Enter`/`Space`/`ArrowDown` on the hamburger opens a drawer — a vertical list
of the full `items()`, virtual-focus-only (`aria-activedescendant` on the hamburger, real DOM focus never
leaves it), the same relationship the bar's own items already have to an open panel's links, generalized
one level up. Opening a branch item's own mega panel from within the drawer reuses the exact same panel —
the drawer stays open behind it, so the user can go back and pick a different top-level item; closing the
panel (`Escape`, a link click, or its own backdrop) returns to just the drawer. Keyboard inside the drawer
(`ArrowDown`/`ArrowUp` move, `ArrowRight`/`Enter` opens a branch's panel, `Home`/`End` jump, `Escape`
closes and refocuses the hamburger) mirrors the normal closed-bar model; once a panel is open,
`collapsed()` forces the same vertical-style sibling-switch/panel-nav axis split the vertical `orientation`
already uses, regardless of the bar's own `orientation`. The hamburger's own `aria-label` is derived from
`ariaLabel` (`"${ariaLabel} menu"`, or plain `"Menu"` when unset), since it has no label text of its own
the way a normal bar item's `label` does.

## Tier / dependencies

- `tier:1` (composes `@dynamong/badge` for the `badge` field, which is `tier:0` — the `@nx/enforce-module-boundaries` rule requires any component that depends on another component to sit at least one tier above it). Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/badge`, `@angular/cdk`, `@angular/common`, `@angular/router` (the first component in this family to carry it — a peer dep, zero cost for consumers who never set `routerLink`).

## Running unit tests

Run `nx test overlay-mega-menu` to execute the unit tests.
