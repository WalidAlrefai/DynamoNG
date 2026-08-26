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
  untracked,
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

  protected readonly boxes = computed(() =>
    Array.from({ length: Math.max(0, this.length()) }, (_, i) => i),
  );
  protected readonly boxValues = signal<string[]>([]);

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

  constructor() {
    super();
    effect(() => {
      const len = this.length();
      untracked(() =>
        this.boxValues.update((current) => {
          const next = current.slice(0, len);
          while (next.length < len) {
            next.push('');
          }
          return next;
        }),
      );
    });
  }

  writeValue(value: string | null): void {
    const chars = (value ?? '').split('');
    this.boxValues.set(
      Array.from({ length: this.length() }, (_, i) => chars[i] ?? ''),
    );
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
    this.boxValues.update((values) => {
      const next = [...values];
      next[index] = char;
      return next;
    });
    this.emitValue();
    if (char && index < this.length() - 1) {
      this.boxRefs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onBoxKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.boxValues()[index] && index > 0) {
      event.preventDefault();
      this.boxValues.update((values) => {
        const next = [...values];
        next[index - 1] = '';
        return next;
      });
      this.emitValue();
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
    const chars = (this.numeric() ? pasted.replace(/\D/g, '') : pasted).split(
      '',
    );
    let cursor = index;
    this.boxValues.update((values) => {
      const next = [...values];
      for (const char of chars) {
        if (cursor >= this.length()) {
          break;
        }
        next[cursor] = char;
        cursor++;
      }
      return next;
    });
    this.emitValue();
    const focusIndex = Math.min(cursor, this.length() - 1);
    this.boxRefs()[Math.max(focusIndex, 0)]?.nativeElement.focus();
  }

  protected onBoxBlur(): void {
    this.onTouchedFn();
  }

  private emitValue(): void {
    this.onChangeFn(this.boxValues().join(''));
  }
}
