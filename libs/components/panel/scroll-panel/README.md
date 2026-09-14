# @dynamong/scroll-panel

Wraps arbitrary projected content in a themed, custom-styled scrollbar in
place of the browser's native one. Native scrolling itself (wheel, touch,
keyboard, assistive tech) is never reimplemented — only the visual
scrollbar affordance is custom.

## Usage

```html
<dg-scroll-panel styleClass="h-64">
  <p>Long content that overflows the fixed height goes here…</p>
</dg-scroll-panel>
```

## Inputs

No component-specific inputs — only the inherited `styleClass`/`pt`/`unstyled`.
See Design notes for why there's no dedicated size input.

## Outputs

None — scroll position is native, uncontrolled browser state; there is no
bindable model for it.

## Accessibility

- The scrollable viewport gets `tabindex="0"` only while it actually
  overflows on at least one axis (WAI-ARIA "scrollable region" pattern;
  satisfies axe-core's `scrollable-region-focusable` rule) — a panel whose
  content fits adds no stray tab stop. Once focused, native arrow key/Page
  Up/Down/Home/End scrolling works exactly as it would on a plain
  `overflow: auto` element.
- Each thumb is `aria-hidden="true"` and outside the tab order — real
  scrollbars aren't keyboard targets either; the underlying viewport
  already provides keyboard scrolling on its own.
- Thumbs support pointer drag (mouse and touch).

## Design notes

**No `maxHeight`/size input.** No sibling panel-domain component (Card,
Panel, Toolbar, Divider) has a dedicated size input — they all size via
`styleClass`/CSS, and a plain `overflow: auto` div is no exception. This
differs from VirtualScroll, whose CDK viewport genuinely cannot size itself
from surrounding CSS the way a normal block element can.

**Uses `ResizeObserver`.** Unlike Knob, which defers a `ResizeObserver` in
favor of a simpler explicit-input alternative, ScrollPanel has no such
alternative: its entire job is tracking the current size of arbitrary,
dynamically-changing projected content, which is exactly the problem
`ResizeObserver` solves. It's guarded (`typeof ResizeObserver !== 'undefined'`)
the same way `DynamoSelect`'s trigger-width sync is. Known accepted gap: a
nested descendant that changes its own scroll size without changing the
observed element's own box dimensions won't be picked up until the next
native `scroll` event self-corrects it — not worth a `MutationObserver` as
well for v1.

**No `orientation` input.** Both axes are automatic and independent — a
thumb renders only for whichever axis actually overflows, the same way a
native scrollbar would. This differs from `Splitter`, whose entire layout
(not just a thumb) depends on a single axis.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-scroll-panel` to execute the unit tests.
