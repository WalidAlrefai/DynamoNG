import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { otpInputBoxStyles, otpInputRootStyles } from './otp-input.styles';
import type { DynamoOtpInputPart } from './otp-input.types';

@Component({
  selector: 'dg-otp-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './otp-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoOtpInput),
      multi: true,
    },
  ],
})
export class DynamoOtpInput
  extends DynamoBaseComponent<DynamoOtpInputPart>
  implements ControlValueAccessor
{
  readonly length = input(6);
  /** When true (default), only digit keystrokes and pasted digits are accepted. */
  readonly numeric = input(true);
  readonly size = input<DynamoSize>('md');
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');

  protected readonly boxes = computed(() =>
    Array.from({ length: Math.max(0, this.length()) }, (_, i) => i),
  );
  // Derived from `value()` — padded/truncated to `length()` characters, one
  // per box. No separate stored state, so there's nothing to keep in sync.
  protected readonly boxValues = computed(() => {
    const chars = this.value().split('');
    return Array.from(
      { length: Math.max(0, this.length()) },
      (_, i) => chars[i] ?? '',
    );
  });

  private readonly boxRefs =
    viewChildren<ElementRef<HTMLInputElement>>('box');

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(otpInputRootStyles, this.styleClass()),
  );
  protected readonly boxClasses = computed(() =>
    otpInputBoxStyles({ size: this.size(), invalid: this.invalid() }),
  );

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

  protected onBoxInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let char = input.value.slice(-1);
    if (this.numeric() && char && !/^[0-9]$/.test(char)) {
      char = '';
      input.value = '';
    }
    const chars = [...this.boxValues()];
    chars[index] = char;
    this.commit(chars.join(''));
    if (char && index < this.length() - 1) {
      this.boxRefs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onBoxKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.boxValues()[index] && index > 0) {
      event.preventDefault();
      const chars = [...this.boxValues()];
      chars[index - 1] = '';
      this.commit(chars.join(''));
      this.boxRefs()[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.boxRefs()[index - 1]?.nativeElement.focus();
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      event.preventDefault();
      this.boxRefs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onBoxPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const pastedChars = (
      this.numeric() ? pasted.replace(/\D/g, '') : pasted
    ).split('');
    const chars = [...this.boxValues()];
    let cursor = index;
    for (const char of pastedChars) {
      if (cursor >= this.length()) {
        break;
      }
      chars[cursor] = char;
      cursor++;
    }
    this.commit(chars.join(''));
    const focusIndex = Math.min(cursor, this.length() - 1);
    this.boxRefs()[Math.max(focusIndex, 0)]?.nativeElement.focus();
  }

  protected onBoxBlur(): void {
    this.onTouchedFn();
  }

  private commit(next: string): void {
    this.value.set(next);
    this.onChangeFn(next);
  }
}
