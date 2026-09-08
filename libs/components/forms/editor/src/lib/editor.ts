import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  SecurityContext,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { isBrowser } from '@dynamong/utils/dom';
import { cn } from '@dynamong/utils/class-merge';
import {
  editorButtonStyles,
  editorContentStyles,
  editorRootStyles,
  editorToolbarStyles,
} from './editor.styles';
import type { DynamoEditorCommand, DynamoEditorPart } from './editor.types';

// The subset of commands that have a meaningful "pressed" toolbar state.
// createLink has none (there's no persistent "link mode" to reflect).
type DynamoEditorStatefulCommand = Exclude<DynamoEditorCommand, 'createLink'>;

const STATEFUL_COMMANDS: DynamoEditorStatefulCommand[] = [
  'bold',
  'italic',
  'underline',
  'insertUnorderedList',
  'insertOrderedList',
];

@Component({
  selector: 'dg-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoEditor),
      multi: true,
    },
  ],
})
export class DynamoEditor extends DynamoBaseComponent<DynamoEditorPart> implements ControlValueAccessor {
  /** Accessible name for the editable region when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);

  protected readonly value = signal('');
  protected readonly activeStates = signal<Record<DynamoEditorStatefulCommand, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  private readonly contentEl = viewChild.required<ElementRef<HTMLDivElement>>('contentEl');
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(editorRootStyles({ disabled: this.disabled() }), this.styleClass()),
  );
  protected readonly toolbarClasses = editorToolbarStyles;
  protected readonly contentClasses = computed(() =>
    editorContentStyles({ disabled: this.disabled() }),
  );

  constructor() {
    super();
    // A native <input>'s [value] binding is a safe no-op when re-set to its
    // own current value — the browser preserves caret position for free. A
    // contenteditable div's [innerHTML] binding does NOT get that same
    // protection; re-setting it can disrupt caret position even when the
    // content is unchanged. So [innerHTML] is only ever written here, from
    // writeValue()/external programmatic value() changes — never reactively
    // on every keystroke — and only when the element isn't currently
    // focused, so a value() update triggered by the user's own typing
    // (which also flows through this same signal) never clobbers the edit
    // in progress. While typing, the DOM itself is the live source of
    // truth; onInput() reads it out, nothing writes back into it mid-edit.
    effect(() => {
      const html = this.value();
      const el = this.contentEl().nativeElement;
      if (document.activeElement === el) {
        return;
      }
      if (el.innerHTML !== html) {
        el.innerHTML = html;
      }
    });
    if (isBrowser()) {
      document.addEventListener('selectionchange', this.onSelectionChange);
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('selectionchange', this.onSelectionChange);
      });
    }
  }

  writeValue(value: string | null): void {
    this.commitHtml(value ?? '', false);
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
    const el = event.target as HTMLDivElement;
    this.commitHtml(el.innerHTML, true);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  protected onFormat(command: DynamoEditorStatefulCommand): void {
    if (this.disabled()) {
      return;
    }
    const el = this.contentEl().nativeElement;
    el.focus();
    document.execCommand(command, false);
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
  }

  protected onLink(): void {
    if (this.disabled()) {
      return;
    }
    const el = this.contentEl().nativeElement;
    el.focus();
    const url = window.prompt('Enter a URL');
    if (!url) {
      return; // cancelled prompt (null) or an empty string are both a no-op
    }
    document.execCommand('createLink', false, url);
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
  }

  protected isActive(command: DynamoEditorStatefulCommand): boolean {
    return this.activeStates()[command];
  }

  // Accepts the full command union (not just the stateful subset) so the
  // Link button — which has no "active" concept — can share the same
  // styling helper as the other five in the template.
  protected buttonClasses(command: DynamoEditorCommand): string {
    return editorButtonStyles({
      active: command === 'createLink' ? false : this.isActive(command),
    });
  }

  // Single sanitize choke point — the emitted `value`/onChangeFn payload
  // never contains anything the DomSanitizer wouldn't allow through, even
  // if a consumer later re-renders it via [innerHTML] elsewhere. `emit`
  // is false for writeValue() (an external/programmatic set must not be
  // echoed back out as if the user had typed it) and true for user-driven
  // edits (onInput/onFormat/onLink).
  private commitHtml(raw: string, emit: boolean): void {
    const safe = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    this.value.set(safe);
    if (emit) {
      this.onChangeFn(safe);
    }
  }

  private refreshActiveStates(): void {
    const next = { ...this.activeStates() };
    for (const command of STATEFUL_COMMANDS) {
      try {
        next[command] = document.queryCommandState(command);
      } catch {
        next[command] = false;
      }
    }
    this.activeStates.set(next);
  }

  // selectionchange fires on `document`, not this component's own element,
  // and is the only event that reliably fires for every way the caret/
  // selection can change (click, arrow keys, select-all, programmatic).
  // Arrow-function class field (not a bound method) so the same reference
  // can be passed to both addEventListener and removeEventListener.
  private readonly onSelectionChange = (): void => {
    const el = this.contentEl().nativeElement;
    const anchorNode = document.getSelection()?.anchorNode;
    if (!anchorNode || !el.contains(anchorNode)) {
      return; // selection changed elsewhere on the page — not our concern
    }
    this.refreshActiveStates();
  };
}
