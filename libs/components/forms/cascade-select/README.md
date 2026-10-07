# @dynamong/cascade-select

A drill-down dropdown for selecting a leaf from a hierarchy — each branch
opens a sibling flyout panel rather than nesting inline.

## Usage

```html
<dg-cascade-select
  [nodes]="locations"
  [(value)]="selectedCity"
  [loading]="isSaving()"
  (itemSelect)="onItemSelect($event)"
/>
```

```ts
protected onItemSelect(node: DynamoTreeNode<string>): void { ... }
```

## Inputs

| Input                   | Type                                   | Default                 | Description                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`                 | `DynamoTreeNode<TValue>[]` (required)  | —                       | The hierarchy. A node's `value` (falling back to its `id`) is what gets committed.                                                                                                                                                          |
| `placeholder`           | `string`                               | `'Select...'`           |                                                                                                                                                                                                                                             |
| `size`                  | `DynamoSize`                           | `'md'`                  |                                                                                                                                                                                                                                             |
| `invalid`               | `boolean`                              | `false`                 |                                                                                                                                                                                                                                             |
| `disabled`              | `boolean` (model)                      | `false`                 | Also driven by Angular forms.                                                                                                                                                                                                               |
| `loading`               | `boolean`                              | `false`                 | Renders a small spinner in the trigger and makes the component fully non-interactive, like `disabled`.                                                                                                                                      |
| `ariaLabel`             | `string \| undefined`                  | `undefined`             |                                                                                                                                                                                                                                             |
| `ariaDescribedby`       | `string \| undefined`                  | `undefined`             | Forwarded as `aria-describedby` on the trigger.                                                                                                                                                                                             |
| `fluid`                 | `boolean`                              | `true`                  | `true` renders the trigger `w-full`; `false` shrinks it to content width.                                                                                                                                                                   |
| `readOnly`              | `boolean`                              | `false`                 | The trigger stays focusable and the panel still opens for browsing/drilling, but committing a leaf (or, once `selectionMode !== 'single'`, toggling any row) is blocked. Unlike `disabled`, doesn't dim it or remove it from the tab order. |
| `clearable`             | `boolean`                              | `false`                 | Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoSelect`'s own `clearable`.                                                                                                                           |
| `selectionMode`         | `'single' \| 'multiple' \| 'checkbox'` | `'single'`              | `'single'` is this component's original behavior. `'multiple'`/`'checkbox'` make `value` an array — see Design notes.                                                                                                                       |
| `value`                 | `TValue \| TValue[] \| null` (model)   | `null`                  | A plain `TValue \| null` in `'single'` mode; `TValue[] \| null` in `'multiple'`/`'checkbox'` mode. Also driven by Angular forms.                                                                                                            |
| `virtualScroll`         | `boolean`                              | `false`                 | Renders every open level's row list through `@dynamong/virtual-scroll`.                                                                                                                                                                     |
| `virtualScrollItemSize` | `number`                               | `36`                    |                                                                                                                                                                                                                                             |
| `virtualScrollHeight`   | `number`                               | `240`                   |                                                                                                                                                                                                                                             |
| `filterable`            | `boolean`                              | `false`                 | Opt-in filter box above the root panel — see [Filtering](#filtering) below.                                                                                                                                                                 |
| `filterText`            | `string` (model)                       | `''`                    | Two-way bindable filter query.                                                                                                                                                                                                              |
| `filterPlaceholder`     | `string`                               | `'Search...'`           |                                                                                                                                                                                                                                             |
| `noResultsMessage`      | `string`                               | `'No matching options'` | Shown when `nodes()` is non-empty but the filter matched no leaf.                                                                                                                                                                           |

## Outputs

| Output        | Payload                      | Fires when                                                                                                                                                                               |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange` | `TValue \| TValue[] \| null` | `value` changes (auto-generated by `model()`).                                                                                                                                           |
| `itemSelect`  | `DynamoTreeNode<TValue>`     | A leaf is committed in `'single'` mode, or any row (branch or leaf) is toggled in `'multiple'`/`'checkbox'` mode — once per direct user interaction, never once per cascaded descendant. |

## Filtering

Set `filterable` to render a search box above the root panel. Typing switches
the panel from the normal nested-flyout browsing view to a **single flat list
of every matching leaf**, not a per-level narrowing of the currently-open
flyouts — each match shows its ancestor path as secondary text (e.g. "Los
Angeles — USA / California").

This is a deliberate design choice, not a simplification: CascadeSelect's
"levels" are real, independently DOM-anchored CDK flyout overlays (each one
anchored to a specific already-rendered row element from the level above),
not one substitutable rendered list the way Tree/TreeSelect's own filter
narrows in place. Synthesizing a _narrowed nested_ view while filtering would
need each intermediate level's row DOM element to already exist to anchor a
new flyout to — which isn't true until that level has actually rendered, the
same render-order dependency this component's own `buildInitialLevels`
already declines to solve for pre-drilling on reopen. The flat-list view
sidesteps this entirely: it always renders inside the already-open root
panel, so no new flyout is ever synthesized while filtering.

Match semantics: a leaf is included if its own label OR any ancestor's label
matches (typing a category name surfaces every leaf beneath it). A leaf under
a **disabled ancestor branch** is always excluded — the same branch a normal
`drillInto` refuses to open, so filtering must not make its leaves newly
reachable. A leaf that is itself disabled (with enabled ancestors) still
appears, rendered inert. Any already-open child flyouts close as soon as
filtering starts. The first `Escape` clears the filter and returns to normal
browsing; a second `Escape` (or one while already blank) closes the panel.

```html
<dg-cascade-select [nodes]="locations" [(value)]="selectedCity" filterable />
```

## Accessibility

- `role="combobox"` trigger (forwards `aria-describedby`/`aria-readonly`); each open level is its own `role="listbox"` flyout panel (`aria-multiselectable` reflects `selectionMode`) with `role="option"` rows.
- `aria-controls` on the trigger tracks whichever level currently owns keyboard focus (the deepest open one), not always the root panel.
- A branch row carries `aria-haspopup="listbox"` and, only while its own flyout is actually open, `aria-owns` pointing at that flyout's id — `aria-expanded` is **not** used here, since it isn't a valid state on `role="option"` (confirmed via axe; `aria-haspopup`/`aria-owns` both are).
- In `'checkbox'` mode, every row carries `aria-checked` (`'true'`/`'false'`/`'mixed'`) and a decorative, `aria-hidden` checkbox indicator — never a real focusable control, since rows here are `tabindex="-1"`/mouse-and-typeahead-only, the same reasoning `DynamoTreeSelect`'s own `selectionMode='checkbox'` round established.
- Keyboard: `ArrowDown`/`ArrowUp` move within a level, `ArrowRight` drills into a branch, `ArrowLeft` returns to the parent level, `Home`/`End` jump, `Enter`/`Space` drills or commits a leaf in `'single'` mode (toggles the active row in `'multiple'`/`'checkbox'` mode, without drilling), `Escape` closes.
- **Typeahead**: typing jumps the active row within the current level to the first node whose label starts with it (opens the panel from a closed trigger, matching against the root level). Switching levels (`ArrowLeft`/`ArrowRight`) clears the buffer, since it was matching against a different level's nodes. Repeating a letter cycles through matches; the buffer resets after ~500ms. Inert whenever `filterable` is enabled — the filter box's own keydown handling supersedes it. The filter box is genuinely disabled (not just visually) while `disabled`/`readOnly`.

## Design notes

**Reopening restores the full drilled path to the selected leaf, in `'single'` mode.** Earlier versions
only seeded the root level's active row to the top-level ancestor of `value`, never pre-drilling into
child/grandchild flyouts — a real render-order dependency: each intermediate level's row DOM element
needs to already exist to anchor the next flyout to, which isn't true until the previous level has
actually rendered. Fixed with a two-part approach: a synchronous, DOM-free walk (`buildAncestorChain`)
computes every level's `{ nodes, activeIndex }` down to the value's own leaf purely from data, then a
progressive `requestAnimationFrame`-polled walk opens each level only once the previous one's active row
is confirmed mounted (reusing `DynamoTree`'s own bounded-poll pattern — a single `afterNextRender` was
tried there first and found insufficient, since CDK's own mount after `scrollToIndex` settles over
several render passes, not just the next one). A generation counter guards against a rapid close→reopen
racing a still-in-flight poll from the previous open. If the walk ever stalls (a disabled ancestor, a row
that never mounts), it stops silently at the deepest confirmed level — degrading to the original
root-only behavior in the worst case, never a broken half-open state. **Only restores in `'single'`
mode** — in `'multiple'`/`'checkbox'` mode, reopening always starts at the root, since "the" drilled path
is ambiguous once a selection can span multiple scattered branches.

**`'multiple'`/`'checkbox'` repurpose click to toggle instead of drill — hover/`ArrowRight` remain the
sole drilling triggers in every mode, unchanged.** Unlike `DynamoTreeSelect`'s own `selectionMode` round,
which needed a dedicated expand _button_ (its row click is overloaded for "select" in every mode), this
component already separates "open a child flyout" (hover, or keyboard `ArrowRight`) from "commit/toggle
this item" (click, or `Enter`/`Space`) for free, in every mode, today — so no new UI affordance was
needed. Once `selectionMode() !== 'single'`, click/`Enter`/`Space` on _any_ row (branch or leaf) toggles
its cascade-selection via `selectNode`; browsing a branch's children still only ever happens via
hover/`ArrowRight`.

**The tri-state cascade-selection algorithm is a third independent copy**, after `DynamoTree`'s and
`DynamoTreeSelect`'s own. Duplicated locally rather than extracted to a shared util — a deliberate choice
matching this codebase's own established precedent (`DynamoTreeSelect` itself duplicates from
`DynamoTree`'s `tree-selection.ts` rather than sharing), not an oversight.

**The filter box switched from `[ngModel]` to a plain `[value]`/`(valueChange)` binding**, pre-emptively
avoiding the same `NgModel`/`ControlValueAccessor.setDisabledState()` race Picklist's and OrderList's own
rounds found and fixed — see `@dynamong/picklist`'s own README for the full mechanism. This filter box
has no real reactive-forms integration need, so bypassing the CVA/`NgModel` layer entirely is safe.

**A branch's flyout stays open on mouse-leave to dead space**, closing only once a _different_ sibling
row is hovered ("sibling-switch truncation"). Confirmed intentional, not a bug, matching the common UX of
comparable cascading-select widgets — a flyout that closed the instant the pointer left it would make it
nearly impossible to move the mouse from a parent row into its own child flyout.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/select`, `@dynamong/tree`, `@dynamong/spinner`, `@dynamong/virtual-scroll`, `@dynamong/input-text`, `@dynamong/icons`.

## Running unit tests

Run `nx test forms-cascade-select` to execute the unit tests.
