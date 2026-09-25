import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';
import { cn } from '@dynamong/utils/class-merge';
import { isBrowser } from '@dynamong/utils/dom';
import {
  dialogBackdropStyles,
  dialogCloseButtonStyles,
  dialogPanelStyles,
} from './dialog.styles';
import type { DynamoDialogPart, DynamoDialogSize } from './dialog.types';

type DialogAnimationState = 'closed' | 'opening' | 'open' | 'closing';

@Component({
  selector: 'dg-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.html',
})
export class DynamoDialog extends DynamoBaseComponent<DynamoDialogPart> {
  /** Two-way bindable: `<dg-dialog [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly title = input<string | undefined>(undefined);
  readonly size = input<DynamoDialogSize>('md');
  readonly closeOnBackdropClick = input(true);
  readonly closeOnEscape = input(true);
  /** Required when no `title` is set, so the dialog has an accessible name. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Renders the dimming backdrop and blocks interaction with the rest of the page. Set `false` for a non-modal floating panel — `closeOnBackdropClick` has no effect then, since there's no backdrop to click. */
  readonly modal = input(true);
  /** Prevents the page behind the dialog from scrolling while it's open. */
  readonly blockScroll = input(false);
  /** Shows the header close button. Only relevant when `title` is set — with no title there's no header to put it in regardless. */
  readonly closable = input(true);

  protected readonly titleId = this.idGenerator.next('dg-dialog-title');
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly focusTrapService = inject(DynamoFocusTrapService);
  private readonly destroyRef = inject(DestroyRef);

  private focusTrap: ConfigurableFocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  // Must stay in sync with `duration-200` in dialog.styles.ts.
  private static readonly CLOSE_DURATION_MS = 200;
  protected readonly animationState = signal<DialogAnimationState>('closed');
  private closeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly panelPhase = computed(() => {
    const state = this.animationState();
    return state === 'closed' ? 'opening' : state;
  });
  protected readonly panelClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          dialogPanelStyles({
            size: this.size(),
            phase: this.panelPhase(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly backdropClasses = computed(() =>
    this.unstyled()
      ? ''
      : dialogBackdropStyles({ visible: this.animationState() === 'open' }),
  );
  protected readonly closeButtonClasses = dialogCloseButtonStyles;

  constructor() {
    super();

    effect(() => {
      if (this.open()) {
        this.beginOpen();
      } else {
        this.beginClose();
      }
    });

    effect(() => {
      const panel = this.panelRef()?.nativeElement;
      const state = this.animationState();

      if (state === 'open' && panel) {
        this.activateFocusTrap(panel);
      } else if (state === 'closed' || state === 'closing') {
        this.releaseFocusTrap();
      }
    });

    this.destroyRef.onDestroy(() => this.clearCloseTimeout());

    effect((onCleanup) => {
      if (!isBrowser() || !this.open() || !this.blockScroll()) {
        return;
      }
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previousOverflow;
      });
    });
  }

  close(): void {
    this.open.set(false);
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close();
    }
  }

  protected onEscape(): void {
    if (this.closeOnEscape()) {
      this.close();
    }
  }

  private beginOpen(): void {
    this.clearCloseTimeout();
    if (
      this.animationState() === 'open' ||
      this.animationState() === 'opening'
    ) {
      return;
    }

    this.animationState.set('opening');

    // Double rAF, not single: a single callback can still run before the
    // browser has committed a paint at the closed transform in some
    // browsers/timings, which would coalesce the two states and skip the
    // transition (same reasoning as Drawer's beginOpen).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.open()) {
          this.animationState.set('open');
        }
      });
    });
  }

  private beginClose(): void {
    if (
      this.animationState() === 'closed' ||
      this.animationState() === 'closing'
    ) {
      return;
    }

    this.animationState.set('closing');
    this.closeTimeoutId = setTimeout(() => {
      this.animationState.set('closed');
      this.closeTimeoutId = null;
    }, DynamoDialog.CLOSE_DURATION_MS);
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeoutId !== null) {
      clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }
  }

  private activateFocusTrap(panel: HTMLElement): void {
    if (this.focusTrap) {
      return;
    }
    if (isBrowser()) {
      this.previouslyFocusedElement =
        document.activeElement as HTMLElement | null;
    }
    this.focusTrap = this.focusTrapService.create(panel);
    // The focus trap's own initial-focus routine resolves asynchronously; move
    // focus into the panel synchronously too so it's never left on whatever
    // triggered the dialog (e.g. mid-way through an animation frame delay).
    panel.focus();
  }

  private releaseFocusTrap(): void {
    if (!this.focusTrap) {
      return;
    }
    this.focusTrap.destroy();
    this.focusTrap = null;
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }
}
