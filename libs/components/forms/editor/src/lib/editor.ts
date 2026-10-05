import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  SecurityContext,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { isBrowser } from '@dynamong/utils/dom';
import { cn } from '@dynamong/utils/class-merge';
import {
  editorButtonStyles,
  editorCharacterCountStyles,
  editorContentStyles,
  editorHeadingSelectStyles,
  editorOverflowItemLabelStyles,
  editorOverflowPanelStyles,
  editorRootStyles,
  editorToolbarStyles,
} from './editor.styles';
import type {
  DynamoEditorBlockFormat,
  DynamoEditorCommand,
  DynamoEditorImageUploadFn,
  DynamoEditorPart,
  ToolbarItemId,
} from './editor.types';

// Commands driven through the generic execCommand(command, false) toggle
// path (onFormat) — no value argument. createLink and insertImage each need
// their own value argument and are handled by their own dedicated methods
// (onLink / onImageButtonClick+onImageFileChange), the same way headings'
// formatBlock is handled by onHeadingChange instead of living here.
type DynamoEditorArgumentlessCommand = Exclude<
  DynamoEditorCommand,
  'createLink' | 'insertImage'
>;

// The subset of the above with a meaningful "pressed" toolbar state. undo/
// redo have none — there's no reliable cross-browser way to query "can
// undo"/"can redo" (queryCommandEnabled is itself deprecated/unreliable),
// same reasoning createLink already has for no persistent state to reflect.
type DynamoEditorStatefulCommand = Exclude<
  DynamoEditorArgumentlessCommand,
  'undo' | 'redo'
>;

const STATEFUL_COMMANDS: DynamoEditorStatefulCommand[] = [
  'bold',
  'italic',
  'underline',
  'insertUnorderedList',
  'insertOrderedList',
  'justifyLeft',
  'justifyCenter',
  'justifyRight',
  'justifyFull',
];

// Past this size, base64-encoding the file for insertImage bloats the
// stored HTML noticeably (~33% larger than the source bytes) — not a hard
// limit, just a dev-mode nudge (see onImageFileChange).
const IMAGE_SIZE_WARNING_BYTES = 2 * 1024 * 1024;

// Strict priority order for toolbar overflow = DOM order — no separate
// "pinned items" concept. Whatever doesn't fit collapses trailing-first.
const TOOLBAR_ITEM_ORDER: ToolbarItemId[] = [
  'undo',
  'redo',
  'bold',
  'italic',
  'underline',
  'alignLeft',
  'alignCenter',
  'alignRight',
  'justify',
  'bulletedList',
  'numberedList',
  'heading',
  'link',
  'image',
];

// Fixed, hardcoded per-item widths for the overflow fit calculation — NOT
// live getBoundingClientRect() measurement. Every button is a hardcoded
// h-7 w-7 (28px) via editorButtonStyles, and the heading <select> is a
// hardcoded w-28 (112px) via editorHeadingSelectStyles. These constants are
// coupled 1:1 to those Tailwind classes — update both together if either
// ever changes.
const ITEM_WIDTH_PX = 28;
const SELECT_WIDTH_PX = 112;
const GAP_PX = 4; // the toolbar's gap-1
const TRIGGER_WIDTH_PX = ITEM_WIDTH_PX; // the "⋯" button is a plain toolbar button

function widthOf(id: ToolbarItemId): number {
  return id === 'heading' ? SELECT_WIDTH_PX : ITEM_WIDTH_PX;
}

// The overflow trigger is always the toolbar's trailing item, so its
// preferred corner is bottom-end; the other three are CDK collision
// fallbacks, same 4-corner idiom as dg-menu's own buildPositions().
const OVERFLOW_POSITIONS: ConnectedPosition[] = [
  {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
];

@Component({
  selector: 'dg-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.html',
  imports: [NgTemplateOutlet, DynamoPassThroughDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoEditor),
      multi: true,
    },
  ],
})
export class DynamoEditor
  extends DynamoBaseComponent<DynamoEditorPart>
  implements ControlValueAccessor
{
  /** Accessible name for the editable region when no visible `<label>` wraps it. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the editable content region. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** Fills the width of its container. Defaults `true` — a block-level root
   *  div already does this implicitly, so this is an explicit opt-out for
   *  intrinsic/content-based width, not a behavior change. */
  readonly fluid = input(true);
  /** Shown via CSS (`:empty:before`) whenever the content is empty. */
  readonly placeholder = input<string | undefined>(undefined);
  /** HTML `readonly` semantics: the content stays visible, focusable, and selectable (native browser text selection/copy), but typing and toolbar commands are blocked. Unlike `disabled`, does not dim its appearance. */
  readonly readOnly = input(false);
  /** Strips formatting from pasted content, inserting it as plain text only. */
  readonly pasteAsPlainText = input(false);
  /** Shows a `current / max` character count below the content region. A
   *  soft indicator only — typing/pasting past the limit is still allowed;
   *  only the count's styling flags it as over-limit. contenteditable has
   *  no native hard-block equivalent to a `<textarea maxlength>` (a real
   *  block needs a `beforeinput` listener with its own caret/IME/paste edge
   *  cases), so this round ships the indicator, not an enforced cap. */
  readonly maxLength = input<number | undefined>(undefined);
  /** Restricts the toolbar to a subset of its 14 controls. `undefined`
   *  (default) shows every control. Controls the configured subset always
   *  render in the library's own fixed canonical order — this is an
   *  inclusion filter, not a reordering mechanism. */
  readonly toolbarButtons = input<readonly ToolbarItemId[] | undefined>(
    undefined,
  );
  /** Intercepts image insertion (e.g. to upload the file and insert a
   *  hosted URL instead of a base64 data URI). `undefined` (default) keeps
   *  the base64/FileReader fallback. */
  readonly onImageUpload = input<DynamoEditorImageUploadFn | undefined>(
    undefined,
  );

  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model('');
  protected readonly activeStates = signal<
    Record<DynamoEditorStatefulCommand, boolean>
  >({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
  });
  /** The current block's format, as reflected by the "Text style" `<select>`. */
  protected readonly currentBlockFormat = signal<DynamoEditorBlockFormat>('p');

  // Plain-text length (not raw HTML length) — a consumer configuring
  // maxLength cares about how much text they typed, not markup byte count.
  // DOMParser, not el.textContent directly: value() is the sanitized bound
  // value, the single source of truth this should react to, not a second
  // read of the live (possibly momentarily stale during focus) DOM node.
  protected readonly textLength = computed(() => {
    const html = this.value();
    if (!isBrowser() || !html) {
      return 0;
    }
    return (
      new DOMParser().parseFromString(html, 'text/html').body.textContent
        ?.length ?? 0
    );
  });
  protected readonly isOverMaxLength = computed(() => {
    const max = this.maxLength();
    return max !== undefined && this.textLength() > max;
  });

  // toolbarButtons filters this same canonical array rather than
  // introducing a second ordering mechanism — a configured subset always
  // renders in the library's own fixed priority order (= DOM order),
  // regardless of the order ids appear in the input array. undefined means
  // "every control" — this input is an inclusion filter, not a reordering
  // mechanism.
  protected readonly enabledItemOrder = computed<ToolbarItemId[]>(() => {
    const configured = this.toolbarButtons();
    if (!configured) {
      return TOOLBAR_ITEM_ORDER;
    }
    const allowed = new Set(configured);
    return TOOLBAR_ITEM_ORDER.filter((id) => allowed.has(id));
  });

  // Toolbar-overflow state — see recomputeOverflow(). Starts optimistic
  // ("everything fits") until the first real-layout measurement lands.
  // TOOLBAR_ITEM_ORDER.length (not enabledItemOrder().length) is just an
  // upper bound here — enabledItemOrder() can never exceed it, so this
  // initial value always reads as "nothing overflows yet" regardless of how
  // many items are actually enabled.
  protected readonly overflowOpen = signal(false);
  private readonly visibleCount = signal(TOOLBAR_ITEM_ORDER.length);
  protected readonly overflowedIds = computed<ReadonlySet<ToolbarItemId>>(
    () => new Set(this.enabledItemOrder().slice(this.visibleCount())),
  );
  protected readonly hasOverflow = computed(
    () => this.visibleCount() < this.enabledItemOrder().length,
  );

  private readonly contentEl =
    viewChild.required<ElementRef<HTMLDivElement>>('contentEl');
  private readonly imageInputEl =
    viewChild.required<ElementRef<HTMLInputElement>>('imageInputEl');
  private readonly toolbarEl =
    viewChild.required<ElementRef<HTMLDivElement>>('toolbarEl');
  private readonly overflowTriggerEl =
    viewChild<ElementRef<HTMLButtonElement>>('overflowTriggerEl');
  private readonly overflowPanelTemplate = viewChild<TemplateRef<unknown>>(
    'overflowPanelTemplate',
  );
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private resizeObserver: ResizeObserver | null = null;
  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  // Captured just before the (async, focus-stealing) native file picker
  // opens — see onImageButtonClick.
  private savedRange: Range | null = null;

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          editorRootStyles({
            disabled: this.disabled(),
            invalid: this.invalid(),
            fluid: this.fluid(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly toolbarClasses = computed(() =>
    this.unstyled()
      ? cn(this.ptFor('toolbar').class)
      : cn(editorToolbarStyles, this.ptFor('toolbar').class),
  );
  protected readonly headingSelectClasses = editorHeadingSelectStyles;
  protected readonly overflowPanelClasses = editorOverflowPanelStyles;
  protected readonly overflowItemLabelClasses = editorOverflowItemLabelStyles;
  protected readonly contentClasses = computed(() =>
    this.unstyled()
      ? cn(this.ptFor('content').class)
      : cn(
          editorContentStyles({ disabled: this.disabled() }),
          this.ptFor('content').class,
        ),
  );
  protected readonly characterCountClasses = computed(() =>
    this.unstyled()
      ? cn(this.ptFor('characterCount').class)
      : cn(
          editorCharacterCountStyles({ over: this.isOverMaxLength() }),
          this.ptFor('characterCount').class,
        ),
  );
  // Reuses editorButtonStyles' own `active` variant so the trigger visually
  // shows "pressed" while its own panel is open — not routed through
  // buttonClasses(), which takes a DynamoEditorCommand (the trigger isn't
  // one, it's a layout affordance, not an execCommand).
  protected readonly overflowTriggerClasses = computed(() =>
    cn(
      editorButtonStyles({ active: this.overflowOpen() }),
      this.ptFor('button').class,
    ),
  );
  protected readonly overflowId = this.idGenerator.next('dg-editor-overflow');

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

    effect(() => {
      if (this.overflowOpen()) {
        this.attachOverflowOverlay();
      } else {
        this.detachOverflowOverlay();
      }
    });

    // viewChild.required() only resolves once the view is initialized —
    // afterNextRender is this codebase's established idiom for that (see
    // DynamoScrollPanel's constructor), and it's inherently browser-only so
    // no separate isBrowser() guard is needed on top of it.
    afterNextRender(() => {
      this.recomputeOverflow();
      // Not implemented in every test environment — guarded rather than
      // assumed, same defensiveness as DynamoScrollPanel's own
      // ResizeObserver guard.
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() =>
          this.recomputeOverflow(),
        );
        this.resizeObserver.observe(this.toolbarEl().nativeElement);
        this.destroyRef.onDestroy(() => this.resizeObserver?.disconnect());
      }
    });
    this.destroyRef.onDestroy(() => this.destroyOverflowOverlay());

    if (isDevMode()) {
      effect(() => {
        const configured = this.toolbarButtons();
        if (!configured) {
          return;
        }
        if (configured.length === 0) {
          console.warn(
            '[dg-editor] toolbarButtons is an empty array — no toolbar controls will render. ' +
              'Pass undefined (or omit the input) to show the default full set.',
          );
          return;
        }
        const validIds = new Set<ToolbarItemId>(TOOLBAR_ITEM_ORDER);
        const unknown = configured.filter((id) => !validIds.has(id));
        if (unknown.length > 0) {
          console.warn(
            `[dg-editor] toolbarButtons contains unrecognized id(s): ${unknown.join(', ')}`,
          );
        }
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
    if (this.readOnly()) {
      return;
    }
    const el = event.target as HTMLDivElement;
    this.commitHtml(el.innerHTML, true);
  }

  protected onBlur(): void {
    this.onTouchedFn();
  }

  // The native browser paste handler inserts clipboard HTML directly into
  // the live contenteditable DOM BEFORE `(input)`/onInput ever runs — and
  // `commitHtml`'s own sanitize() call only ever runs on the OUTGOING bound
  // value, never as a guard on what's about to be inserted. Something like
  // `<img src=x onerror=...>` on the clipboard can self-execute the instant
  // the browser's own native paste lands it in the DOM, before Angular's
  // sanitizer ever sees it. Fixed by intercepting paste entirely:
  // `preventDefault()` blocks the native (unsanitized) insertion, and the
  // clipboard HTML is sanitized through the SAME DomSanitizer instance
  // BEFORE it ever touches the DOM, inserted via the same execCommand-based
  // approach every other mutation in this file already uses (keeps paste in
  // the native undo stack, unlike a manual Range-API insertion would).
  protected onPaste(event: ClipboardEvent): void {
    if (this.disabled() || this.readOnly()) {
      event.preventDefault();
      return;
    }
    const clipboard = event.clipboardData;
    if (!clipboard) {
      return; // no Clipboard API support — native (unsanitized) fallback stands, same as before this fix
    }
    event.preventDefault();
    const el = this.contentEl().nativeElement;
    el.focus();
    if (this.pasteAsPlainText()) {
      document.execCommand(
        'insertText',
        false,
        clipboard.getData('text/plain'),
      );
    } else {
      const html = clipboard.getData('text/html');
      if (html) {
        const safe = this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
        document.execCommand('insertHTML', false, safe);
      } else {
        document.execCommand(
          'insertText',
          false,
          clipboard.getData('text/plain'),
        );
      }
    }
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
    this.refreshCurrentBlock();
  }

  protected onFormat(command: DynamoEditorArgumentlessCommand): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const el = this.contentEl().nativeElement;
    el.focus();
    document.execCommand(command, false);
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
    this.refreshCurrentBlock(); // undo/redo can revert a heading change too
  }

  protected onLink(): void {
    if (this.disabled() || this.readOnly()) {
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

  // formatBlock needs a value argument, and its "active" state isn't a
  // simple boolean like the toggle commands — it's "which one of several
  // mutually-exclusive block formats currently applies" — so it gets its
  // own method and its own currentBlockFormat signal instead of routing
  // through onFormat/activeStates, the same way onLink already diverges
  // from the toggle pattern for createLink.
  protected onHeadingChange(event: Event): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const value = (event.target as HTMLSelectElement)
      .value as DynamoEditorBlockFormat;
    const el = this.contentEl().nativeElement;
    el.focus();
    // The bracketed tag form ('<h1>', not bare 'h1') is the historically
    // cross-browser-safe argument for formatBlock.
    document.execCommand('formatBlock', false, `<${value}>`);
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
    this.refreshCurrentBlock();
  }

  protected onImageButtonClick(): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    // Capture the caret BEFORE the async, focus-stealing native file picker
    // opens — by the time FileReader.onload fires (after focus has moved to
    // the OS dialog and back), document.getSelection() no longer reliably
    // reflects what the user had selected at click time.
    const selection = document.getSelection();
    this.savedRange =
      selection && selection.rangeCount > 0
        ? selection.getRangeAt(0).cloneRange()
        : null;
    this.imageInputEl().nativeElement.click();
  }

  protected async onImageFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    // Reset so picking the exact same file again still fires `change`.
    input.value = '';
    if (!file || this.disabled() || this.readOnly()) {
      return;
    }
    // accept="image/*" on the input is a soft filter at the OS file-picker
    // level only, not a hard guarantee — verify at runtime too.
    if (!file.type.startsWith('image/')) {
      return;
    }
    const uploadHandler = this.onImageUpload();
    if (uploadHandler) {
      // NOTE (documented, not fixed, this round): savedRange is one shared
      // field — starting a second image insert before this promise settles
      // overwrites it. Pre-existing (the base64/FileReader path below has a
      // shorter async window with the same issue), not introduced here. A
      // cheap future fix is capturing the range in a per-call local instead.
      try {
        const url = await uploadHandler(file);
        if (url) {
          this.insertImageAtSavedSelection(url);
        } else {
          this.savedRange = null; // cancelled — don't leave a stale selection captured
        }
      } catch (error) {
        this.savedRange = null;
        if (isDevMode()) {
          console.warn(
            '[dg-editor] onImageUpload rejected — image insertion cancelled.',
            error,
          );
        }
      }
      return;
    }
    if (isDevMode() && file.size > IMAGE_SIZE_WARNING_BYTES) {
      console.warn(
        `[dg-editor] Inserting a ${(file.size / 1_048_576).toFixed(1)}MB image as a base64 data URI — ` +
          'this bloats the stored HTML by roughly a third on top of the original file size, ' +
          'with no built-in size limit. Consider a smaller image or downscaling before insertion.',
      );
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.insertImageAtSavedSelection(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // 'hidden' means toolbarButtons() excluded this id entirely — it renders
  // in neither the inline toolbar nor the overflow panel.
  protected locationOf(id: ToolbarItemId): 'inline' | 'overflow' | 'hidden' {
    if (!this.enabledItemOrder().includes(id)) {
      return 'hidden';
    }
    return this.overflowedIds().has(id) ? 'overflow' : 'inline';
  }

  protected toggleOverflow(): void {
    this.overflowOpen.update((open) => !open);
  }

  protected closeOverflow(): void {
    this.overflowOpen.set(false);
  }

  protected onOverflowPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      // No Arrow-key roving focus — the panel mixes toggle buttons and a
      // native <select> (Arrow keys have native meaning inside a focused
      // <select>, conflicting with a roving-focus interceptor), and the
      // inline toolbar itself has never had roving focus either — plain
      // Tab order keeps both render locations consistent with each other.
      return;
    }
    event.preventDefault();
    this.closeOverflow();
    this.overflowTriggerEl()?.nativeElement.focus();
  }

  // A mouse click on the trigger leaves focus ON the trigger (unlike
  // dg-menu, this panel never auto-focuses into itself on open — see the
  // Arrow-key rationale above), so Escape needs its own handler here too,
  // not just on the panel — otherwise a mouse user who opens the panel and
  // immediately presses Escape would find it does nothing.
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.overflowOpen()) {
      event.preventDefault();
      this.closeOverflow();
    }
  }

  protected isActive(command: DynamoEditorStatefulCommand): boolean {
    return this.activeStates()[command];
  }

  // Accepts the full command union (not just the stateful subset) so
  // Link/Undo/Redo/Insert-image — which have no "active" concept — can
  // share the same styling helper as the stateful toggle buttons.
  protected buttonClasses(command: DynamoEditorCommand): string {
    return cn(
      editorButtonStyles({
        active: this.isStatefulCommand(command)
          ? this.isActive(command)
          : false,
      }),
      this.ptFor('button').class,
    );
  }

  private isStatefulCommand(
    command: DynamoEditorCommand,
  ): command is DynamoEditorStatefulCommand {
    return (STATEFUL_COMMANDS as DynamoEditorCommand[]).includes(command);
  }

  private insertImageAtSavedSelection(dataUri: string): void {
    const el = this.contentEl().nativeElement;
    el.focus();
    const selection = document.getSelection();
    if (selection && this.savedRange) {
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
    }
    this.savedRange = null;
    document.execCommand('insertImage', false, dataUri);
    this.commitHtml(el.innerHTML, true);
    this.refreshActiveStates();
    this.refreshCurrentBlock();
  }

  // Recomputes how many trailing toolbar items collapse into the overflow
  // panel, given the toolbar row's currently rendered width. Pure function
  // of available width + the hardcoded per-item widths above — never reads
  // any item's own rect (unnecessary, since every item's width is already
  // known statically, and jsdom-unfriendly if it weren't). A plain method,
  // not a computed() — it has zero REACTIVE dependencies that should
  // auto-trigger it; currentBlockFormat()/disabled()/readOnly() never
  // affect any item's fixed width, and toolbarButtons() is read here only
  // as the current snapshot for this one measurement (set once per
  // instance in practice), not tracked — only a real container resize
  // (ResizeObserver) or the initial afterNextRender should trigger this.
  private recomputeOverflow(): void {
    const available = this.toolbarEl().nativeElement.clientWidth;
    if (available === 0) {
      // Not yet laid out (jsdom, a display:none ancestor, ...) — keep
      // whatever state we already had rather than misreading "not
      // measured yet" as "collapse everything."
      return;
    }
    const order = this.enabledItemOrder();
    const totalWidth = order.reduce((sum, id) => sum + widthOf(id) + GAP_PX, 0);
    if (totalWidth <= available) {
      this.visibleCount.set(order.length);
      return;
    }
    // Only reserve room for the trigger once we know it will actually render.
    const budget = available - TRIGGER_WIDTH_PX - GAP_PX;
    let used = 0;
    let count = 0;
    for (const id of order) {
      const next = used + widthOf(id) + GAP_PX;
      if (next > budget) {
        break;
      }
      used = next;
      count++;
    }
    this.visibleCount.set(count);
  }

  // Mirrors dg-menu's own attachOverlay/detachOverlay/destroyOverlay
  // (libs/components/overlay/menu/src/lib/menu.ts) — lazy connected
  // overlay + backdrop-click-to-close, portaling the panel outside the
  // root's own overflow-hidden DOM subtree (a plain absolutely-positioned
  // panel would get clipped by it the moment the panel is taller than the
  // root's remaining rendered height).
  private attachOverflowOverlay(): void {
    const trigger = this.overflowTriggerEl();
    const template = this.overflowPanelTemplate();
    if (!trigger || !template) {
      return; // the trigger/panel template aren't rendered unless hasOverflow()
    }
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        trigger.nativeElement,
        OVERFLOW_POSITIONS,
        {
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-transparent-backdrop',
        },
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.closeOverflow());
      this.overlayHandle = handle;
    }
    if (!this.portal) {
      this.portal = new TemplatePortal(template, this.viewContainerRef);
    }
    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
  }

  private detachOverflowOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
  }

  private destroyOverflowOverlay(): void {
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
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

  // Sibling to refreshActiveStates() above, called from the same places.
  // queryCommandValue('formatBlock') is the standard (if similarly
  // deprecated) way to read back the current block's tag. Known
  // cross-browser quirk: casing/format has historically varied (e.g. some
  // engines return 'H1' uppercase, or the tag of a wrapping list item
  // instead of 'p') — lowercased and defensively mapped to 'p' for
  // anything that isn't exactly h1/h2/h3, so the worst case is "toolbar
  // shows Paragraph" rather than a thrown error or a bogus selected option.
  private refreshCurrentBlock(): void {
    try {
      const raw = String(
        document.queryCommandValue('formatBlock'),
      ).toLowerCase();
      this.currentBlockFormat.set(
        raw === 'h1' || raw === 'h2' || raw === 'h3' ? raw : 'p',
      );
    } catch {
      this.currentBlockFormat.set('p');
    }
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
    this.refreshCurrentBlock();
  };
}
