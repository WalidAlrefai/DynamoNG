# @dynamong/slider

A draggable range slider — click the track to jump to a value, drag the
thumb, or use the keyboard once it's focused. Implements
`ControlValueAccessor`, so it works with `formControl`/`ngModel` in
addition to `[(value)]`.

## Usage

```html
<dg-slider
  [(value)]="volume"
  [min]="0"
  [max]="100"
  [step]="5"
  ariaLabel="Volume"
/>
```

### Range mode

Set `range` to render two independently-draggable thumbs; `value` becomes
a `DynamoSliderRange` (`{minValue, maxValue}`) instead of a plain number:

```html
<dg-slider
  [(value)]="priceRange"
  [range]="true"
  [min]="0"
  [max]="200"
  ariaLabel="Price"
/>
```

```ts
protected readonly priceRange = signal<DynamoSliderRange>({ minValue: 20, maxValue: 80 });
```

## Inputs

| Input            | Type                                  | Default        | Description                                                                                                                                                                                 |
| ---------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`          | `number \| DynamoSliderRange` (model) | `0`            | Two-way bindable; also driven by Angular forms via `writeValue`. Becomes `DynamoSliderRange` when `range` is `true`.                                                                        |
| `min`            | `number`                              | `0`            |                                                                                                                                                                                             |
| `max`            | `number`                              | `100`          |                                                                                                                                                                                             |
| `step`           | `number`                              | `1`            | Values are snapped to the nearest step (relative to `min`) before clamping. `step <= 0` disables snapping.                                                                                  |
| `range`          | `boolean`                             | `false`        | Renders two independently-draggable thumbs instead of one — see Design notes.                                                                                                               |
| `disabled`       | `boolean` (model)                     | `false`        | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                      |
| `readOnly`       | `boolean`                             | `false`        | HTML `readonly` semantics: the thumb stays visible/focusable, but dragging and keyboard changes are both blocked. Unlike `disabled`, doesn't dim the track or remove it from the tab order. |
| `size`           | `DynamoSize`                          | `'md'`         |                                                                                                                                                                                             |
| `severity`       | `DynamoSeverity`                      | `'primary'`    | Color of the fill and thumb.                                                                                                                                                                |
| `ariaLabel`      | `string \| undefined`                 | `undefined`    | Defaults to `'Slider'` when unset. In range mode, each thumb's own label is derived from this (`"${ariaLabel} minimum"` / `"... maximum"`).                                                 |
| `orientation`    | `'horizontal' \| 'vertical'`          | `'horizontal'` | `'vertical'` renders a bottom-anchored track that grows upward — see Vertical orientation below. Keyboard arrows are unaffected in either orientation.                                      |
| `verticalHeight` | `number`                              | `200`          | Track height in px — only consulted while `orientation` is `'vertical'`.                                                                                                                    |
| `showTicks`      | `boolean`                             | `false`        | Renders a dot at every `step` increment from `min` to `max`. Ignored when `tickValues` is also set.                                                                                         |
| `tickValues`     | `number[] \| undefined`               | `undefined`    | Explicit, sparse tick positions, overriding `showTicks`' step-based generation. Values outside `[min, max]` are dropped.                                                                    |
| `showTooltip`    | `boolean`                             | `false`        | Shows the live value in a small bubble while a thumb is actively being dragged — see Drag-value tooltip below.                                                                              |

## Outputs

| Output           | Payload                       | Fires when                                                                                                                  |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `number \| DynamoSliderRange` | `value` changes (auto-generated by `model()`) — from a drag or a keyboard interaction (and, non-range only, a track click). |
| `disabledChange` | `boolean`                     | `disabled` changes (auto-generated by `model()`).                                                                           |

## Accessibility

- `role="slider"` thumb(s) with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-disabled`/`aria-readonly`.
- Keyboard (thumb focused): `ArrowRight`/`ArrowUp` and `ArrowLeft`/`ArrowDown` step by `step`, `PageUp`/`PageDown` step by `step * 10`, `Home`/`End` jump to `min`/`max`.
- Pointer, non-range mode: pressing anywhere on the track jumps the thumb there and starts a drag (via pointer capture); the track and fill are non-focusable — the thumb is the sole tab stop.
- Pointer, range mode: each thumb owns its own pointerdown — dragging starts only from a handle, not the track (see Design notes).

## Design notes

**Pairwise clamping.** In range mode, the min-thumb's value can never
exceed the max-thumb's, and vice versa — they can touch (0 gap) but never
cross. There's no configurable minimum gap in v1; the internal
`clampPair` helper is written so one could be added later without an
API-shape change.

**Per-thumb ARIA min/max reflects each handle's own movable range, not
the slider's overall bounds.** The min-thumb's `aria-valuemax` is the
max-thumb's current value (its ceiling is wherever the other handle
currently sits), and the max-thumb's `aria-valuemin` is the min-thumb's
current value — both update live as the other handle moves.

**Track-click-to-jump is intentionally not supported in range mode.** A
bare click on the track is ambiguous about which thumb should respond;
only dragging a handle directly (or its own keyboard interaction) moves
it — the same limitation PrimeNG's own range slider has. Non-range
mode's track-click-to-jump is unaffected.

## Vertical orientation

Set `orientation="vertical"` for a bottom-anchored track that grows
upward — the common volume-slider convention. `verticalHeight` sets the
track's pixel height (there's no natural intrinsic height for a vertical
track). Keyboard arrows need no special handling: `ArrowRight`/`ArrowUp`
already increment and `ArrowLeft`/`ArrowDown` already decrement in both
orientations.

## Tick marks

Set `showTicks` to render a dot at every `step` increment, or pass
`tickValues` for an explicit, sparse set (e.g. `[0, 25, 50, 75, 100]`)
regardless of `step`. Ticks are purely visual — clicking through to the
track still jumps/snaps via the existing step-snapping drag behavior. In
dev mode, `showTicks` generating more than 50 ticks from a small `step`
logs a console warning suggesting `tickValues` instead.

## Drag-value tooltip

Set `showTooltip` to show the live value in a small bubble while a thumb
is being dragged. It's a plain, self-contained bubble — not
`@dynamong/tooltip`, which is hover/focus-triggered and expects to wrap
projected content, a poor fit for a drag-driven signal. Two deliberate
scope cuts: it only shows while actually dragging, not on plain keyboard
focus, and (in range mode) only the thumb currently being dragged shows
its own bubble.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/forms` (`ControlValueAccessor`).

## Running unit tests

Run `nx test forms-slider` to execute the unit tests.
