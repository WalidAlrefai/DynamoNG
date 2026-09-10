import { Directive, ElementRef, computed, inject, input } from '@angular/core';
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
 */
@Directive({
  selector: '[dgKeyFilter]',
  standalone: true,
  host: {
    '(keydown)': 'onKeydown($event)',
    '(paste)': 'onPaste($event)',
  },
})
export class DynamoKeyFilter {
  readonly pattern = input.required<DynamoKeyFilterPattern>({
    alias: 'dgKeyFilter',
  });

  private readonly host = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(
    ElementRef,
  );

  private readonly regex = computed<RegExp>(() => {
    const value = this.pattern();
    return value instanceof RegExp
      ? value
      : KEY_FILTER_PATTERNS[value as DynamoKeyFilterPreset];
  });

  protected onKeydown(event: KeyboardEvent): void {
    // Let editing / navigation keys and Ctrl/Meta shortcuts through.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;

    if (!this.regex().test(this.projectedValue(event.key))) {
      event.preventDefault();
    }
  }

  protected onPaste(event: ClipboardEvent): void {
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
