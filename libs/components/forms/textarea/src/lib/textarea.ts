import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { textareaStyles } from './textarea.styles';
import type { DynamoTextareaPart, DynamoTextareaSize } from './textarea.types';

@Component({
  selector: 'dg-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly placeholder = input('');
  readonly invalid = input(false);
  readonly rows = input(3);
  /** Grows the textarea's height to fit its content, up to the element's CSS `max-height`. */
  readonly autoResize = input(false);
  /** Accessible name for the textarea when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);

  protected readonly value = signal('');
  private readonly textareaEl =
    viewChild<ElementRef<HTMLTextAreaElement>>('textareaEl');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly textareaClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          textareaStyles({
            size: this.size(),
            invalid: this.invalid(),
            autoResize: this.autoResize(),
          }),
          this.styleClass(),
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
    el.style.height = `${!Number.isNaN(maxHeight) && el.scrollHeight > maxHeight ? maxHeight : el.scrollHeight}px`;
  }
}
