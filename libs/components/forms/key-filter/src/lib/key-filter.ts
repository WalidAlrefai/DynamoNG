import {
  Directive,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  NG_VALIDATORS,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { KEY_FILTER_PATTERNS } from './key-filter-patterns';
import type {
  DynamoKeyFilterPattern,
  DynamoKeyFilterPreset,
} from './key-filter.types';

/**
 * Restricts what can be typed or pasted into the host `<input>` / `<textarea>`
 * to a named preset (`int`, `num`, `money`, `hex`, `alpha`, `alphanum`,
 * `email`, …) or a custom `RegExp`. A keystroke is blocked when the value it
 * *would* produce fails the pattern; navigation / editing keys and
 * clipboard/undo shortcuts always pass through.
 *
 * `validateOnly` flips this from *blocking* to *passive*: keystrokes are
 * never prevented, and a bound `FormControl`/`ngModel` instead gets a
 * `keyFilter` validation error whenever the current value fails the
 * pattern — useful when the field should stay freely editable (e.g. so a
 * screen-reader user isn't fighting silently-swallowed keys) but the form
 * still needs to flag it as invalid.
 */
@Directive({
  selector: '[dgKeyFilter]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
    '(paste)': 'onPaste($event)',
  },
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DynamoKeyFilter),
      multi: true,
    },
  ],
})
export class DynamoKeyFilter implements Validator {
  readonly pattern = input.required<DynamoKeyFilterPattern>({
    alias: 'dgKeyFilter',
  });
  /** When true, invalid keystrokes are validated (via `Validator`) rather than blocked outright. */
  readonly validateOnly = input(false);

  private readonly host =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

  private readonly regex = computed<RegExp>(() => {
    const value = this.pattern();
    return value instanceof RegExp
      ? value
      : KEY_FILTER_PATTERNS[value as DynamoKeyFilterPreset];
  });

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.validateOnly()) {
      return null;
    }
    const value = control.value;
    if (value == null || value === '' || this.regex().test(String(value))) {
      return null;
    }
    return { keyFilter: true };
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.validateOnly()) return;
    // Let editing / navigation keys and Ctrl/Meta shortcuts through.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    if (!this.regex().test(this.projectedValue(event.key))) {
      event.preventDefault();
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    if (this.validateOnly()) return;
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!this.regex().test(this.projectedValue(pasted))) {
      event.preventDefault();
    }
  }

  /** The field's value after inserting `insert` over the current selection. */
  private projectedValue(insert: string): string {
    const el = this.host.nativeElement;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    return el.value.slice(0, start) + insert + el.value.slice(end);
  }
}
