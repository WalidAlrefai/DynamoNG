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
import { textareaStyles } from './textarea.styles';
import type {
  DynamoTextareaSize,
  DynamoTextareaVariant,
} from './textarea.types';

/**
 * Attribute-directive form of Textarea — applies Textarea's styling classes
 * directly to an existing native `<textarea>`, with no wrapping
 * `<dg-textarea>` host tag. Mirrors `DynamoInputTextDirective`/PrimeNG's
 * `pTextarea` directive, plus its own `autoResize` behavior (the one thing
 * `dgInputText` has no equivalent of) — ported from `DynamoTextarea`'s own
 * `resize()`. See textarea/README.md for exactly what's scoped out relative
 * to the component.
 */
@Directive({ selector: '[dgTextarea]', standalone: true })
export class DynamoTextareaDirective {
  readonly size = input<DynamoTextareaSize>('md');
  readonly variant = input<DynamoTextareaVariant>('outlined');
  readonly invalid = input(false);
  readonly fluid = input(true);
  /** Grows the textarea's height to fit its content on every native `input`
   *  event, up to `max-h-96` by default (same bound `textareaStyles` gives
   *  the component). Unlike the component, this directive owns no `[value]`
   *  binding of its own to react to — it listens to the native `input`
   *  event directly instead. */
  readonly autoResize = input(false);

  private readonly el = inject(ElementRef<HTMLTextAreaElement>);
  private readonly renderer = inject(Renderer2);
  private appliedClasses = new Set<string>();

  // `cn()` (twMerge) is required here, not just a convenience — see
  // `DynamoInputTextDirective`'s identical comment: a plain `cva()` call
  // concatenates its base + variant class strings with no deduping of its
  // own, so e.g. `filled`'s `border-transparent` would otherwise sit right
  // alongside the base's `border-border`/`border-danger` rather than
  // replacing it.
  private readonly classes = computed(() =>
    cn(
      textareaStyles({
        size: this.size(),
        variant: this.variant(),
        invalid: this.invalid(),
        fluid: this.fluid(),
        autoResize: this.autoResize(),
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

    this.renderer.listen(this.el.nativeElement, 'input', () => {
      if (this.autoResize()) this.resize();
    });
    // Also re-runs whenever `autoResize()` itself flips on/off — matches the
    // component's own effect, which reacts to more than just typed input
    // (e.g. a programmatic value change with autoResize already on).
    effect(() => {
      if (this.autoResize()) this.resize();
    });
  }

  private resize(): void {
    const el = this.el.nativeElement;
    el.style.height = 'auto';
    const maxHeight = parseFloat(getComputedStyle(el).maxHeight);
    const exceedsMax = !Number.isNaN(maxHeight) && el.scrollHeight > maxHeight;
    el.style.height = `${exceedsMax ? maxHeight : el.scrollHeight}px`;
    el.style.overflowY = exceedsMax ? 'auto' : 'hidden';
  }
}
