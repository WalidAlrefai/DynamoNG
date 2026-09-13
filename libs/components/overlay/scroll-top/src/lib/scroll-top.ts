import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { isBrowser } from '@dynamong/utils/dom';
import { cn } from '@dynamong/utils/class-merge';
import { scrollTopStyles } from './scroll-top.styles';
import type {
  DynamoScrollTopPart,
  DynamoScrollTopTarget,
} from './scroll-top.types';

@Component({
  selector: 'dg-scroll-top',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-top.html',
})
export class DynamoScrollTop extends DynamoBaseComponent<DynamoScrollTopPart> {
  readonly threshold = input(200);
  readonly ariaLabel = input('Scroll to top');
  /** Scroll (and threshold-watch) the window, or the component's own parent element — for a scroll-to-top button placed inside a scrollable container rather than the page itself. */
  readonly target = input<DynamoScrollTopTarget>('window');
  readonly behavior = input<ScrollBehavior>('smooth');

  protected readonly visible = signal(false);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(scrollTopStyles({ target: this.target() }), this.styleClass()),
  );

  constructor() {
    super();
    if (!isBrowser()) {
      return;
    }

    effect((onCleanup) => {
      const scrollable = this.scrollableElement();
      if (!scrollable) return;

      const onScroll = () =>
        this.visible.set(this.scrollTop(scrollable) > this.threshold());
      scrollable.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      onCleanup(() => scrollable.removeEventListener('scroll', onScroll));
    });
  }

  protected scrollToTop(): void {
    if (!isBrowser()) return;
    const behavior = this.behavior();
    if (this.target() === 'parent') {
      this.elementRef.nativeElement.parentElement?.scrollTo({
        top: 0,
        behavior,
      });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }

  /** `window`'s own scroll target is `document.documentElement`/`document.body`, not `window` itself — `window.scrollY` covers reading it, but there's no element to attach a `scroll` listener to except the shared `window` object. */
  private scrollableElement(): EventTarget | null {
    return this.target() === 'parent'
      ? this.elementRef.nativeElement.parentElement
      : window;
  }

  private scrollTop(scrollable: EventTarget): number {
    return scrollable === window
      ? window.scrollY
      : (scrollable as HTMLElement).scrollTop;
  }
}
