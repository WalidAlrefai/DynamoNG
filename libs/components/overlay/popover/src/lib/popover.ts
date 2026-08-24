import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import { isBrowser } from '@dynamong/utils/dom';
import { DynamoPopoverContent } from './popover-content';
import { popoverPanelStyles, popoverTriggerStyles } from './popover.styles';
import type { DynamoPopoverPart, DynamoPopoverPosition } from './popover.types';

const POSITION_MAP: Record<DynamoPopoverPosition, ConnectedPosition> = {
  'bottom-start': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  'bottom-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  'top-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
  'top-end': {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
};

const ALL_POSITIONS: DynamoPopoverPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];

// Preferred corner first, the other three as CDK collision fallbacks.
function buildPositions(preferred: DynamoPopoverPosition): ConnectedPosition[] {
  return [
    POSITION_MAP[preferred],
    ...ALL_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => POSITION_MAP[candidate],
    ),
  ];
}

@Component({
  selector: 'dg-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './popover.html',
})
export class DynamoPopover extends DynamoBaseComponent<DynamoPopoverPart> {
  readonly position = input<DynamoPopoverPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: `<dg-popover [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly closeOnBackdropClick = input(true);

  protected readonly content = contentChild.required(DynamoPopoverContent);
  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private readonly overlayService = inject(DynamoOverlayService);
  private readonly focusTrapService = inject(DynamoFocusTrapService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private focusTrap: ConfigurableFocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(popoverTriggerStyles, this.styleClass()),
  );
  protected readonly panelClasses = popoverPanelStyles;

  constructor() {
    super();

    effect(() => {
      if (this.open()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    // Gated on panel() becoming available post-attach (the portal's
    // embedded view doesn't exist synchronously when open flips true) —
    // same activate/release pair as DynamoDrawer.
    effect(() => {
      const panelEl = this.panel();
      if (this.open() && panelEl) {
        this.activateFocusTrap(panelEl.nativeElement);
      } else if (!this.open()) {
        this.releaseFocusTrap();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.releaseFocusTrap();
      this.destroyOverlay();
    });
  }

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  // The trigger wrapper is tabindex="-1" (never itself the focus target —
  // keyboard operability is expected to come from the projected trigger
  // content, e.g. a <dg-button>, matching every usage example), so a real
  // keydown here would only ever fire for a directly-focused wrapper, which
  // shouldn't happen in practice. Guarded rather than omitted so it's both
  // honest about that assumption and satisfies template a11y lint's
  // click-needs-a-key-equivalent rule for the (click) below.
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  close(): void {
    this.open.set(false);
  }

  protected onEscape(): void {
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close();
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
    // The focus trap's own initial-focus routine resolves asynchronously;
    // move focus into the panel synchronously too so it's never left on the
    // trigger that opened it.
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

  private attachOverlay(): void {
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerEl().nativeElement,
        buildPositions(this.position()),
        {
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-transparent-backdrop',
        },
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.onBackdropClick());
      this.overlayHandle = handle;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.panelTemplate(),
        this.viewContainerRef,
      );
    }

    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
  }

  private detachOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
  }

  private destroyOverlay(): void {
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
  }
}
