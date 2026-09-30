import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { textareaStyles } from './textarea.styles';
import type {
  DynamoTextareaPart,
  DynamoTextareaSize,
  DynamoTextareaVariant,
} from './textarea.types';

@Component({
  selector: 'dg-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './textarea.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoTextarea),
      multi: true,
    },
  ],
})
export class DynamoTextarea
  extends DynamoBaseComponent<DynamoTextareaPart>
  implements ControlValueAccessor
{
  readonly size = input<DynamoTextareaSize>('md');
  readonly variant = input<DynamoTextareaVariant>('outlined');
  /** Fills the width of its container. Defaults `true` to match InputText/DatePicker's own default
   *  (and this component's own prior always-full-width behavior); set `false` for intrinsic sizing. */
  readonly fluid = input(true);
  readonly placeholder = input('');
  readonly invalid = input(false);
  readonly rows = input(3);
  /** Mirrors `rows` — sets the native `cols` attribute. Unset (native default) unless provided. */
  readonly cols = input<number | undefined>(undefined);
  /** Grows the textarea's height to fit its content, up to `max-h-96` by default (overridable via
   *  `styleClass`/`pt.textarea.class`, which wins through `cn()`/twMerge). */
  readonly autoResize = input(false);
  /** Accessible name for the textarea when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the textarea with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current value stays visible and the control
   *  stays focusable/tabbable, but the user cannot change it. Unlike `disabled`,
   *  does not remove the control from the tab order or dim its appearance. */
  readonly readOnly = input(false);

  /** Fires after each `autoResize` height adjustment (typed input or a
   *  programmatic `writeValue`/`autoResize` change alike). */
  readonly resized = output<void>();

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');
  private readonly textareaEl =
    viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  // Textarea is a single bare `<textarea>` (no wrapper element, unlike
  // InputText) — `pt.root` and `pt.textarea` are both folded into this one
  // element's classes since there's nowhere else for `pt.root` to land. Only
  // `pt.textarea`'s non-class attrs are applied via `[dgPt]` in the template
  // (see textarea.html) — `pt.root`'s attrs aren't applicable here, only its
  // `class` is honored. Documented explicitly in the README.
  protected readonly textareaClasses = computed(() =>
    this.unstyled()
      ? cn(
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('textarea').class,
        )
      : cn(
          textareaStyles({
            size: this.size(),
            invalid: this.invalid(),
            variant: this.variant(),
            fluid: this.fluid(),
            autoResize: this.autoResize(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('textarea').class,
        ),
  );

  constructor() {
    super();
    // Re-runs whenever `value()`, `autoResize()`, or the view-ready native
    // element ref changes — covers both typed input and a programmatic
    // `writeValue()` (e.g. `FormControl.setValue`), which fire no DOM event.
    effect(() => {
      const value = this.value();
      const autoResize = this.autoResize();
      const el = this.textareaEl()?.nativeElement;
      if (!el || !autoResize) return;
      void value;
      this.resize(el);
    });
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value.set(target.value);
    this.onChangeFn(target.value);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  private resize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    const maxHeight = parseFloat(getComputedStyle(el).maxHeight);
    const exceedsMax = !Number.isNaN(maxHeight) && el.scrollHeight > maxHeight;
    el.style.height = `${exceedsMax ? maxHeight : el.scrollHeight}px`;
    // The autoResize styles hide overflow so the drag handle stays disabled;
    // once content is clamped at max-height, restore scrolling so it's still reachable.
    el.style.overflowY = exceedsMax ? 'auto' : 'hidden';
    this.resized.emit();
  }
}
