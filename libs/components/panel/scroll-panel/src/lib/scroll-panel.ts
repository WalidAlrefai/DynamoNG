import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  MIN_THUMB_PX,
  buildFadeGradient,
  computeThumbGeometry,
} from './scroll-panel-geometry';
import {
  scrollPanelContentStyles,
  scrollPanelRootStyles,
  scrollPanelThumbXStyles,
  scrollPanelThumbYStyles,
  scrollPanelTrackXStyles,
  scrollPanelTrackYStyles,
} from './scroll-panel.styles';
import type {
  DynamoScrollPanelMetrics,
  DynamoScrollPanelPart,
} from './scroll-panel.types';

interface AxisDragState {
  startClientPos: number;
  startScrollPos: number;
}

const EMPTY_METRICS: DynamoScrollPanelMetrics = {
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  clientHeight: 0,
  scrollWidth: 0,
  clientWidth: 0,
};

/**
 * Wraps projected content in a real native-scrolling viewport (wheel,
 * touch, keyboard, and assistive-tech scrolling all keep working exactly
 * as they would on a plain `overflow: auto` element) and draws a themed,
 * draggable scrollbar thumb in place of the browser's native one. Nothing
 * about scrolling itself is reimplemented — only the visual affordance.
 */
@Component({
  selector: 'dg-scroll-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-panel.html',
})
export class DynamoScrollPanel extends DynamoBaseComponent<DynamoScrollPanelPart> {
  private readonly viewportRef =
    viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly contentRef =
    viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly destroyRef = inject(DestroyRef);
  private resizeObserver: ResizeObserver | null = null;
  private pendingFrame: number | null = null;

  private readonly metrics = signal<DynamoScrollPanelMetrics>(EMPTY_METRICS);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(scrollPanelRootStyles, this.styleClass()),
  );
  protected readonly contentClasses = scrollPanelContentStyles;
  protected readonly thumbYClasses = scrollPanelThumbYStyles;
  protected readonly thumbXClasses = scrollPanelThumbXStyles;
  protected readonly trackYClasses = scrollPanelTrackYStyles;
  protected readonly trackXClasses = scrollPanelTrackXStyles;

  protected readonly showVerticalThumb = computed(
    () => this.metrics().scrollHeight > this.metrics().clientHeight,
  );
  protected readonly showHorizontalThumb = computed(
    () => this.metrics().scrollWidth > this.metrics().clientWidth,
  );
  // A scrollable region that isn't otherwise focusable needs its own tab
  // stop for keyboard users (WAI-ARIA "scrollable region" pattern; axe-core's
  // scrollable-region-focusable rule) — but only once it actually overflows,
  // so a non-overflowing panel adds no stray tab stop.
  protected readonly isScrollable = computed(
    () => this.showVerticalThumb() || this.showHorizontalThumb(),
  );

  private readonly thumbYGeometry = computed(() => {
    const m = this.metrics();
    return computeThumbGeometry(
      m.clientHeight,
      m.clientHeight,
      m.scrollHeight,
      m.scrollTop,
      MIN_THUMB_PX,
    );
  });
  private readonly thumbXGeometry = computed(() => {
    const m = this.metrics();
    return computeThumbGeometry(
      m.clientWidth,
      m.clientWidth,
      m.scrollWidth,
      m.scrollLeft,
      MIN_THUMB_PX,
    );
  });

  // Edge fade hint: each boolean is true when there's more (already
  // scrolled-past or not-yet-reached) content beyond that edge.
  private readonly fadeEdges = computed(() => {
    const m = this.metrics();
    return {
      top: m.scrollTop > 0,
      bottom: m.scrollTop < m.scrollHeight - m.clientHeight,
      left: m.scrollLeft > 0,
      right: m.scrollLeft < m.scrollWidth - m.clientWidth,
    };
  });

  private dragStateY: AxisDragState | null = null;
  private dragStateX: AxisDragState | null = null;

  constructor() {
    super();
    // viewChild.required() only resolves once the view is initialized —
    // afterNextRender is this codebase's established idiom for that (see
    // DynamoVirtualScroll's constructor). It's inherently browser-only, so
    // no separate isBrowser() guard is needed on top of it.
    afterNextRender(() => {
      const viewport = this.viewportRef().nativeElement;
      const content = this.contentRef().nativeElement;

      const recompute = () => {
        this.metrics.set({
          scrollTop: viewport.scrollTop,
          scrollLeft: viewport.scrollLeft,
          scrollHeight: viewport.scrollHeight,
          clientHeight: viewport.clientHeight,
          scrollWidth: viewport.scrollWidth,
          clientWidth: viewport.clientWidth,
        });
      };

      // Native `scroll` can fire at a high rate during fast/flick
      // scrolling; coalesce a burst into at most one metrics write per
      // animation frame rather than one per event.
      const scheduleRecompute = () => {
        if (this.pendingFrame !== null) {
          return;
        }
        this.pendingFrame = requestAnimationFrame(() => {
          this.pendingFrame = null;
          recompute();
        });
      };

      viewport.addEventListener('scroll', scheduleRecompute, {
        passive: true,
      });
      recompute();

      // Not implemented in every test environment — guarded rather than
      // assumed, same defensiveness as the ResizeObserver guard in
      // DynamoSelect's listbox-base.component.ts. Unlike Knob's diameter
      // (a one-time, rarely-changing input with a simpler alternative),
      // there's no simpler alternative here: the whole job of this
      // component is tracking arbitrary, dynamically-changing projected
      // content, which is exactly the problem ResizeObserver solves.
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(recompute);
        this.resizeObserver.observe(viewport);
        this.resizeObserver.observe(content);
      }

      this.destroyRef.onDestroy(() => {
        viewport.removeEventListener('scroll', scheduleRecompute);
        if (this.pendingFrame !== null) {
          cancelAnimationFrame(this.pendingFrame);
          this.pendingFrame = null;
        }
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
      });
    });
  }

  /** Imperative scroll API — scroll position stays native/uncontrolled (see README), so this is a method, not an input/output. */
  scrollTo(options: ScrollToOptions): void {
    this.viewportRef().nativeElement.scrollTo(options);
  }

  scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    this.viewportRef().nativeElement.scrollTo({ top: 0, behavior });
  }

  scrollToBottom(behavior: ScrollBehavior = 'auto'): void {
    const m = this.metrics();
    this.viewportRef().nativeElement.scrollTo({
      top: m.scrollHeight - m.clientHeight,
      behavior,
    });
  }

  scrollToStart(behavior: ScrollBehavior = 'auto'): void {
    this.viewportRef().nativeElement.scrollTo({ left: 0, behavior });
  }

  scrollToEnd(behavior: ScrollBehavior = 'auto'): void {
    const m = this.metrics();
    this.viewportRef().nativeElement.scrollTo({
      left: m.scrollWidth - m.clientWidth,
      behavior,
    });
  }

  protected contentMaskStyle(): Record<string, string> {
    const edges = this.fadeEdges();
    const vertical = buildFadeGradient(edges.top, edges.bottom, 'to bottom');
    const horizontal = buildFadeGradient(edges.left, edges.right, 'to right');
    const layers = [vertical, horizontal].filter(
      (gradient): gradient is string => gradient !== null,
    );
    if (layers.length === 0) {
      return {};
    }
    const image = layers.join(', ');
    const style: Record<string, string> = {
      'mask-image': image,
      '-webkit-mask-image': image,
    };
    // Two independent axis fades must intersect (both dim the shared
    // corner), not just union — no vendor-prefixed equivalent is set here,
    // so pre-intersect Safari shows only the first layer in that corner.
    // Accepted v1 gap; see README.
    if (layers.length > 1) {
      style['mask-composite'] = 'intersect';
    }
    return style;
  }

  protected thumbYStyle(): Record<string, string> {
    const g = this.thumbYGeometry();
    return { height: `${g.sizePct}%`, top: `${g.posPct}%` };
  }

  protected thumbXStyle(): Record<string, string> {
    const g = this.thumbXGeometry();
    return { width: `${g.sizePct}%`, left: `${g.posPct}%` };
  }

  // Pages via direct scrollTop/scrollLeft assignment rather than
  // Element.scrollBy — not implemented in jsdom, and this stays consistent
  // with the thumb-drag handlers, which assign directly for the same reason.
  // Bound to (pointerdown), not (click): a native scrollbar track isn't a
  // keyboard target either (PageUp/PageDown already works via the focused
  // viewport), and pointerdown sidesteps the click-events-have-key-events
  // lint rule that a real click handler here would otherwise need.
  /** Clicking the track (not the thumb) pages the viewport one clientHeight toward the click, like a native scrollbar track. */
  protected onTrackYClick(event: PointerEvent): void {
    const m = this.metrics();
    const trackRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const clickPos = event.clientY - trackRect.top;
    const g = this.thumbYGeometry();
    const thumbCenterPx = (g.posPct / 100) * m.clientHeight + g.sizePx / 2;
    const delta = clickPos < thumbCenterPx ? -m.clientHeight : m.clientHeight;
    const maxScrollTop = m.scrollHeight - m.clientHeight;
    this.viewportRef().nativeElement.scrollTop = Math.max(
      0,
      Math.min(maxScrollTop, m.scrollTop + delta),
    );
  }

  protected onTrackXClick(event: PointerEvent): void {
    const m = this.metrics();
    const trackRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const clickPos = event.clientX - trackRect.left;
    const g = this.thumbXGeometry();
    const thumbCenterPx = (g.posPct / 100) * m.clientWidth + g.sizePx / 2;
    const delta = clickPos < thumbCenterPx ? -m.clientWidth : m.clientWidth;
    const maxScrollLeft = m.scrollWidth - m.clientWidth;
    this.viewportRef().nativeElement.scrollLeft = Math.max(
      0,
      Math.min(maxScrollLeft, m.scrollLeft + delta),
    );
  }

  protected onThumbYPointerDown(event: PointerEvent): void {
    this.dragStateY = {
      startClientPos: event.clientY,
      startScrollPos: this.viewportRef().nativeElement.scrollTop,
    };
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Splitter/Carousel's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onThumbYPointerMove(event: PointerEvent): void {
    const drag = this.dragStateY;
    if (!drag) {
      return;
    }
    const m = this.metrics();
    const trackLength = m.clientHeight;
    const thumbLengthPx = this.thumbYGeometry().sizePx;
    const travelPx = trackLength - thumbLengthPx;
    const maxScrollTop = m.scrollHeight - m.clientHeight;
    const deltaPx = event.clientY - drag.startClientPos;
    const deltaScrollTop =
      travelPx > 0 ? (deltaPx / travelPx) * maxScrollTop : 0;
    this.viewportRef().nativeElement.scrollTop =
      drag.startScrollPos + deltaScrollTop;
    // The native `scroll` event this triggers re-invokes `recompute()`
    // itself — no manual metrics update needed here.
  }

  protected onThumbYPointerUp(): void {
    this.dragStateY = null;
  }

  protected onThumbXPointerDown(event: PointerEvent): void {
    this.dragStateX = {
      startClientPos: event.clientX,
      startScrollPos: this.viewportRef().nativeElement.scrollLeft,
    };
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onThumbXPointerMove(event: PointerEvent): void {
    const drag = this.dragStateX;
    if (!drag) {
      return;
    }
    const m = this.metrics();
    const trackLength = m.clientWidth;
    const thumbLengthPx = this.thumbXGeometry().sizePx;
    const travelPx = trackLength - thumbLengthPx;
    const maxScrollLeft = m.scrollWidth - m.clientWidth;
    const deltaPx = event.clientX - drag.startClientPos;
    const deltaScrollLeft =
      travelPx > 0 ? (deltaPx / travelPx) * maxScrollLeft : 0;
    this.viewportRef().nativeElement.scrollLeft =
      drag.startScrollPos + deltaScrollLeft;
  }

  protected onThumbXPointerUp(): void {
    this.dragStateX = null;
  }
}
