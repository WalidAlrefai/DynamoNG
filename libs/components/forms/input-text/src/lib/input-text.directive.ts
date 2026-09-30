import {
  Directive,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { cn } from '@dynamong/utils/class-merge';
import { inputTextStyles } from './input-text.styles';
import type {
  DynamoInputTextSize,
  DynamoInputTextVariant,
} from './input-text.types';

/**
 * Attribute-directive form of InputText — applies InputText's styling classes
 * directly to an existing native `<input>`, with no wrapping `<dg-input-text>`
 * host tag. Mirrors PrimeNG's `pInputText` directive. See input-text/README.md
 * for exactly what's scoped out relative to the component.
 */
@Directive({ selector: '[dgInputText]', standalone: true })
export class DynamoInputTextDirective {
  readonly size = input<DynamoInputTextSize>('md');
  readonly variant = input<DynamoInputTextVariant>('outlined');
  readonly invalid = input(false);
  readonly fluid = input(true);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private appliedClasses = new Set<string>();

  // `cn()` (twMerge) is required here, not just a convenience — `inputTextStyles`
  // (a plain `cva()` call) concatenates its base + variant class strings with no
  // deduping of its own, so e.g. `filled`'s `border-transparent` would otherwise
  // sit right alongside the base's `border-border`/`border-danger` rather than
  // replacing it, the same conflict `cn()` already resolves for the component's
  // own `inputClasses` computed.
  private readonly classes = computed(() =>
    cn(
      inputTextStyles({
        size: this.size(),
        variant: this.variant(),
        invalid: this.invalid(),
        fluid: this.fluid(),
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
      if (this.invalid()) {
        this.renderer.setAttribute(
          this.el.nativeElement,
          'aria-invalid',
          'true',
        );
      } else {
        this.renderer.removeAttribute(this.el.nativeElement, 'aria-invalid');
      }
    });
  }
}
