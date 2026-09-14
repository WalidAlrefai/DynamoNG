# @dynamong/timeline

A vertical list of chronological events, each with a marker dot, a
connecting line to the next event, and projected content.

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

| Input       | Type                  | Default     | Description                                                                                                                                                                                                                 |
| ----------- | --------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ariaLabel` | `string \| undefined` | `undefined` |                                                                                                                                                                                                                             |
| `align`     | `'left' \| 'right'`   | `'left'`    | Which side of the connector line every item's content renders on. Read by each `dg-timeline-item` via a direct (optional) DI lookup of `DynamoTimeline` — a standalone item outside a `dg-timeline` falls back to `'left'`. |

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

`align` is uniform across all items (`'left' | 'right'`) — a per-item
alternating layout was considered and left out: alternating sides needs each
item to know its own index among siblings, which would mean
`DynamoTimeline` starting to query its items via `contentChildren()` (it's
currently a pure `<ng-content />` passthrough). That's a real feature, but a
larger, separate piece of work from this single-signal `align` addition.
Also left out: a secondary content-projection slot on the far side of the
marker — no existing need, and `align` alone already covers the common
"flip which side content sits on" request.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-timeline` to execute the unit tests.
