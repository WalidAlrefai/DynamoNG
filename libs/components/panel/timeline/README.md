# @dynamong/timeline

A list of chronological events, each with a marker dot, a connecting line
to the next event, and projected content — vertical by default, or
horizontal via `orientation`.

## Usage

```html
<dg-timeline ariaLabel="Order history">
  <dg-timeline-item severity="success">
    <strong>Order placed</strong> — Jan 3, 2026
  </dg-timeline-item>
  <dg-timeline-item severity="primary">
    <strong>Shipped</strong> — Jan 4, 2026
  </dg-timeline-item>
</dg-timeline>
```

```ts
// No outputs — Timeline and TimelineItem are purely presentational.
```

## Inputs

### `dg-timeline`

| Input             | Type                                                    | Default      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel`       | `string \| undefined`                                   | `undefined`  |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ariaDescribedby` | `string \| undefined`                                   | `undefined`  | Forwarded as `aria-describedby` on the `role="list"` root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `align`           | `'left' \| 'right' \| 'top' \| 'bottom' \| 'alternate'` | `'left'`     | Which side of the connector line each item's content renders on. `'left'`/`'top'` are the same underlying (non-reversed) state; `'right'`/`'bottom'` are the same underlying (reversed) state — spelled per-`orientation` for clarity, not independent values. `'alternate'` zigzags by index (even → first side, odd → second) around a centered connector line. Read by each `dg-timeline-item` via a direct (optional) DI lookup of `DynamoTimeline` — a standalone item outside a `dg-timeline` falls back to `'left'`/`'vertical'`. |
| `orientation`     | `'vertical' \| 'horizontal'`                            | `'vertical'` | Lays items out in a row instead of a column — every structural class (root direction, item host, marker column, connector, content spacing) rotates 90° accordingly. See Design notes.                                                                                                                                                                                                                                                                                                                                                   |
| `fluid`           | `boolean`                                               | `false`      | Stretches the root to the full available width.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### `dg-timeline-item`

| Input      | Type             | Default     | Description            |
| ---------- | ---------------- | ----------- | ---------------------- |
| `severity` | `DynamoSeverity` | `'primary'` | Colors the marker dot. |

## Outputs

None — both components are static, presentational content containers with no interactive state.

## Accessibility

- The root is `role="list"`; each `dg-timeline-item` sets `role="listitem"` on its own host element (required there rather than in its template, since a template can only style descendants of its own root, never the host itself).
- No keyboard interaction or focus management beyond whatever the projected content itself provides.

## Design notes

`align="alternate"` renders each item's own host as a 3-track grid — columns
(`content | marker | content`) in vertical orientation, rows in horizontal
— instead of the normal two-element flex row/column. The marker (dot +
connector) always sits in the fixed center track, and each item's actual
content is placed into the first or second track via `grid-column`/
`grid-row`, based on its index (`DynamoTimeline` exposes its projected items
via `contentChildren()` so each `dg-timeline-item` can look up its own
position among siblings). Even index → first track; odd → second. There's
no per-item override of which side it lands on — this stays a single signal
on `dg-timeline`, same as `align` itself.

Left out: a way to override an individual item's side in alternate mode.
No existing need, and it would turn `align` from one signal read by every
item into per-item state — a bigger surface for a case that hasn't come up.

**`orientation` is a mechanical 90° rotation of every structural class, not
a second implementation**: `flex-col` ↔ `flex-row` (root), `flex` ↔
`flex-col` with `flex-row-reverse` ↔ `flex-col-reverse` for the reversed
state (item host), `flex-col items-center` ↔ `flex-row items-center`
(marker column — dot-over-connector becomes dot-beside-connector),
`w-px`/`mt-1` ↔ `h-px`/`ms-1` (connector — a vertical line becomes a
horizontal one), `pb-6` ↔ `pe-6` (content spacing — the horizontal form
uses the logical `padding-inline-end` property so it still flips correctly
under RTL, the same convention `@dynamong/select-button`'s own `-ms-px`
already established). `group-last:hidden` (hides the last item's connector)
is purely DOM-position-based and needs no change for either axis.

**`DynamoTimelineItemPart`'s `root` part is host-only**: `group` +
`role="listitem"` + the align/orientation-driven layout must land on
`dg-timeline-item`'s own host element (the thing actually positioned as a
sibling under the list), which a template can never style directly. `pt`'s
`root` part therefore only ever merges a _class_ there — there's no element
to attach a `[dgPt]` directive instance to without the heavier
`hostDirectives` API. `marker`/`connector`/`content` are all real template
elements with full `[dgPt]` support. Same documented limitation as Org
Chart's own host-only `connector` part.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-timeline` to execute the unit tests.
