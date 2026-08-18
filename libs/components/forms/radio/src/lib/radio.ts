import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  radioCircleStyles,
  radioDotStyles,
  radioRootStyles,
} from './radio.styles';
import type { DynamoRadioPart, DynamoRadioSize } from './radio.types';

@Component({
  selector: 'dg-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio.html',
})
export class DynamoRadio extends DynamoBaseComponent<DynamoRadioPart> {
  /**
   * Two-way bindable, like `DynamoCheckbox`'s `checked` — `model()` generates
   * both a `checked` input and a `checkedChange` output.
   *
   * A native `<input type="radio">` never fires `change` on a sibling that
   * becomes deselected because a different radio sharing its `name` was
   * clicked, so full `[(checked)]="perRadioSignal"` binding across a group of
   * siblings will NOT keep them in sync — the deselected sibling's own signal
   * never learns it was deselected. For grouped usage, bind the split form
   * instead (both halves come from the same `model()`, no separate API):
   *
   * ```html
   * <dg-radio name="fruit" value="apple" [checked]="fruit() === 'apple'" (checkedChange)="fruit.set('apple')">Apple</dg-radio>
   * <dg-radio name="fruit" value="banana" [checked]="fruit() === 'banana'" (checkedChange)="fruit.set('banana')">Banana</dg-radio>
   * ```
   *
   * A single, standalone radio (no siblings sharing `name`) can safely use
   * full two-way `[(checked)]` binding, same as `DynamoCheckbox`.
   */
  readonly checked = model(false);
  readonly name = input.required<string>();
  readonly value = input<string>('');
  readonly disabled = input(false);
  readonly size = input<DynamoRadioSize>('md');

  protected readonly inputId = this.idGenerator.next('dg-radio');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(radioRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );

  // The visual circle is structural (the native input is visually hidden), so
  // it stays styled even when `unstyled` is set — same rationale as Checkbox's box.
  protected readonly circleClasses = computed(() =>
    radioCircleStyles({ size: this.size(), checked: this.checked() }),
  );

  protected readonly dotClasses = computed(() =>
    radioDotStyles({ size: this.size() }),
  );

  protected onNativeChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    // Native radios only ever fire `change` when becoming checked, never when
    // deselected by a sibling — so this only ever sets `true`, matching that.
    if (target.checked) {
      this.checked.set(true);
    }
  }
}
