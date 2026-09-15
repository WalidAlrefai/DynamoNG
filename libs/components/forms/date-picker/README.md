# @dynamong/date-picker

A text-trigger + calendar-dialog date picker with min/max range clamping
and full keyboard navigation. Implements `ControlValueAccessor`, so it also
works with `formControl`/`ngModel`.

## Usage

```html
<dg-date-picker
  [(value)]="selectedDate"
  [min]="minDate"
  [max]="maxDate"
  [weekStartsOn]="1"
  ariaLabel="Appointment date"
/>
```

```ts
protected readonly selectedDate = signal<Date | null>(null);
```

## Inputs

| Input           | Type                              | Default           | Description                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholder`   | `string`                          | `'Select a date'` | Shown in the trigger when no date is selected.                                                                                                                                                                                                                                |
| `size`          | `DynamoSize`                      | `'md'`            |                                                                                                                                                                                                                                                                               |
| `ariaLabel`     | `string \| undefined`             | `undefined`       |                                                                                                                                                                                                                                                                               |
| `min`           | `Date \| undefined`               | `undefined`       |                                                                                                                                                                                                                                                                               |
| `max`           | `Date \| undefined`               | `undefined`       |                                                                                                                                                                                                                                                                               |
| `weekStartsOn`  | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | `0`               | First weekday column of the calendar grid (`0` = Sunday).                                                                                                                                                                                                                     |
| `invalid`       | `boolean`                         | `false`           |                                                                                                                                                                                                                                                                               |
| `readOnly`      | `boolean`                         | `false`           | The trigger and calendar stay fully browsable (open, navigate months, roving focus), but selecting a day is blocked. Unlike `disabled`, doesn't remove the control from the tab order or dim its appearance.                                                                  |
| `disabledDates` | `Date[]`                          | `[]`              | Individual dates disabled beyond the `min`/`max` range — e.g. holidays. Only blocks selection, not keyboard navigation onto them (same posture as `min`/`max`).                                                                                                               |
| `disabledDays`  | `number[]`                        | `[]`              | Weekdays disabled beyond the `min`/`max` range — e.g. `[0, 6]` for weekends. `0` is Sunday, matching `date-fns`.                                                                                                                                                              |
| `clearable`     | `boolean`                         | `false`           | Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoSelect`'s own `clearable`. Ignored when `inline`, which has no trigger to attach it to.                                                                                                |
| `inline`        | `boolean`                         | `false`           | Renders the calendar directly in the page, with no trigger button or overlay — for embedding the picker permanently rather than behind a popup. Exactly one day (the currently focused one) is a native tab stop, and mounting never steals focus from elsewhere on the page. |
| `value`         | `Date \| null` (model)            | `null`            | Two-way bindable; also driven by Angular forms via `writeValue`.                                                                                                                                                                                                              |
| `disabled`      | `boolean` (model)                 | `false`           | Also driven by Angular forms via `setDisabledState`.                                                                                                                                                                                                                          |
| `open`          | `boolean` (model)                 | `false`           | Two-way bindable: `<dg-date-picker [(open)]="isOpen">`.                                                                                                                                                                                                                       |

## Outputs

| Output           | Payload        | Fires when                                                                                                 |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `Date \| null` | `value` changes (auto-generated by `model()`).                                                             |
| `disabledChange` | `boolean`      | `disabled` changes.                                                                                        |
| `openChange`     | `boolean`      | `open` changes — either the panel opening/closing via user interaction, or a programmatic write to `open`. |

## Month/year quick-jump

Clicking the month/year header label swaps the day grid for a compact
month-button grid with a year stepper, for jumping several months/years
away faster than repeated `PageUp`/`PageDown`. `Escape` closes the
quick-jump grid first (a second `Escape` then closes the whole panel).

## Accessibility

- Trigger is a native `<button>` with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `aria-invalid`, `aria-readonly`.
- Panel is `role="dialog"` (`aria-modal="false"`) containing a `role="grid"` calendar (`role="row"`/`role="columnheader"`/`role="gridcell"`), with the selected cell marked `aria-selected` and today's day button marked `aria-current="date"`. Each day button also carries a full formatted-date `aria-label` (e.g. "August 19, 2026") — the visible text is just the bare day number.
- A visually-hidden `aria-live="polite"` region announces the visible month whenever it changes (prev/next, `PageUp`/`PageDown`, `Shift+PageUp`/`Shift+PageDown`, or quick-jump), so screen-reader users don't have to re-discover the new month by re-reading the grid.
- Keyboard on the trigger: `ArrowDown`/`Enter`/`Space` opens the panel, `Escape` closes it.
- Keyboard inside the panel (roving focus over day buttons): `ArrowRight`/`ArrowLeft`/`ArrowDown`/`ArrowUp` move by day/week, `Home`/`End` jump to the start/end of the focused week, `PageUp`/`PageDown` change month (`Shift+PageUp`/`Shift+PageDown` change year), `Escape` closes and refocuses the trigger.

## Design notes

**`Intl.DateTimeFormat` caching.** The trigger/month/weekday/day-`aria-label`
formatters are all built through `getCachedDateTimeFormat()`
(`date-format-cache.ts`, exported from this package) instead of
constructing a fresh `Intl.DateTimeFormat` on every `computed()` recompute
— a formatter is stateless once built, so it's safely memoized and shared
module-wide (including across `@dynamong/date-range-picker` instances,
which reuse this same helper).

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/select` (shares its CDK Overlay open/close lifecycle via `DynamoListboxBase`).
- `date-picker.calendar.ts`'s pure grid/range helpers and `date-format-cache.ts` are also part of this package's public API (`buildCalendarGrid`, `clampToRange`, `isDateDisabled`, `getCachedDateTimeFormat`), so `@dynamong/date-range-picker` (`tier:3`) can reuse them rather than duplicating — the same "sibling depends on a peer's shared internals" precedent `DynamoMultiSelect` already sets with `DynamoListboxBase`.

## Running unit tests

Run `nx test forms-date-picker` to execute the unit tests.
