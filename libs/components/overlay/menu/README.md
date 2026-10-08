# @dynamong/menu

A dropdown action menu behind a trigger button — flat list of commands, no
nested submenus. Use it for a toolbar "..." button, a row's action menu, or
any click-to-open list of commands.

## Usage

```html
<dg-menu label="Actions" [(open)]="isOpen" (itemSelect)="onItemSelect($event)">
  <dg-menu-item value="edit" label="Edit" icon="✎" />
  <dg-menu-item value="duplicate" label="Duplicate" />
  <dg-menu-item [separator]="true" value="" label="" />
  <dg-menu-item
    value="delete"
    label="Delete"
    icon="🗑"
    [disabled]="!canDelete()"
  />
</dg-menu>
```

```ts
protected onItemSelect(event: DynamoMenuItemSelectEvent): void { ... }
```

## Custom item template

One optional projected template, falling back to plain text when omitted — mirrors `@dynamong/select`'s
own `contentChild(TemplateRef)` idiom:

```html
<dg-menu label="Actions">
  <ng-template #itemTemplate let-item>...</ng-template>
</dg-menu>
```

- `#itemTemplate` (`let-item: DynamoMenuItem`, the real component instance — its fields are signals, e.g.
  `item.label()`) — replaces every row's plain `{{ item.label() }}` text. The item's `icon`/`shortcut`/
  `badge` still render around it unconditionally.

## Inputs

| Input             | Type                  | Default          | Description                                                                                                                                                                                            |
| ----------------- | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`           | `string` (required)   | —                | Trigger button text.                                                                                                                                                                                   |
| `position`        | `DynamoMenuPosition`  | `'bottom-start'` | Preferred corner; the other three are tried as CDK collision fallbacks.                                                                                                                                |
| `ariaLabel`       | `string \| undefined` | `undefined`      | Labels the `role="menu"` panel; falls back to the trigger's id via `aria-labelledby` when omitted.                                                                                                     |
| `ariaDescribedby` | `string \| undefined` | `undefined`      | Forwarded as `aria-describedby` on the trigger button.                                                                                                                                                 |
| `fluid`           | `boolean`             | `false`          | Fills the width of its container. Defaults `false` — unlike every other reviewed trigger, this one never had a pre-existing full-width default to preserve (it's genuinely intrinsically sized today). |
| `open`            | `boolean` (model)     | `false`          | Two-way bindable panel open state.                                                                                                                                                                     |

Each projected `<dg-menu-item>` (a content-only, DOM-less component read via `contentChildren()`) takes:

| Input         | Type                                   | Default     | Description                                                                                                                                                                                                                                                                                                                     |
| ------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`       | `string` (required)                    | —           | Not rendered; forwarded verbatim in the `itemSelect` payload. Required even on a separator row — pass `value=""`.                                                                                                                                                                                                               |
| `label`       | `string` (required)                    | —           | The visible text. Required even on a separator row — pass `label=""`.                                                                                                                                                                                                                                                           |
| `disabled`    | `boolean`                              | `false`     | Skipped by keyboard navigation and typeahead-free arrow scanning; clicks are ignored.                                                                                                                                                                                                                                           |
| `icon`        | `string \| undefined`                  | `undefined` | Optional short glyph/text rendered in an `aria-hidden` span before the label — e.g. a Unicode symbol or emoji. See Design notes.                                                                                                                                                                                                |
| `separator`   | `boolean`                              | `false`     | Renders this row as a non-interactive `role="separator"` divider instead of a command. Skipped by keyboard navigation; clicks are ignored.                                                                                                                                                                                      |
| `visible`     | `boolean`                              | `true`      | When explicitly `false`, this item is omitted from render AND keyboard navigation entirely (not just dimmed, unlike `disabled`) — kept in the DOM via `[hidden]`/`aria-hidden`, not full omission, to preserve positional alignment with the internal `itemButtons()` viewChildren array that keyboard navigation indexes into. |
| `shortcut`    | `string \| undefined`                  | `undefined` | Display-only keyboard-shortcut hint text (e.g. `"⌘K"`), rendered as trailing `aria-hidden` text — no key binding is actually registered.                                                                                                                                                                                        |
| `badge`       | `string \| number \| undefined`        | `undefined` | A small trailing badge/count, rendered via `@dynamong/badge`. Purely cosmetic — no keyboard/command semantics.                                                                                                                                                                                                                  |
| `routerLink`  | `string \| string[] \| undefined`      | `undefined` | Renders a real `<a [routerLink]>` instead of a `<button>`, so middle-click/ctrl-click "open in new tab" work natively. Every item is already a leaf (no branches exist), so there's no leaf-only caveat the way Menubar's/TieredMenu's own `routerLink` has. If `(itemSelect)` is also wired, both fire.                        |
| `queryParams` | `Record<string, unknown> \| undefined` | `undefined` | Forwarded to RouterLink's own `queryParams` input when `routerLink` is set.                                                                                                                                                                                                                                                     |
| `fragment`    | `string \| undefined`                  | `undefined` | Forwarded to RouterLink's own `fragment` input when `routerLink` is set.                                                                                                                                                                                                                                                        |

## Outputs

| Output       | Payload                                                           | Fires when                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openChange` | `boolean`                                                         | `open` changes (auto-generated by `model()`).                                                                                                                            |
| `itemSelect` | `DynamoMenuItemSelectEvent` (`{ value, label, disabled, icon? }`) | An enabled item is clicked or activated via Enter/Space — a plain snapshot, never the `DynamoMenuItem` component instance. `icon` is only present when the item set one. |

## Accessibility

- Trigger is a `<button>` with `aria-haspopup="menu"`/`aria-expanded`/`aria-controls`/`aria-describedby`; the panel is `role="menu"` with `role="menuitem"` buttons/links (`aria-disabled` on disabled ones, `aria-hidden` on `visible: false` ones) and `role="separator"` divider rows.
- Keyboard: `ArrowDown` on the trigger opens and focuses the first enabled item, `ArrowUp` opens and focuses the last; inside the panel `ArrowDown`/`ArrowUp` move (wrapping, skipping disabled/invisible items and separators), `Home`/`End` jump, `Enter`/`Space` selects, `Escape` closes and returns focus to the trigger, `Tab` closes without trapping focus. Clicking the backdrop to dismiss the menu also returns focus to the trigger, matching every other dismissal path.

## Design notes

**Closing via the backdrop now refocuses the trigger, matching every other dismissal path.** Previously
only `Escape` and committing an item did; clicking outside to dismiss silently dropped focus (typically to
`document.body`) instead.

**`root`/`trigger` merge onto the single trigger button for `pt`** — like `@dynamong/tiered-menu`, Menu
has no separate root wrapper element; the trigger button IS the sole top-level element. No `pt` part
exists for the separator row (mirrors Menubar's own deliberate choice, avoiding leaking item-level `pt`
config onto a purely decorative divider).

**`icon` is a plain string, not a component or icon-registry lookup.**
`@dynamong/icons` currently exports exactly one concrete icon component
(a fixed checkmark, used internally by Checkbox/Listbox/Picklist/etc. for
a checked-state indicator) — there's no general "pick any icon" system
in this codebase to build on. `icon` mirrors `DynamoSpeedDialAction.icon`'s
exact shape instead: a short string (a Unicode symbol, emoji, or single
character) rendered verbatim in an `aria-hidden` span before the label.

**`separator` lives on `DynamoMenuItem` itself, not a second component.**
A dedicated `<dg-menu-separator>` would need Angular to interleave two
different `contentChildren()` query results in author order, which isn't
how the API works — each query returns its own type in DOM order with no
cross-type ordering guarantee. Keeping `separator` as a flag on the same
item type keeps a single `contentChildren(DynamoMenuItem)` query as the
sole source of order.

**`DynamoMenuItemSelectEvent` stays unchanged** — it does not gain `visible`/`shortcut`/`badge`/
`routerLink`/`queryParams`/`fragment`. It's a plain snapshot shared by Menu/`@dynamong/context-menu`/
`@dynamong/split-button` (both of which import `DynamoMenuItem` directly from this package); `shortcut`/
`badge` are purely cosmetic with no command semantics, and `routerLink` navigation is handled by the
`<a [routerLink]>` itself, independent of this event. Note: `DynamoMenuItem`'s new fields exist on the
shared type but aren't yet rendered by ContextMenu's/SplitButton's own templates — each has its own
independent template and hasn't had its own review round yet.

## Tier / dependencies

- `tier:1` (composes `@dynamong/badge` for the `badge` field, which is `tier:0` — the
  `@nx/enforce-module-boundaries` rule requires any component that depends on another component to sit at
  least one tier above it). Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/badge`,
  `@angular/cdk`, `@angular/common`, `@angular/router` (the first `@angular/router` dependency in this
  package — a peer dep, zero cost for consumers who never set `routerLink`). This bump cascaded to
  `@dynamong/context-menu` (which imports `DynamoMenuItem` directly), moving it from `tier:1` to `tier:2`
  — a purely mechanical tag change, zero functional effect on ContextMenu itself.

## Running unit tests

Run `nx test overlay-menu` to execute the unit tests.
