import {
  Directive,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import type { DynamoSeverity, DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { buttonStyles } from './button.styles';
import type { DynamoButtonVariant } from './button.types';

/**
 * Attribute-directive form of Button — applies Button's styling classes
 * directly to an existing native `<button>`, with no wrapping `<dg-button>`
 * host tag. Mirrors PrimeNG's `pButton` directive. See button/README.md for
 * exactly what's scoped out relative to the component.
 */
@Directive({ selector: '[dgButton]', standalone: true })
export class DynamoButtonDirective {
  readonly severity = input<DynamoSeverity>('primary');
  readonly size = input<DynamoSize>('md');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly fullWidth = input(false);
  readonly raised = input(false);
  readonly rounded = input(false);
  readonly iconOnly = input(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private appliedClasses = new Set<string>();

  private readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  // `cn()` (twMerge) is required here, not just a convenience — `buttonStyles`
  // (a plain `cva()` call) concatenates its base + variant class strings with
  // no deduping of its own, so e.g. `rounded`'s `rounded-full` would
  // otherwise sit right alongside the base's unconditional `rounded-md`
  // rather than replacing it, the same conflict `cn()` already resolves for
  // the component's own `classes` computed.
  private readonly classes = computed(() =>
    cn(
      buttonStyles({
        severity: this.severity(),
        size: this.size(),
        variant: this.variant(),
        fullWidth: this.fullWidth(),
        raised: this.raised(),
        rounded: this.rounded(),
        iconOnly: this.iconOnly(),
      }),
    ),
  );

  constructor() {
    effect(() => {
      const next = new Set(this.classes().split(' ').filter(Boolean));
      for (const cls of this.appliedClasses) {
        if (!next.has(cls)) {
          this.renderer.removeClass(this.el.nativeElement, cls);
        }
      }
      for (const cls of next) {
        this.renderer.addClass(this.el.nativeElement, cls);
      }
      this.appliedClasses = next;
    });

    effect(() => {
      this.renderer.setProperty(
        this.el.nativeElement,
        'disabled',
        this.isDisabled(),
      );
      if (this.loading()) {
        this.renderer.setAttribute(this.el.nativeElement, 'aria-busy', 'true');
      } else {
        this.renderer.removeAttribute(this.el.nativeElement, 'aria-busy');
      }
    });
  }
}
