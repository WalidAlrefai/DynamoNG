import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  chipsInputChipStyles,
  chipsInputFieldStyles,
  chipsInputRemoveButtonStyles,
  chipsInputWrapperStyles,
} from './chips-input.styles';
import type { DynamoChipsInputPart } from './chips-input.types';

@Component({
  selector: 'dg-chips-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chips-input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoChipsInput),
      multi: true,
    },
  ],
})
export class DynamoChipsInput
  extends DynamoBaseComponent<DynamoChipsInputPart>
  implements ControlValueAccessor
{
  readonly placeholder = input('');
  readonly invalid = input(false);
  readonly size = input<DynamoSize>('md');
  readonly max = input<number | undefined>(undefined);
  readonly allowDuplicates = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly chips = signal<string[]>([]);
  protected readonly draftText = signal('');
  private readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('input');

  private onChangeFn: (value: string[]) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly addDisabled = computed(() => {
    const max = this.max();
    return max != null && this.chips().length >= max;
  });

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          chipsInputWrapperStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly chipClasses = computed(() =>
    chipsInputChipStyles({ size: this.size() }),
  );
  protected readonly removeButtonClasses = chipsInputRemoveButtonStyles;
  protected readonly fieldClasses = chipsInputFieldStyles;

  writeValue(value: string[] | null): void {
    this.chips.set(value ?? []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onWrapperClick(): void {
    if (!this.disabled()) {
      this.inputRef().nativeElement.focus();
    }
  }

  protected onInputInput(event: Event): void {
    this.draftText.set((event.target as HTMLInputElement).value);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitDraft();
    } else if (
      event.key === 'Backspace' &&
      this.draftText() === '' &&
      this.chips().length > 0
    ) {
      event.preventDefault();
      this.removeChip(this.chips().length - 1);
    }
  }

  protected onInputPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    // A plain single-value paste (no comma) is left to land in the field
    // normally — only a multi-value paste is worth intercepting.
    if (!pasted.includes(',')) {
      return;
    }
    event.preventDefault();
    for (const token of pasted.split(',')) {
      this.tryCommit(token);
    }
  }

  protected onInputBlur(): void {
    this.commitDraft();
    this.onTouchedFn();
  }

  protected removeChip(index: number): void {
    if (this.disabled()) {
      return;
    }
    this.chips.update((values) => values.filter((_, i) => i !== index));
    this.emitValue();
    this.inputRef().nativeElement.focus();
  }

  private commitDraft(): void {
    const committed = this.tryCommit(this.draftText());
    if (committed) {
      this.draftText.set('');
      // Also clear the native element's value synchronously, not just the
      // signal driving `[value]` — under fast/rapid keystrokes (e.g. typing
      // faster than a render cycle), relying solely on the next change
      // detection pass to blank the DOM leaves a window where a following
      // keystroke lands on the still-stale native value and gets appended
      // to it instead of starting fresh.
      this.inputRef().nativeElement.value = '';
    }
  }

  private tryCommit(raw: string): boolean {
    const text = raw.trim();
    if (!text || this.addDisabled()) {
      return false;
    }
    if (!this.allowDuplicates() && this.chips().includes(text)) {
      return false;
    }
    this.chips.update((values) => [...values, text]);
    this.emitValue();
    return true;
  }

  private emitValue(): void {
    this.onChangeFn(this.chips());
  }
}
