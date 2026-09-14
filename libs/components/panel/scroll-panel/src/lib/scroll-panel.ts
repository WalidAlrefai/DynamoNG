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
  scrollPanelContentStyles,
  scrollPanelRootStyles,
  scrollPanelThumbXStyles,
  scrollPanelThumbYStyles,
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

  private readonly metrics = signal<DynamoScrollPanelMetrics>(EMPTY_METRICS);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(scrollPanelRootStyles, this.styleClass()),
  );
  protected readonly contentClasses = scrollPanelContentStyles;
  protected readonly thumbYClasses = scrollPanelThumbYStyles;
  protected readonly thumbXClasses = scrollPanelThumbXStyles;

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

      viewport.addEventListener('scroll', recompute, { passive: true });
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
        viewport.removeEventListener('scroll', recompute);
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
      });
    });
  }

  protected thumbYStyle(): Record<string, string> {
    const m = this.metrics();
    const sizePct =
      m.scrollHeight > 0 ? (m.clientHeight / m.scrollHeight) * 100 : 100;
    const maxScrollTop = m.scrollHeight - m.clientHeight;
    const posPct =
      maxScrollTop > 0 ? (m.scrollTop / maxScrollTop) * (100 - sizePct) : 0;
    return { height: `${sizePct}%`, top: `${posPct}%` };
  }

  protected thumbXStyle(): Record<string, string> {
    const m = this.metrics();
    const sizePct =
      m.scrollWidth > 0 ? (m.clientWidth / m.scrollWidth) * 100 : 100;
    const maxScrollLeft = m.scrollWidth - m.clientWidth;
    const posPct =
      maxScrollLeft > 0 ? (m.scrollLeft / maxScrollLeft) * (100 - sizePct) : 0;
    return { width: `${sizePct}%`, left: `${posPct}%` };
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
    const thumbLengthPx =
      m.scrollHeight > 0
        ? (m.clientHeight / m.scrollHeight) * trackLength
        : trackLength;
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
    const thumbLengthPx =
      m.scrollWidth > 0
        ? (m.clientWidth / m.scrollWidth) * trackLength
        : trackLength;
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
