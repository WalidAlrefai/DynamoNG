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

## Imperative API

Still no inputs/outputs (see Outputs above) — but for cases that need to
move the scroll position from outside (e.g. "jump to top" after loading
more items), grab the component instance via `viewChild()` and call one of:

```ts
scrollTo(options: ScrollToOptions): void
scrollToTop(behavior?: ScrollBehavior): void
scrollToBottom(behavior?: ScrollBehavior): void
scrollToStart(behavior?: ScrollBehavior): void
scrollToEnd(behavior?: ScrollBehavior): void
```

`scrollToTop`/`scrollToBottom`/`scrollToStart`/`scrollToEnd` all default to
`behavior: 'auto'` (instant) and compute their target from the panel's
current metrics, so they stay correct as content changes size.

## Accessibility

- The scrollable viewport gets `tabindex="0"` only while it actually
  overflows on at least one axis (WAI-ARIA "scrollable region" pattern;
  satisfies axe-core's `scrollable-region-focusable` rule) — a panel whose
  content fits adds no stray tab stop. Once focused, native arrow key/Page
  Up/Down/Home/End scrolling works exactly as it would on a plain
  `overflow: auto` element.
- Each thumb is `aria-hidden="true"` and outside the tab order — real
  scrollbars aren't keyboard targets either; the underlying viewport
  already provides keyboard scrolling on its own. The invisible track
  behind each thumb (see Design notes) is the same: it's a pointer-only
  affordance, since keyboard users already have Page Up/Down on the
  viewport itself.
- Thumbs support pointer drag (mouse and touch), and the track behind each
  thumb pages one viewport-length toward a click, like a native OS
  scrollbar track.

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

**Minimum thumb size.** A thumb's raw size (visible/total ratio) is
clamped to a 24px floor (`MIN_THUMB_PX` in `scroll-panel-geometry.ts`) so
very long content never shrinks it to an ungrabbable sliver. Drag math uses
the same clamped size, so position and size always agree.

**Click-on-track paging.** An invisible, slightly-wider-than-the-thumb
track element sits behind each thumb (same axis, full length) and pages
the viewport by one `clientHeight`/`clientWidth` toward a click, like a
native scrollbar track. It's bound to `(pointerdown)`, not `(click)` —
functionally the same for this use case, and it sidesteps needing keyboard
equivalents for a click handler (see Accessibility).

**Edge fade hint.** The viewport's `mask-image` fades whichever edges have
more content beyond them, derived straight from scroll metrics — no extra
DOM. When both axes need a fade simultaneously, the two gradients are
combined with `mask-composite: intersect`; there's no vendor-prefixed
equivalent set, so a pre-`mask-composite` Safari falls back to showing only
the vertical fade in that corner. Accepted v1 gap — the fades still degrade
to "on" rather than visually breaking.

**Scroll performance.** The native `scroll` listener batches metrics
recomputation to at most once per animation frame (via
`requestAnimationFrame`), so a fast/flick scroll burst triggers one signal
write per frame instead of one per event.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-scroll-panel` to execute the unit tests.
