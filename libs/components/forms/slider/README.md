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

| Input             | Type                                  | Default        | Description                                                                                                                                                                                 |
| ----------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`           | `number \| DynamoSliderRange` (model) | `0`            | Two-way bindable; also driven by Angular forms via `writeValue`. Becomes `DynamoSliderRange` when `range` is `true`.                                                                        |
| `min`             | `number`                              | `0`            |                                                                                                                                                                                             |
| `max`             | `number`                              | `100`          |                                                                                                                                                                                             |
| `step`            | `number`                              | `1`            | Pointer-drag commits are snapped to the nearest step (relative to `min`); keyboard commits snap to `keyboardStep` instead when set. `step <= 0` disables snapping.                          |
| `keyboardStep`    | `number \| undefined`                 | `undefined`    | Overrides `step` for keyboard Arrow/Page increments only. Unset falls back to `step` — see Design notes.                                                                                    |
| `range`           | `boolean`                             | `false`        | Renders two independently-draggable thumbs instead of one — see Design notes.                                                                                                               |
| `minRange`        | `number`                              | `0`            | Range mode only. Minimum distance enforced between the two thumbs — see Design notes.                                                                                                       |
| `disabled`        | `boolean` (model)                     | `false`        | Two-way bindable; also driven by Angular forms via `setDisabledState`.                                                                                                                      |
| `readOnly`        | `boolean`                             | `false`        | HTML `readonly` semantics: the thumb stays visible/focusable, but dragging and keyboard changes are both blocked. Unlike `disabled`, doesn't dim the track or remove it from the tab order. |
| `size`            | `DynamoSize`                          | `'md'`         |                                                                                                                                                                                             |
| `severity`        | `DynamoSeverity`                      | `'primary'`    | Color of the fill and thumb.                                                                                                                                                                |
| `ariaLabel`       | `string \| undefined`                 | `undefined`    | Defaults to `'Slider'` when unset. In range mode, each thumb's own label is derived from this (`"${ariaLabel} minimum"` / `"... maximum"`).                                                 |
| `ariaDescribedby` | `string \| undefined`                 | `undefined`    | Forwarded as `aria-describedby` on the thumb (both thumbs, in range mode).                                                                                                                  |
| `fluid`           | `boolean`                             | `true`         | Fills the width of its container in horizontal orientation. The root was already unconditionally full-width before this input existed, so this is a pure opt-out, not a behavior change.    |
| `orientation`     | `'horizontal' \| 'vertical'`          | `'horizontal'` | `'vertical'` renders a bottom-anchored track that grows upward — see Vertical orientation below. Keyboard arrows are unaffected in either orientation.                                      |
| `verticalHeight`  | `number`                              | `200`          | Track height in px — only consulted while `orientation` is `'vertical'`.                                                                                                                    |
| `showTicks`       | `boolean`                             | `false`        | Renders a dot at every `step` increment from `min` to `max`. Ignored when `tickValues` is also set.                                                                                         |
| `tickValues`      | `number[] \| undefined`               | `undefined`    | Explicit, sparse tick positions, overriding `showTicks`' step-based generation. Values outside `[min, max]` are dropped.                                                                    |
| `showTickLabels`  | `boolean`                             | `false`        | Renders each tick's numeric value as a label. Orthogonal to `showTicks`/`tickValues` — reuses whichever set of tick positions they produce.                                                 |
| `showTooltip`     | `boolean`                             | `false`        | Shows the live value in a small bubble while a thumb is actively being dragged — see Drag-value tooltip below.                                                                              |

## Outputs

| Output           | Payload                       | Fires when                                                                                                                  |
| ---------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `number \| DynamoSliderRange` | `value` changes (auto-generated by `model()`) — from a drag or a keyboard interaction (and, non-range only, a track click). |
| `disabledChange` | `boolean`                     | `disabled` changes (auto-generated by `model()`).                                                                           |

## Accessibility

- `role="slider"` thumb(s) with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-orientation`/`aria-disabled`/`aria-readonly`/`aria-describedby`.
- Keyboard (thumb focused): `ArrowRight`/`ArrowUp` and `ArrowLeft`/`ArrowDown` step by `step` (or `keyboardStep`, when set), `PageUp`/`PageDown` step by that same value `* 10`, `Home`/`End` jump to `min`/`max`.
- Pointer, non-range mode: pressing anywhere on the track jumps the thumb there and starts a drag (via pointer capture); the track and fill are non-focusable — the thumb is the sole tab stop.
- Pointer, range mode: each thumb owns its own pointerdown — dragging starts only from a handle, not the track (see Design notes).

## Design notes

**Pairwise clamping, with a configurable minimum gap.** In range mode,
the min-thumb's value can never come within `minRange` of the max-thumb's,
and vice versa — `minRange` defaults to `0` (thumbs can touch but never
cross, the original behavior). If a consumer force-writes a
crossed/under-gap `DynamoSliderRange` externally via `[(value)]`/
`writeValue`, the _display_ (`aria-valuenow`/thumb position) self-corrects
on the next render since it already routes through the same gap-clamping
logic, but the raw bound `value` stays exactly as externally set until the
next direct user interaction commits a new, clamped value.

**Per-thumb ARIA min/max reflects each handle's own movable range, not
the slider's overall bounds.** The min-thumb's `aria-valuemax` is the
max-thumb's current value (its ceiling is wherever the other handle
currently sits), and the max-thumb's `aria-valuemin` is the min-thumb's
current value — both update live as the other handle moves.

**Track-click-to-jump is intentionally not supported in range mode.** A
bare click on the track is ambiguous about which thumb should respond;
only dragging a handle directly (or its own keyboard interaction) moves
it. Non-range mode's track-click-to-jump is unaffected.

**Keyboard commits snap to their own grid, independent of pointer-drag's
grid.** `keyboardStep` (when set) governs only Arrow/Page keyboard
increments; pointer-drag always snaps to `step`. The two grids are kept
genuinely separate rather than sharing one snap function with an implicit
default — if a keyboard-computed value were re-snapped onto `step`'s grid
afterward, a `step`/`keyboardStep` pair that don't evenly divide one
another (e.g. `step: 10`, `keyboardStep: 3`) could silently round a
keypress's result straight back to where it started, eating the keypress
with no visible effect. One consequence worth knowing: display
(`aria-valuenow`/thumb position) no longer re-grids a stored value onto
`step`'s grid for rendering — it shows whatever's actually stored, bounds-
clamped only. This also means a `value` set externally off `step`'s own
grid now displays exactly as given rather than silently snapping for
display purposes only; the stored value itself was never touched by the
old behavior either way, only how it rendered.

**RTL.** Horizontal positioning (ticks, thumb, and the fill in range
mode) uses the logical `inset-inline-start` CSS property instead of
`left`, so it mirrors automatically under `dir="rtl"` with no JavaScript
direction-detection involved. Pointer-drag math can't be fixed by CSS
alone — `event.clientX` is always a physical viewport coordinate — so it
reads an injected `Directionality` (`@angular/cdk/bidi`) to flip which
edge "increasing value" drags toward. Worth knowing: this reads the
ambient direction once, synchronously, when the component is constructed;
it does not react to a `dir` attribute changing at runtime afterward.

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
track still jumps/snaps via the existing step-snapping drag behavior. Set
`showTickLabels` to also render each tick's numeric value as a label —
it's orthogonal to both `showTicks` and `tickValues`, reusing whichever
set of tick positions they produce. In dev mode, `showTicks` generating
more than 50 ticks from a small `step` logs a console warning suggesting
`tickValues` instead.

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
