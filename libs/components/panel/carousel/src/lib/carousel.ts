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
import type { DynamoCarouselPart } from './carousel.types';

@Component({
  selector: 'dg-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoButton],
  templateUrl: './carousel.html',
})
export class DynamoCarousel extends DynamoBaseComponent<DynamoCarouselPart> {
  /** Two-way bindable: `<dg-carousel [(activeIndex)]="index">`. */
  readonly activeIndex = model(0);
  readonly loop = input(true);
  readonly autoPlay = input(false);
  readonly autoPlayInterval = input(5000);
  readonly showArrows = input(true);
  readonly showIndicators = input(true);
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
  // a class. A 4th instance of the established "deliberate inline-style
  // exception" pattern (Progress's fill-width, Tree's indent-depth,
  // Skeleton's width/height).
  protected readonly trackTransform = computed(() => {
    const base = -this.activeIndex() * 100;
    if (!this.dragging()) {
      return `translateX(${base}%)`;
    }
    const width = this.viewportRef().nativeElement.clientWidth;
    const dragPct = width > 0 ? (this.dragOffsetPx() / width) * 100 : 0;
    return `translateX(${base + dragPct}%)`;
  });

  constructor() {
    super();

    // Restarts the autoplay timer whenever play state, interval, or slide
    // count changes — always clearing any prior timer first so there's never
    // more than one running.
    effect(() => {
      const shouldPlay = this.playing() && this.slides().length > 1;
      const interval = this.autoPlayInterval();
      this.clearAutoPlayTimer();
      if (shouldPlay) {
        this.intervalId = setInterval(() => this.next(), interval);
      }
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
    return this.loop() || this.activeIndex() > 0;
  }

  protected canNext(): boolean {
    return this.loop() || this.activeIndex() < this.slides().length - 1;
  }

  protected next(): void {
    this.goToRelative(1);
  }

  protected prev(): void {
    this.goToRelative(-1);
  }

  private goToRelative(delta: number): void {
    const count = this.slides().length;
    if (count === 0) {
      return;
    }
    const target = this.activeIndex() + delta;
    this.goTo(this.loop() ? target : Math.min(Math.max(target, 0), count - 1));
  }

  protected goTo(index: number): void {
    const count = this.slides().length;
    if (count === 0) {
      return;
    }
    this.activeIndex.set(((index % count) + count) % count);
  }

  protected dotClasses(active: boolean) {
    return carouselDotStyles({ active });
  }

  protected slideAriaLabel(index: number): string {
    return `${index + 1} of ${this.slides().length}`;
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
        this.goTo(0);
        break;
      case 'End':
        event.preventDefault();
        this.goTo(this.slides().length - 1);
        break;
    }
  }

  // A simplified roving-tabindex scan compared to Tabs'/Stepper's
  // findEnabledIndex: indicator dots have no per-slide "disabled" concept, so
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
    this.goTo(nextIndex);
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
