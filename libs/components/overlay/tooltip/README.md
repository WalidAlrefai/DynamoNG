# @dynamong/tooltip

A short, plain-text hint shown on hover and/or focus of the wrapped trigger
element. Use it for a compact label on an icon button or truncated text —
not for anything interactive (use Popover instead).

## Usage

```html
<dg-tooltip [content]="tooltipText()" position="top" trigger="both">
  <dg-button icon="save" ariaLabel="Save" />
</dg-tooltip>
```

```ts
protected readonly tooltipText = signal('Save changes');
```

## Inputs

| Input               | Type                    | Default     | Description                                                                                                                                                 |
| ------------------- | ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content`           | `string`                | `''`        | Plain-text hint. Nothing is shown, and the tooltip never opens, while empty/whitespace-only.                                                                |
| `position`          | `DynamoTooltipPosition` | `'top'`     | Preferred side; its opposite is tried first on collision, then the two remaining sides.                                                                     |
| `showDelay`         | `number`                | `300`       | Milliseconds of hover/focus before the tooltip attaches.                                                                                                    |
| `hideDelay`         | `number`                | `0`         | Milliseconds before a hover-triggered hide (`mouseleave`) detaches the panel. Focus-out and `Escape` always hide immediately.                               |
| `disabled`          | `boolean`               | `false`     | Suppresses showing; force-hides an already-visible tooltip the instant it becomes `true`.                                                                   |
| `trigger`           | `DynamoTooltipTrigger`  | `'both'`    | `'hover'`, `'focus'`, or `'both'`. Defaults to `'both'` so keyboard-only users can reach it too (WCAG 1.4.13).                                              |
| `life`              | `number \| undefined`   | `undefined` | Auto-hides the tooltip this many ms after it appears, regardless of continued hover/focus. Left unset, it only hides on mouse-leave/blur/`Escape` as usual. |
| `showOnEllipsis`    | `boolean`               | `false`     | Only shows the tooltip when the trigger's own text is actually truncated (`scrollWidth > offsetWidth`) — e.g. an ellipsis-overflowed table cell.            |
| `mouseTrack`        | `boolean`               | `false`     | Positions the panel near the cursor instead of anchored to a fixed side of the trigger — see Mouse tracking below. `position` is ignored while this is on.  |
| `mouseTrackOffsetX` | `number`                | `12`        | Px offset from the cursor to the panel's top-left corner — only consulted while `mouseTrack` is true.                                                       |
| `mouseTrackOffsetY` | `number`                | `12`        | Same, vertically.                                                                                                                                           |

## Mouse tracking

Set `mouseTrack` to follow the cursor instead of anchoring to one fixed
side of the trigger — useful over a large or irregular hit area (a
chart, a canvas, a wide row) where a fixed anchor reads oddly as the
pointer moves across it. `position` and the arrow are both irrelevant
in this mode (there's no anchored side to point from) and are ignored.

```html
<dg-tooltip [content]="hint()" [mouseTrack]="true">
  <canvas #chart></canvas>
</dg-tooltip>
```

A keyboard-triggered show (`focusin`, when `trigger` includes `'focus'`)
has no cursor position to use — it falls back to the trigger element's
own bounding-rect center, a deliberate scope decision rather than a
silent gap.

## Outputs

None — Tooltip has no `model()` or `output()`; its visibility is entirely internal, driven by hover/focus/`disabled`.

## Accessibility

- The trigger wrapper carries `aria-describedby` pointing at the tooltip's `id` only while it's visible; the panel itself is `role="tooltip"`.
- Shows on `mouseenter`/`focusin` (gated by `trigger`) and hides on `mouseleave`/`focusout`/`Escape`.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@angular/cdk`.

## Running unit tests

Run `nx test overlay-tooltip` to execute the unit tests.
