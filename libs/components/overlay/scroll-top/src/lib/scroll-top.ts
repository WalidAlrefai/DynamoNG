import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { isBrowser } from '@dynamong/utils/dom';
import { cn } from '@dynamong/utils/class-merge';
import { scrollTopStyles } from './scroll-top.styles';
import type { DynamoScrollTopPart } from './scroll-top.types';

@Component({
  selector: 'dg-scroll-top',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-top.html',
})
export class DynamoScrollTop extends DynamoBaseComponent<DynamoScrollTopPart> {
  readonly threshold = input(200);
  readonly ariaLabel = input('Scroll to top');

  protected readonly visible = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(scrollTopStyles, this.styleClass()),
  );

  constructor() {
    super();
    if (isBrowser()) {
      const onScroll = () => this.visible.set(window.scrollY > this.threshold());
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
      });
    }
  }

  protected scrollToTop(): void {
    if (isBrowser()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
