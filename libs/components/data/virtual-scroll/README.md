# @dynamong/virtual-scroll

A fixed-size virtual-scrolling viewport for rendering large lists without
mounting every item's DOM at once, wrapping Angular CDK's scrolling
primitives behind a single projected item template.

## Usage

```html
<dg-virtual-scroll
  #vs
  [items]="rows"
  [itemSize]="36"
  [height]="240"
  [trackBy]="trackByRowId"
>
  <ng-template let-item let-i="index">
    <div class="row">{{ item.label }}</div>
  </ng-template>
</dg-virtual-scroll>
```

```ts
protected trackByRowId = (item: Row, index: number): unknown => item.id;

// Scroll programmatically via a template reference to the component:
// vs.scrollToIndex(42);
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `items` | `readonly T[]` (required) | — | |
| `itemSize` | `number` (required) | — | Fixed row height in px. Every rendered item, and the viewport's own scroll-position math, assumes this exact height. |
| `height` | `number` (required) | — | The viewport's own height in px — CDK's viewport needs an explicit CSS size and does not auto-size to its content or parent. |
| `trackBy` | `((item: T, index: number) => unknown) \| undefined` | `undefined` | `@for`-style track escape hatch, mirroring `DynamoTable`'s `trackBy`. Falls back to item reference identity when omitted. |

A required projected `<ng-template let-item let-i="index">` supplies each
row's markup, receiving `{ $implicit: item, item, index }`.

Two public methods are available via a template reference variable:
`scrollToIndex(index: number, behavior?: ScrollBehavior): void` and
`scrollToOffset(offset: number, behavior?: ScrollBehavior): void`.

Fixed-size strategy only — CDK's experimental variable-size strategy is out
of scope. A list with non-uniform row heights can't be virtualized correctly
with this component; render it unvirtualized instead.

## Outputs

None.

## Accessibility

- ARIA-transparent by design: the host, CDK's viewport, CDK's internal content wrapper, and the per-item wrapper are all `role="presentation"`, so a consumer's own `role="listbox"`/`role="rowgroup"` owns the projected rows directly through an unbroken presentational chain. Since a virtualized list can't be counted from the DOM (most rows aren't mounted), the consumer is responsible for `aria-setsize`/`aria-posinset` or `aria-rowcount`/`aria-rowindex` on the projected rows.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test data-virtual-scroll` to execute the unit tests.
