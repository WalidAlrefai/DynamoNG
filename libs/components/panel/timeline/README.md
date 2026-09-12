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

| Input | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string \| undefined` | `undefined` | |

### `dg-timeline-item`

| Input | Type | Default | Description |
|---|---|---|---|
| `severity` | `DynamoSeverity` | `'primary'` | Colors the marker dot. |

## Outputs

None — both components are static, presentational content containers with no interactive state.

## Accessibility

- The root is `role="list"`; each `dg-timeline-item` sets `role="listitem"` on its own host element (required there rather than in its template, since a template can only style descendants of its own root, never the host itself).
- No keyboard interaction or focus management beyond whatever the projected content itself provides.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-timeline` to execute the unit tests.
