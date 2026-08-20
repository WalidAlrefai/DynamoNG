import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — select.html only ever binds `[class]="...Classes()"`.
//
// This styles the WRAPPER div, not the combobox `<button>` itself: the
// wrapper also hosts an optional clear button as the button's *sibling*
// (a `<button>` cannot legally contain another `<button>` per the HTML
// content model — nesting them is an axe/a11y violation), so the visual
// chrome (border/bg/size/focus ring) lives here and reacts to the inner
// button's focus via `focus-within`, since the wrapper itself is never
// the focused element.
export const selectTriggerStyles = cva(
  'flex w-full items-center gap-2 rounded-md border bg-surface-0 text-text-primary ' +
    'transition-colors focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-5 text-lg',
      },
      invalid: {
        true: 'border-danger focus-within:ring-danger',
        false: 'border-border focus-within:ring-ring',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

// The actual `role="combobox"` element inside the wrapper — transparent and
// unstyled beyond layout, since the wrapper already provides the visible
// border/background/padding.
export const selectTriggerButtonStyles =
  'min-w-0 flex-1 truncate bg-transparent text-left outline-none disabled:cursor-not-allowed';

// `ms-auto` pins the chevron to the end of the trigger row. In
// `DynamoSelect` this is a no-op — the inner combobox `<button>` already has
// `flex-1` and consumes all remaining space, so there's never a gap before
// the chevron either way. In `DynamoMultiSelect`, nothing else in the
// `flex-wrap` tag row claims the remaining space, so without `ms-auto` the
// chevron just sits immediately after the last tag/placeholder instead of
// at the trigger's trailing edge whenever there's slack (few tags, a short
// placeholder).
export const selectChevronStyles = cva(
  'ms-auto shrink-0 transition-transform duration-200 ease-out',
  {
    variants: {
      open: {
        true: 'rotate-180',
        false: '',
      },
    },
    defaultVariants: { open: false },
  },
);

// Mirrors `chipRemoveButtonStyles` — `hover:bg-current/10` tints against
// whatever text color the trigger already resolved to.
export const selectClearButtonStyles =
  'inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-1';

// The panel's outer wrapper — NOT the `<ul role="listbox">` itself. The
// filter box and select-all/clear-all row (real `<input>`/`<button>`
// elements) must live outside the `listbox`, since ARIA's `listbox` role
// only permits `option`/`group` as owned children — nesting an `input` or
// `button` inside it is an `aria-required-children` violation (axe caught
// this in DynamoMultiSelect's own a11y spec). So this wrapper carries the
// border/shadow/bg/scroll chrome for the whole panel (filter + actions +
// list scroll together), and the `<ul>` inside it is bare.
//
// Fixed min-width rather than matching the trigger's width: once portaled by
// CDK Overlay the panel is no longer a DOM sibling of the trigger, so it
// can't rely on a `w-full`-inside-`relative` parent trick the way the old
// CSS-positioned panel did. Same fixed-width approach as `menuPanelStyles`.
export const selectPanelWrapperStyles =
  'z-10 min-w-[12rem] max-h-60 overflow-auto rounded-md border border-border bg-surface-0 shadow-lg';

export const selectListboxStyles = 'py-1';

// Shared by DynamoSelect and DynamoMultiSelect — the panel/option/group
// chrome is structurally identical between single- and multi-select.
export const selectFilterWrapperStyles = 'border-b border-border p-2';

// Wraps `<dg-input-text>` so the trailing search icon (below) can be
// absolutely positioned against it — matches PrimeNG's MultiSelect/Select
// filter box, which docks its search icon at the input's trailing edge.
// `flex-1 min-w-0` is required in `DynamoMultiSelect`'s header row (a flex
// container alongside the select-all checkbox): a plain block div with no
// explicit width shrinks to its min-content size as a flex item, which —
// combined with the input's own `w-full` sizing itself off that shrunk
// wrapper — collapsed the whole field down near the placeholder text
// instead of filling the row, dragging the icon in with it. `flex-1` is a
// no-op outside a flex container, so this is safe for `DynamoSelect`'s own
// (non-flex) filter row too.
export const selectFilterFieldWrapperStyles = 'relative min-w-0 flex-1';

export const selectFilterIconStyles =
  'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted';

// Passed as `<dg-input-text>`'s `[styleClass]` so typed text doesn't run
// under the icon. `cn()`'s `tailwind-merge` correctly resolves this against
// `inputTextStyles`'s own `px-*` (overrides only the right side).
export const selectFilterInputExtraClasses = 'pr-8';

export const selectGroupHeadingStyles =
  'px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-text-muted';

export const selectNoResultsStyles = 'px-4 py-2 text-sm text-text-muted';

// `flex items-center gap-2` supports both DynamoSelect (a single text node —
// harmless on a lone flex child) and DynamoMultiSelect (a checkbox indicator
// beside the label).
//
// `active` (hover/keyboard-highlight) and `selected` deliberately resolve to
// the SAME highlight — no separate "selected but not active" treatment. A
// mismatched pair (one solid, one a different faint tint) reads as two
// states fighting for attention. The highlight itself is a translucent
// `bg-primary/10` tint with `text-primary` (not a solid `bg-primary`/
// `text-on-primary` fill) — a full-strength solid fill on a whole row is too
// visually loud for a listbox scanned repeatedly; the soft tint reads as a
// clear highlight without the harsh contrast jump.
export const selectOptionStyles = cva(
  'flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-text-primary',
  {
    variants: {
      active: {
        true: 'bg-primary/10 text-primary',
        false: '',
      },
      selected: {
        true: 'bg-primary/10 text-primary font-semibold',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-60',
        false: '',
      },
    },
    defaultVariants: { active: false, selected: false, disabled: false },
  },
);
