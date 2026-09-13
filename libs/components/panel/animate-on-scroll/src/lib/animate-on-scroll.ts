import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
} from '@angular/core';

/**
 * Adds `enterClass` to the host the first time it scrolls into the viewport
 * (via `IntersectionObserver`); with `once=false` it also swaps back to
 * `leaveClass` when the host scrolls out. Honours `prefers-reduced-motion`
 * by applying `enterClass` immediately and skipping the observer.
 */
@Directive({
  selector: '[dgAnimateOnScroll]',
  standalone: true,
})
export class DynamoAnimateOnScroll implements OnInit, OnDestroy {
  readonly enterClass = input.required<string>();
  readonly leaveClass = input<string | undefined>(undefined);
  readonly threshold = input(0.1);
  readonly once = input(true);
  readonly disabled = input(false, { alias: 'dgAnimateOnScrollDisabled' });
  /** IntersectionObserver `rootMargin` — e.g. `'-100px'` to trigger the animation only once the element is 100px past the viewport edge, or a positive value to trigger it slightly early. */
  readonly rootMargin = input<string | undefined>(undefined);
  /** IntersectionObserver `root` — the scrollable ancestor to intersect against instead of the browser viewport. */
  readonly root = input<Element | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    const el = this.host.nativeElement;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (
      this.disabled() ||
      reducedMotion ||
      typeof IntersectionObserver === 'undefined'
    ) {
      el.classList.add(this.enterClass());
      return;
    }

    const rootMargin = this.rootMargin();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const leave = this.leaveClass();
            if (leave) el.classList.remove(leave);
            el.classList.add(this.enterClass());
            if (this.once()) this.disconnect();
          } else if (!this.once()) {
            el.classList.remove(this.enterClass());
            const leave = this.leaveClass();
            if (leave) el.classList.add(leave);
          }
        }
      },
      {
        threshold: this.threshold(),
        root: this.root(),
        ...(rootMargin !== undefined ? { rootMargin } : {}),
      },
    );
    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
