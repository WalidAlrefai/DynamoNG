import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { inputMaskStyles } from './input-mask.styles';
import type {
  DynamoInputMaskPart,
  DynamoInputMaskSize,
} from './input-mask.types';

type MaskSlotType = 'digit' | 'letter' | 'alphanumeric' | 'literal';

interface MaskSlot {
  type: MaskSlotType;
  char?: string;
}

@Component({
  selector: 'dg-input-mask',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-mask.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoInputMask),
      multi: true,
    },
  ],
})
export class DynamoInputMask
  extends DynamoBaseComponent<DynamoInputMaskPart>
  implements ControlValueAccessor
{
  /** e.g. `"(999) 999-9999"` — `9`=digit, `a`=letter, `*`=alphanumeric, anything else is a literal. */
  readonly mask = input.required<string>();
  readonly size = input<DynamoInputMaskSize>('md');
  readonly placeholder = input('');
  readonly invalid = input(false);
  /** Accessible name for the input when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current value stays visible and the control
   *  stays focusable/tabbable, but the user cannot change it. Unlike `disabled`,
   *  does not remove the control from the tab order or dim its appearance. */
  readonly readOnly = input(false);
  /** Placeholder character shown for each not-yet-filled slot while the
   *  field is focused (e.g. `"(555) ___-____"`). */
  readonly slotChar = input('_');
  /** Reverts an incomplete value back to empty on blur, so a half-filled
   *  mask never gets submitted as if it were meaningful data. */
  readonly autoClear = input(true);
  /** Fires once, on the transition into a fully-filled mask — not on every
   *  keystroke while it stays complete. */
  readonly complete = output<string>();

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');
  protected readonly tokens = computed(() => this.tokenize(this.mask()));
  private readonly focused = signal(false);
  private wasComplete = false;

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly inputClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          inputMaskStyles({ size: this.size(), invalid: this.invalid() }),
          this.styleClass(),
        ),
  );

  // The buffer is only shown while focused — every existing caller that
  // reads `.value` without focusing first (writeValue, programmatic sets)
  // keeps seeing the plain matched string, not slot-char noise.
  protected readonly displayValue = computed(() =>
    this.focused()
      ? this.bufferedDisplay(this.value(), this.tokens())
      : this.value(),
  );

  // `value[i]` and `slots[i]` are always index-aligned (see applyMask), so
  // padding the remainder of the mask onto an already-matched prefix is a
  // direct slot-by-slot walk — no re-parsing needed.
  private bufferedDisplay(masked: string, slots: MaskSlot[]): string {
    if (masked.length >= slots.length) {
      return masked;
    }
    const slotChar = this.slotChar();
    let buffer = masked;
    for (let i = masked.length; i < slots.length; i++) {
      const slot = slots[i] as MaskSlot;
      buffer += slot.type === 'literal' ? slot.char : slotChar;
    }
    return buffer;
  }

  writeValue(value: string | null): void {
    // Run the incoming value through the mask too — an externally-set
    // FormControl value that doesn't already match the mask (e.g. a raw
    // unmasked string) still gets correctly masked on write, not only on
    // user keystrokes.
    this.value.set(this.applyMask(value ?? '', this.tokens()));
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
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const caretBefore = input.selectionStart ?? rawValue.length;
    const slots = this.tokens();

    const masked = this.applyMask(rawValue, slots);
    // The length of the masked prefix up to the pre-edit caret is exactly
    // the correct new caret index — applyMask is a deterministic left-to-
    // right reconstruction, so literals inserted at-or-before the caret
    // count toward it and literals after it don't. A rejected keystroke
    // (e.g. a letter into a digit slot) yields the same prefix length as
    // before, so the caret snaps back to exactly where it was.
    const targetCaret = this.applyMask(
      rawValue.slice(0, caretBefore),
      slots,
    ).length;

    this.commit(input, masked, targetCaret);
  }

  // Only Backspace/Delete on a *collapsed* selection are intercepted here —
  // a range selection (selectionStart !== selectionEnd) is left to the
  // native edit, which then flows through the ordinary onInput remask path
  // above with no special-casing needed.
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.selectionStart !== input.selectionEnd) {
      return;
    }
    const current = input.value;
    const caret = input.selectionStart ?? current.length;
    const slots = this.tokens();

    if (event.key === 'Backspace') {
      if (caret === 0) {
        event.preventDefault();
        return;
      }
      let deleteIndex = caret - 1;
      while (deleteIndex >= 0 && slots[deleteIndex]?.type === 'literal') {
        deleteIndex--;
      }
      if (deleteIndex < 0) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      const { masked, caret: nextCaret } = this.deleteAt(
        current,
        deleteIndex,
        slots,
      );
      this.commit(input, masked, nextCaret);
      return;
    }

    // Delete (forward): walk right over literals to find the placeholder to
    // clear; the caret itself never moves for a forward delete.
    if (caret >= current.length) {
      event.preventDefault();
      return;
    }
    let deleteIndex = caret;
    while (
      deleteIndex < slots.length &&
      slots[deleteIndex]?.type === 'literal'
    ) {
      deleteIndex++;
    }
    if (deleteIndex >= current.length) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const { masked } = this.deleteAt(current, deleteIndex, slots);
    this.commit(input, masked, caret);
  }

  protected onPaste(event: ClipboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const input = event.target as HTMLInputElement;
    const masked = this.applyMask(pasted, this.tokens());
    this.commit(input, masked, masked.length);
  }

  // The buffer's own [value] binding is signal-driven (via `displayValue`),
  // but zoneless change detection doesn't guarantee that binding has
  // flushed to the DOM by the time a synchronous caller (or test) next
  // reads `input.value` — so, matching `commit()`'s own approach, the new
  // display string is also written to the element directly, immediately.
  protected onFocus(event: FocusEvent): void {
    this.focused.set(true);
    (event.target as HTMLInputElement).value = this.bufferedDisplay(
      this.value(),
      this.tokens(),
    );
  }

  protected onBlur(event: FocusEvent): void {
    this.focused.set(false);
    if (
      this.autoClear() &&
      !this.disabled() &&
      !this.readOnly() &&
      this.value().length > 0 &&
      this.value().length < this.tokens().length
    ) {
      this.value.set('');
      this.wasComplete = false;
      this.onChangeFn('');
    }
    (event.target as HTMLInputElement).value = this.value();
    this.onTouchedFn();
  }

  // Writes the masked string into both the DOM (imperatively, so the caret
  // fix below lands against the final text content) and the component's own
  // signal/CVA state, then repositions the caret. Must run synchronously
  // within the same event handler — setSelectionRange only behaves
  // correctly once the input's actual displayed text already matches.
  private commit(input: HTMLInputElement, masked: string, caret: number): void {
    input.value = this.focused()
      ? this.bufferedDisplay(masked, this.tokens())
      : masked;
    input.setSelectionRange(caret, caret);
    this.value.set(masked);
    this.onChangeFn(masked);

    const isComplete =
      masked.length > 0 && masked.length === this.tokens().length;
    if (isComplete && !this.wasComplete) {
      this.complete.emit(masked);
    }
    this.wasComplete = isComplete;
  }

  private tokenize(mask: string): MaskSlot[] {
    return Array.from(mask, (ch) => {
      if (ch === '9') {
        return { type: 'digit' as const };
      }
      if (ch === 'a') {
        return { type: 'letter' as const };
      }
      if (ch === '*') {
        return { type: 'alphanumeric' as const };
      }
      return { type: 'literal' as const, char: ch };
    });
  }

  // Pure, idempotent, left-to-right, no lookahead — feeding this its own
  // previous output plus more raw input always re-derives the correct full
  // masked string, which is what lets every handler above just call it
  // fresh rather than doing incremental diffing.
  private applyMask(raw: string, slots: MaskSlot[]): string {
    let result = '';
    let rawIndex = 0;
    let slotIndex = 0;
    // Whether any real placeholder (not just a literal) has been filled —
    // without this, backspacing every digit out of a value leaves a stray
    // leading literal behind (e.g. "(") instead of collapsing to fully
    // empty, since a literal echoes back unconditionally whenever raw is
    // merely non-empty, even if raw contains nothing but that literal.
    let matchedAny = false;

    while (slotIndex < slots.length && rawIndex < raw.length) {
      const slot = slots[slotIndex] as MaskSlot;

      if (slot.type === 'literal') {
        result += slot.char;
        // Don't double up if raw already has this exact literal here (e.g.
        // re-masking an already-masked string).
        if (raw[rawIndex] === slot.char) {
          rawIndex++;
        }
        slotIndex++;
        continue;
      }

      if (this.matchesSlot(raw[rawIndex], slot.type)) {
        result += raw[rawIndex];
        matchedAny = true;
        slotIndex++;
        rawIndex++;
      } else {
        // Reject this one character and keep scanning — makes typing an
        // invalid character (or pasting a string with some) a silent
        // no-op for that character rather than aborting the whole edit.
        rawIndex++;
      }
    }

    if (!matchedAny) {
      return '';
    }

    // Auto-append any trailing literals immediately reachable from here,
    // even with no more raw input to consume — this is what makes typing
    // the last digit before a literal boundary immediately insert it.
    while (slotIndex < slots.length && slots[slotIndex]?.type === 'literal') {
      result += (slots[slotIndex] as MaskSlot).char;
      slotIndex++;
    }

    return result;
  }

  private matchesSlot(ch: string | undefined, type: MaskSlotType): boolean {
    if (ch === undefined) {
      return false;
    }
    if (type === 'digit') {
      return /[0-9]/.test(ch);
    }
    if (type === 'letter') {
      return /[A-Za-z]/.test(ch);
    }
    return /[A-Za-z0-9]/.test(ch); // alphanumeric
  }

  // Deletion is reframed as "remove one character from the current masked
  // string, then remask everything from scratch" — reusing applyMask and
  // the prefix-caret trick entirely, since a digit shifted left by a
  // deletion is still valid for whatever slot it lands in.
  private deleteAt(
    current: string,
    index: number,
    slots: MaskSlot[],
  ): { masked: string; caret: number } {
    const withoutChar = current.slice(0, index) + current.slice(index + 1);
    const masked = this.applyMask(withoutChar, slots);
    const caret = this.applyMask(withoutChar.slice(0, index), slots).length;
    return { masked, caret };
  }
}
