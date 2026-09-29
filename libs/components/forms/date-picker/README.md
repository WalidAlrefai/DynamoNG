# @dynamong/date-picker

A typable-input + calendar-dialog date picker with min/max range clamping,
Format/Mask, and full keyboard navigation. Implements `ControlValueAccessor`,
so it also works with `formControl`/`ngModel`.

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

| Input             | Type                                                       | Default           | Description                                                                                                                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholder`     | `string`                                                   | `'Select a date'` | Shown in the trigger when no date is selected.                                                                                                                                                                                                                                |
| `size`            | `DynamoSize`                                               | `'md'`            |                                                                                                                                                                                                                                                                               |
| `variant`         | `DynamoDatePickerVariant` (`'outlined' \| 'filled'`)       | `'outlined'`      | `'filled'` swaps the outlined look for a filled surface background — mirrors InputText's `variant`.                                                                                                                                                                           |
| `fluid`           | `boolean`                                                  | `true`            | Fills the width of its container. Defaults `true` to match every existing consumer's assumption of a full-width trigger; set `false` for PrimeNG-style intrinsic sizing.                                                                                                      |
| `ariaLabel`       | `string \| undefined`                                      | `undefined`       |                                                                                                                                                                                                                                                                               |
| `ariaDescribedby` | `string \| undefined`                                      | `undefined`       | Associates the trigger with an external help/error message element's `id` via `aria-describedby`.                                                                                                                                                                             |
| `locale`          | `string \| undefined`                                      | `undefined`       | BCP 47 locale tag overriding `DYNAMONG_CONFIG.locale` for this instance only — mirrors `@dynamong/input-number`'s `locale` input.                                                                                                                                             |
| `dateFormat`      | `string \| undefined`                                      | `undefined`       | A small token format string (`d`/`dd`/`m`/`mm`/`yy`/`yyyy` + literals, e.g. `'mm/dd/yyyy'`) governing the typed/displayed text. Unset infers the format from `locale` — see Format, Locale & Mask.                                                                            |
| `mask`            | `boolean`                                                  | `false`           | Applies a digit-only mask derived from the active format's tokens as the user types. Requires a fixed-width format (`dd`/`mm`/`yyyy`, not the flexible `d`/`m`) — a no-op otherwise.                                                                                          |
| `min`             | `Date \| undefined`                                        | `undefined`       |                                                                                                                                                                                                                                                                               |
| `max`             | `Date \| undefined`                                        | `undefined`       |                                                                                                                                                                                                                                                                               |
| `weekStartsOn`    | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6`                          | `0`               | First weekday column of the calendar grid (`0` = Sunday).                                                                                                                                                                                                                     |
| `view`            | `'date' \| 'month' \| 'year' \| 'time'`                    | `'date'`          | `'month'`/`'year'` replace the day grid with a committing month/year grid — see Month / Year Picker. `'time'` drops the calendar entirely — see Time picker only.                                                                                                             |
| `numberOfMonths`  | `number`                                                   | `1`               | Renders this many consecutive months side by side, starting from the anchor month. `view: 'date'` only — see Multiple Months.                                                                                                                                                 |
| `selectionMode`   | `DynamoDatePickerSelectionMode` (`'single' \| 'multiple'`) | `'single'`        | `'multiple'` toggles days in/out of `values` instead of committing `value` — see Multiple selection.                                                                                                                                                                          |
| `invalid`         | `boolean`                                                  | `false`           |                                                                                                                                                                                                                                                                               |
| `readOnly`        | `boolean`                                                  | `false`           | The trigger and calendar stay fully browsable (open, navigate months, roving focus), but selecting a day is blocked. Unlike `disabled`, doesn't remove the control from the tab order or dim its appearance.                                                                  |
| `disabledDates`   | `Date[]`                                                   | `[]`              | Individual dates disabled beyond the `min`/`max` range — e.g. holidays. Only blocks selection, not keyboard navigation onto them (same posture as `min`/`max`).                                                                                                               |
| `disabledDays`    | `number[]`                                                 | `[]`              | Weekdays disabled beyond the `min`/`max` range — e.g. `[0, 6]` for weekends. `0` is Sunday, matching `date-fns`.                                                                                                                                                              |
| `clearable`       | `boolean`                                                  | `false`           | Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoSelect`'s own `clearable`. Ignored when `inline`, which has no trigger to attach it to.                                                                                                |
| `inline`          | `boolean`                                                  | `false`           | Renders the calendar directly in the page, with no trigger button or overlay — for embedding the picker permanently rather than behind a popup. Exactly one day (the currently focused one) is a native tab stop, and mounting never steals focus from elsewhere on the page. |
| `showTime`        | `boolean`                                                  | `false`           | Renders hour/minute (and, with `showSeconds`, second) steppers below the calendar — see Time picker.                                                                                                                                                                          |
| `hourFormat`      | `'12' \| '24'`                                             | `'24'`            | `'12'` also renders an AM/PM toggle button next to the steppers.                                                                                                                                                                                                              |
| `showSeconds`     | `boolean`                                                  | `false`           | Also renders a seconds stepper. Ignored (seconds always zeroed on commit) while `false`, even with `showTime` on.                                                                                                                                                             |
| `showButtonBar`   | `boolean`                                                  | `false`           | Adds a Today/Clear footer below the calendar — see Button bar.                                                                                                                                                                                                                |
| `value`           | `Date \| null` (model)                                     | `null`            | Two-way bindable; also driven by Angular forms via `writeValue`. Ignored while `selectionMode` is `'multiple'` — see `values`.                                                                                                                                                |
| `values`          | `Date[]` (model)                                           | `[]`              | Two-way bindable; only meaningful while `selectionMode` is `'multiple'`. Also driven by Angular forms via `writeValue`, which branches on `Array.isArray`.                                                                                                                    |
| `disabled`        | `boolean` (model)                                          | `false`           | Also driven by Angular forms via `setDisabledState`.                                                                                                                                                                                                                          |
| `open`            | `boolean` (model)                                          | `false`           | Two-way bindable: `<dg-date-picker [(open)]="isOpen">`.                                                                                                                                                                                                                       |

## Outputs

| Output           | Payload        | Fires when                                                                                                 |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `Date \| null` | `value` changes (auto-generated by `model()`).                                                             |
| `valuesChange`   | `Date[]`       | `values` changes (auto-generated by `model()`) — only meaningful with `selectionMode="multiple"`.          |
| `disabledChange` | `boolean`      | `disabled` changes.                                                                                        |
| `openChange`     | `boolean`      | `open` changes — either the panel opening/closing via user interaction, or a programmatic write to `open`. |

## Format, Locale & Mask

The trigger is a real typable `<input>` (not just a button that opens a calendar) — you can type a
date directly instead of only picking one from the grid. `dateFormat` controls both what's displayed
and what typing parses against; leaving it unset infers a format from `locale`/the injected config's
locale via `Intl.DateTimeFormat(..., { dateStyle: 'short' })`, so Format and Locale compose for free.
`mask` layers a digit-only input mask on top, requiring a fixed-width format.

Typing doesn't commit character-by-character — the field just shows what you've typed. It commits on:

- **Enter**, if the typed text parses successfully — applies the value, syncs the calendar, and closes
  the panel. An unparseable draft on Enter is left alone (the field stays focused so you can fix it).
- **Blur**, same parse-and-apply — but an unparseable draft **reverts** to the last valid value's
  formatted text instead of staying as typed (same posture as `@dynamong/input-mask`'s `autoClear`).

Only the date portion is typable — while `showTime` is on, the input shows the full date+time text but
stays read-only-for-typing (the existing steppers still edit the time); this keeps Format/Mask scoped
to a token grammar for dates only, not a full date-time format language. Clicking the input itself
never moves focus away to the day grid (so you can click in and immediately start typing) — only
`ArrowDown`/`Enter` at the trigger, or the calendar-icon button, do that.

## Month/year quick-jump

Clicking the month/year header label swaps the day grid for a compact
month-button grid with a year stepper, for jumping several months/years
away faster than repeated `PageUp`/`PageDown`. `Escape` closes the
quick-jump grid first (a second `Escape` then closes the whole panel).

## Month / Year Picker

`view="month"`/`"year"` are separate top-level views, not the same thing as the quick-jump above (which
only _navigates_, never commits) — picking a month or year here _is_ the selection:

- `view="month"`: the panel shows only a 12-month grid (reusing the quick-jump grid's own styling/
  disabling, `Previous year`/`Next year` step the header). Clicking a month commits its first day
  (e.g. clicking "Aug" with the header on 2026 commits August 1, 2026) and closes the panel.
- `view="year"`: the panel shows a fixed 12-year block (`Previous years`/`Next years` step a full block
  at a time — not a rolling window). Clicking a year commits January 1 of that year.
- The trigger displays just the month+year / bare year, and stays read-only-for-typing in both — no
  format/mask token grammar is built for month/year text (v1 scope cut).
- `showButtonBar`/`showTime` are ignored outside `view="date"` — Today/Clear and time-of-day only make
  sense once you're picking an actual day.

## Multiple selection

`selectionMode="multiple"` toggles days in/out of `values` (a `Date[]`) instead of committing a single
`value` — clicking a day adds it if absent, removes it if already selected, and the panel stays open
across picks (close it via `Escape`, the calendar-icon button, or an outside click; there's no separate
Apply button for this mode, matching PrimeNG's own multi-select Calendar). `view: 'date'` only — a
documented scope cut, same posture as Month/Year Picker's own `view`-scoping.

- The trigger shows nothing with 0 selected (placeholder shows through), a comma-joined list of
  formatted dates with 1–2 selected, and a `"N dates selected"` summary with 3+ — stays
  read-only-for-typing, same as the other non-`'date'` typing scope cuts.
- **Today** (with `showButtonBar`) _adds_ today if it isn't already selected — a no-op if it is,
  deliberately not a toggle. **Clear** empties `values` entirely.
- `clearable`'s × button keys off `values.length` instead of `value !== null`.
- Not supported combined with `showTime` in v1 (documented cut, not runtime-guarded) — composing a
  single time-of-day with a multi-date selection is ambiguous (which date's time?).

## Multiple Months

`numberOfMonths` renders that many consecutive months side by side (`view: 'date'` only — a documented
scope cut vs Month/Year Picker, to avoid their cartesian product). `Previous`/`Next` always shift the
whole window by **one month**, not by `numberOfMonths` — matches PrimeNG's own multi-month UX, and
reuses `navigateMonth`/the header buttons unchanged.

Each grid dims its _own_ leading/trailing adjacent-month days independently — a date can render in two
adjacent grids at once (e.g. early September appears as trailing days in August's grid _and_ as real
days in September's own grid); roving keyboard focus always prefers the non-dimmed ("owned") rendering
when both exist. Arrow-key navigation that crosses a month boundary re-anchors the whole window around
the newly-focused month (the anchor always tracks the roving cursor, same pre-existing single-month
behavior) rather than leaving the window pinned in place.

## Time picker

`showTime` adds hour/minute (and, with `showSeconds`, second) steppers below the calendar. Selecting a day no
longer closes the panel while `showTime` is on — an **Apply** button does that instead, since there's now
more to do (set the time) before the user is done. Every stepper click — and every day click — still updates
the bound `value` immediately, exactly like the rest of this codebase's live-signal components; Apply's only
job is closing the panel (equivalent to clicking the trigger again or pressing `Escape`, just more
discoverable), not staging or confirming a separate pending value. Each field wraps independently at its own
boundary with no cross-field carry (e.g. decrementing the minute from `:00` goes to `:59` of the _same_ hour,
not the previous hour) — the same "small, independent, no big rollover machinery" posture as PrimeNG's own
time picker. Opening the panel seeds the steppers from the current `value`'s hours/minutes/seconds, or from
the current wall-clock time when there's no value yet. `inline` mode renders the steppers with no Apply
button (there's no popup to close).

### Time picker only

`view="time"` is a calendar-free companion to `showTime`'s combined date+time mode above — the panel
shows nothing but the hour/minute(/second) steppers and an Apply button, no day grid or month header at
all. `showTime` itself is ignored (assumed on) in this view. The steppers compose against
`value ?? focusedDate()` for the date part exactly like the combined mode does, so the date silently
stays pinned to the existing value's date (or today's, if unset) — the user never sees or picks a date
in this view. The trigger shows just the formatted time; the dialog falls back to a literal
`"Choose a time"` `aria-label` when `ariaLabel` isn't set, since there's no month label for
`aria-labelledby` to point at here. The calendar-icon trigger button also swaps to a small clock glyph
in this view.

## Button bar

`showButtonBar` adds a Today/Clear footer below the calendar. **Today** jumps to and selects today's
date (clamped to `min`/`max`, blocked by `readOnly` or a disabled day, same as clicking any other day
cell). **Clear** clears the current value and, unlike selecting a day, leaves the panel open — the
same behavior as the trigger's own `clearable` × button, which this reuses directly. When combined
with `showTime` (non-`inline`), the button bar renders as its own bordered row above the time
steppers/Apply footer, rather than merging into one row — kept as two simple, independent footers
instead of restructuring the existing Apply-button layout.

## Accessibility

- Trigger is a native `role="combobox"` `<input>` with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, `aria-invalid`, `aria-readonly`, `aria-describedby`. A separate icon-only button (`aria-label="Open calendar"`, not a tab stop) sits alongside it as the explicit mouse affordance.
- Panel is `role="dialog"` (`aria-modal="false"`) containing a `role="grid"` calendar (`role="row"`/`role="columnheader"`/`role="gridcell"`), with the selected cell marked `aria-selected` and today's day button marked `aria-current="date"`. Each day button also carries a full formatted-date `aria-label` (e.g. "August 19, 2026") — the visible text is just the bare day number.
- A visually-hidden `aria-live="polite"` region announces the visible month whenever it changes (prev/next, `PageUp`/`PageDown`, `Shift+PageUp`/`Shift+PageDown`, or quick-jump), so screen-reader users don't have to re-discover the new month by re-reading the grid.
- Keyboard on the trigger: `ArrowDown`/`Enter` opens the panel and moves focus into the day grid; `Escape` closes it. No `Space` case — it's a real textbox, so Space types a literal space instead.
- Clicking the trigger opens the panel too, but deliberately does **not** move focus into the day grid — keeping focus on the input so you can start typing immediately (see Format, Locale & Mask).
- Keyboard inside the panel (roving focus over day buttons): `ArrowRight`/`ArrowLeft`/`ArrowDown`/`ArrowUp` move by day/week, `Home`/`End` jump to the start/end of the focused week, `PageUp`/`PageDown` change month (`Shift+PageUp`/`Shift+PageDown` change year), `Escape` closes and refocuses the trigger.
- Each time field is a `role="spinbutton"` (`aria-valuenow`/`aria-valuemin`/`aria-valuemax`/`aria-valuetext`) with its own `ArrowUp`/`ArrowDown` keyboard support, alongside the visible increment/decrement buttons.
- `selectionMode="multiple"` marks each selected day's cell `aria-selected="true"`, same attribute the single-select day grid already uses.
- `view="time"` has no month header to point `aria-labelledby` at, so its dialog falls back to a literal `"Choose a time"` `aria-label` when `ariaLabel` isn't set.

## Passthrough (`pt`)

`pt.root` merges extra attributes onto the outermost wrapper around the trigger (a `display: contents`
element with no layout weight of its own); `pt.trigger` merges onto the trigger's own bordered wrapper
div (the box around the typable `<input>` + calendar-icon button + optional clear button — same
wrapper/inner split `@dynamong/select`'s trigger uses, since `pt.trigger`'s classes are visual chrome,
not something that belongs on a bare `<input>`); `pt.panel`/`pt.day`/`pt.time-field`/`pt.apply-button`
merge onto the dialog panel, every day button, every time-field stepper, and the Apply button
respectively (`pt.day`/`pt.time-field` apply the same attrs/class to every matching element, not just
one — e.g. `[pt]="{ day: { class: 'ring-1' } }"` rings every day cell). `class` is merged into each
part's own built-in classes (still applies even when `unstyled` is true); every other key is set as a
literal DOM attribute via `@dynamong/core/base`'s `DynamoPassThroughDirective`.

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
- `date-picker.calendar.ts`'s pure grid/range helpers, `date-format-cache.ts`, and `date-picker-format.ts` (the Format/Mask token helpers — `parseFormatTokens`, `formatDate`, `parseDateString`, `inferFormatFromLocale`, `applyDateMask`) are all part of this package's public API, so `@dynamong/date-range-picker` (`tier:3`) can reuse them rather than duplicating — the same "sibling depends on a peer's shared internals" precedent `DynamoMultiSelect` already sets with `DynamoListboxBase`.

## Running unit tests

Run `nx test forms-date-picker` to execute the unit tests.
