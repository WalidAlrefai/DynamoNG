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
| `align`     | `'left' \| 'right' \| 'alternate'` | `'left'`    | Which side of the connector line each item's content renders on. `'left'`/`'right'` are uniform across every item; `'alternate'` zigzags by index (even → left, odd → right) around a centered connector line. Read by each `dg-timeline-item` via a direct (optional) DI lookup of `DynamoTimeline` — a standalone item outside a `dg-timeline` falls back to `'left'`. |

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

`align="alternate"` renders each item's own host as a 3-column grid
(`content | marker | content`) instead of the normal two-column flex row —
the marker (dot + connector) always sits in the fixed center column, and
each item's actual content is placed into the left or right column via
`grid-column`, based on its index (`DynamoTimeline` exposes its projected
items via `contentChildren()` so each `dg-timeline-item` can look up its
own position among siblings). Even index → left; odd → right. There's no
per-item override of which side it lands on — this stays a single signal
on `dg-timeline`, same as `align` itself.

Left out: a way to override an individual item's side in alternate mode.
No existing need, and it would turn `align` from one signal read by every
item into per-item state — a bigger surface for a case that hasn't come up.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-timeline` to execute the unit tests.
