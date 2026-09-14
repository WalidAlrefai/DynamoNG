import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoButton } from '@dynamong/button';
import { cn } from '@dynamong/utils/class-merge';
import { isBrowser } from '@dynamong/utils/dom';
import { DynamoCarouselSlide } from './carousel-slide';
import {
  carouselDotStyles,
  carouselIndicatorsStyles,
  carouselNextArrowStyles,
  carouselPlayToggleStyles,
  carouselPrevArrowStyles,
  carouselRootStyles,
  carouselSlideStyles,
  carouselTrackBaseStyles,
  carouselTrackNoTransitionStyles,
  carouselTrackTransitionStyles,
  carouselViewportStyles,
} from './carousel.styles';
import type {
  DynamoCarouselPart,
  DynamoCarouselResponsiveOption,
} from './carousel.types';

@Component({
  selector: 'dg-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoButton],
  templateUrl: './carousel.html',
})
export class DynamoCarousel extends DynamoBaseComponent<DynamoCarouselPart> {
  /** Two-way bindable: `<dg-carousel [(activeIndex)]="index">`. Always a slide index — the first slide of whichever page is showing. */
  readonly activeIndex = model(0);
  readonly loop = input(true);
  readonly autoPlay = input(false);
  readonly autoPlayInterval = input(5000);
  readonly showArrows = input(true);
  readonly showIndicators = input(true);
  /** How many slides are visible in the viewport at once. */
  readonly numVisible = input(1);
  /** How many slides `next()`/`prev()` (and a committed drag) advance by. */
  readonly numScroll = input(1);
  /** Overrides `numVisible`/`numScroll` per viewport width — see `DynamoCarouselResponsiveOption`. */
  readonly responsiveOptions = input<DynamoCarouselResponsiveOption[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly slides = contentChildren(DynamoCarouselSlide);
  private readonly viewportRef =
    viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly dotButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('dotButton');

  private readonly destroyRef = inject(DestroyRef);

  protected readonly dragging = signal(false);
  protected readonly dragOffsetPx = signal(0);
  /** Explicit user pause via the play/pause toggle — distinct from the transient hover/focus pause below. */
  protected readonly userPaused = signal(false);
  private readonly hoverPaused = signal(false);
  private readonly playing = computed(
    () => this.autoPlay() && !this.userPaused() && !this.hoverPaused(),
  );

  private readonly viewportWidth = signal(
    isBrowser() ? window.innerWidth : Number.POSITIVE_INFINITY,
  );

  // The narrowest `responsiveOptions` entry whose breakpoint the current
  // viewport width still fits under — `undefined` when no entry matches
  // (including when `responsiveOptions` is empty), falling back to the
  // plain `numVisible`/`numScroll` inputs.
  private readonly matchingResponsiveOption = computed(() => {
    const options = this.responsiveOptions();
    if (options.length === 0) {
      return undefined;
    }
    const width = this.viewportWidth();
    return [...options]
      .sort((a, b) => a.breakpoint - b.breakpoint)
      .find((option) => width <= option.breakpoint);
  });

  protected readonly effectiveVisible = computed(() =>
    Math.max(
      1,
      this.matchingResponsiveOption()?.numVisible ?? this.numVisible(),
    ),
  );
  protected readonly effectiveScroll = computed(() =>
    Math.max(1, this.matchingResponsiveOption()?.numScroll ?? this.numScroll()),
  );

  // Each entry is the slide index a "page" starts at — one page per
  // indicator dot, one `next()`/`prev()` step apart. The final page is
  // clamped so it never scrolls past the last slide (and duplicate,
  // fully-overlapping clamped starts at the tail are collapsed), rather
  // than leaving a trailing gap of empty slots.
  protected readonly pageStarts = computed<number[]>(() => {
    const total = this.slides().length;
    if (total === 0) {
      return [0];
    }
    const visible = this.effectiveVisible();
    const scroll = this.effectiveScroll();
    const starts: number[] = [];
    let lastStart = -1;
    for (let start = 0; start < total; start += scroll) {
      const clamped = Math.min(start, Math.max(0, total - visible));
      if (clamped !== lastStart) {
        starts.push(clamped);
        lastStart = clamped;
      }
    }
    return starts.length > 0 ? starts : [0];
  });

  // Which page is "current": the last page whose start is at or before the
  // active slide index — correct even when the active index sits inside a
  // page's visible window rather than exactly on a page start.
  protected readonly currentPageIndex = computed(() => {
    const starts = this.pageStarts();
    const index = this.activeIndex();
    let current = 0;
    for (let i = 0; i < starts.length; i++) {
      if ((starts[i] ?? 0) <= index) {
        current = i;
      } else {
        break;
      }
    }
    return current;
  });

  protected readonly slideBasisPercent = computed(
    () => 100 / this.effectiveVisible(),
  );

  private dragStartX = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(carouselRootStyles, this.styleClass()),
  );
  protected readonly viewportClasses = carouselViewportStyles;
  protected readonly slideClasses = carouselSlideStyles;
  protected readonly prevArrowClasses = carouselPrevArrowStyles;
  protected readonly nextArrowClasses = carouselNextArrowStyles;
  protected readonly indicatorsClasses = carouselIndicatorsStyles;
  protected readonly playToggleClasses = carouselPlayToggleStyles;

  protected readonly trackClasses = computed(() =>
    cn(
      carouselTrackBaseStyles,
      this.dragging()
        ? carouselTrackNoTransitionStyles
        : carouselTrackTransitionStyles,
    ),
  );

  // Continuous active-index + live-drag-distance offset — can't be expressed
  // as discrete cva variants, so it's bound via [style.transform] instead of
  // a class. Same "deliberate inline-style exception" pattern as
  // carousel.styles.ts's other inline bindings.
  protected readonly trackTransform = computed(() => {
    const base = -this.activeIndex() * this.slideBasisPercent();
    if (!this.dragging()) {
      return `translateX(${base}%)`;
    }
    const width = this.viewportRef().nativeElement.clientWidth;
    const dragPct = width > 0 ? (this.dragOffsetPx() / width) * 100 : 0;
    return `translateX(${base + dragPct}%)`;
  });

  constructor() {
    super();

    // Restarts the autoplay timer whenever play state, interval, or page
    // count changes — always clearing any prior timer first so there's never
    // more than one running.
    effect(() => {
      const shouldPlay = this.playing() && this.pageStarts().length > 1;
      const interval = this.autoPlayInterval();
      this.clearAutoPlayTimer();
      if (shouldPlay) {
        this.intervalId = setInterval(() => this.next(), interval);
      }
    });

    // Tracks viewport width for `responsiveOptions` — set up once, not
    // re-run per resize (the listener itself updates the signal).
    effect((onCleanup) => {
      if (!isBrowser()) {
        return;
      }
      const onResize = () => this.viewportWidth.set(window.innerWidth);
      window.addEventListener('resize', onResize);
      onCleanup(() => window.removeEventListener('resize', onResize));
    });

    this.destroyRef.onDestroy(() => this.clearAutoPlayTimer());
  }

  private clearAutoPlayTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  protected canPrev(): boolean {
    return this.loop() || this.currentPageIndex() > 0;
  }

  protected canNext(): boolean {
    return (
      this.loop() || this.currentPageIndex() < this.pageStarts().length - 1
    );
  }

  protected next(): void {
    this.goToPageRelative(1);
  }

  protected prev(): void {
    this.goToPageRelative(-1);
  }

  private goToPageRelative(delta: number): void {
    const starts = this.pageStarts();
    if (starts.length === 0) {
      return;
    }
    const target = this.currentPageIndex() + delta;
    this.goToPage(
      this.loop() ? target : Math.min(Math.max(target, 0), starts.length - 1),
    );
  }

  protected goToPage(pageIndex: number): void {
    const starts = this.pageStarts();
    if (starts.length === 0) {
      return;
    }
    const wrapped =
      ((pageIndex % starts.length) + starts.length) % starts.length;
    this.activeIndex.set(starts[wrapped] ?? 0);
  }

  protected dotClasses(active: boolean) {
    return carouselDotStyles({ active });
  }

  protected slideAriaLabel(index: number): string {
    return `${index + 1} of ${this.slides().length}`;
  }

  protected isInert(index: number): boolean {
    const start = this.activeIndex();
    return index < start || index >= start + this.effectiveVisible();
  }

  protected onPointerEnterRoot(): void {
    this.hoverPaused.set(true);
  }

  protected onPointerLeaveRoot(): void {
    this.hoverPaused.set(false);
  }

  protected onFocusIn(): void {
    this.hoverPaused.set(true);
  }

  protected onFocusOut(): void {
    this.hoverPaused.set(false);
  }

  protected toggleAutoPlay(): void {
    this.userPaused.update((value) => !value);
  }

  protected onViewportKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
      case 'Home':
        event.preventDefault();
        this.goToPage(0);
        break;
      case 'End':
        event.preventDefault();
        this.goToPage(this.pageStarts().length - 1);
        break;
    }
  }

  // A simplified roving-tabindex scan compared to Tabs'/Stepper's
  // findEnabledIndex: indicator dots have no per-page "disabled" concept, so
  // it's plain wrapping arithmetic rather than a skip-disabled loop. Arrow
  // navigation activates immediately (matching Tabs' automatic-activation
  // mode), since there's no linear gate here the way Stepper has.
  protected onIndicatorKeydown(event: KeyboardEvent): void {
    const buttons = this.dotButtons();
    const count = buttons.length;
    const currentIndex = buttons.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (currentIndex === -1 || count === 0) {
      return;
    }

    let nextIndex: number;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % count;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (nextIndex === currentIndex) {
      return;
    }
    buttons[nextIndex]?.nativeElement.focus();
    this.goToPage(nextIndex);
  }

  protected onPointerDown(event: PointerEvent): void {
    // A pointerdown on the prev/next arrow buttons (nested inside the
    // viewport) is a click, not a swipe gesture — bail so it doesn't also
    // register as a drag start.
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    this.dragStartX = event.clientX;
    this.dragging.set(true);
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as any other real-only browser API used in this codebase.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) {
      return;
    }
    this.dragOffsetPx.set(event.clientX - this.dragStartX);
  }

  protected onPointerUp(): void {
    if (!this.dragging()) {
      return;
    }
    const width = this.viewportRef().nativeElement.clientWidth;
    const offset = this.dragOffsetPx();
    this.dragging.set(false);
    this.dragOffsetPx.set(0);
    if (width > 0 && Math.abs(offset) > width / 4) {
      if (offset < 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }
}
