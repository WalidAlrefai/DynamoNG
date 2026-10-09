import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
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
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import type { DynamoPassThroughAttrs } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { getFocusableElements, isBrowser } from '@dynamong/utils/dom';
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
  imports: [NgTemplateOutlet, DynamoPassThroughDirective],
  templateUrl: './popover.html',
})
export class DynamoPopover extends DynamoBaseComponent<DynamoPopoverPart> {
  readonly position = input<DynamoPopoverPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: `<dg-popover [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly closeOnBackdropClick = input(true);
  readonly closeOnEscape = input(true);
  /** Moves focus into the panel (and traps it there) once shown. Set `false` to leave focus on the trigger — e.g. for a purely informational popover the user isn't expected to interact with. */
  readonly focusOnShow = input(true);
  /** Forwarded as `aria-describedby` onto the same resolved trigger target as
   *  `aria-haspopup`/`aria-expanded`/`aria-controls` (see `resolveTriggerTarget()`). */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  protected readonly content = contentChild.required(DynamoPopoverContent);
  protected readonly panelId = this.idGenerator.next('dg-popover');
  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  private readonly overlayService = inject(DynamoOverlayService);
  private readonly focusTrapService = inject(DynamoFocusTrapService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private focusTrap: ConfigurableFocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  // Tracks which element (the wrapper, or a resolved focusable descendant —
  // see resolveTriggerTarget()) currently carries the disclosure ARIA
  // attributes, so a target change cleans up the old one correctly.
  private triggerA11yTarget: HTMLElement | null = null;

  // No separate wrapper exists — the single top-level `<span>` IS the
  // trigger, so `root` and `trigger` both merge onto it, the same shape
  // Menu's/Tooltip's own `triggerPt` computed already established.
  protected readonly triggerPt = computed<DynamoPassThroughAttrs>(() => ({
    ...this.ptFor('root'),
    ...this.ptFor('trigger'),
  }));
  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? cn(
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
        )
      : cn(
          popoverTriggerStyles,
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
        ),
  );
  protected readonly panelClasses = computed(() =>
    cn(popoverPanelStyles, this.ptFor('panel').class),
  );

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
      if (this.open() && panelEl && this.focusOnShow()) {
        this.activateFocusTrap(panelEl.nativeElement);
      } else if (!this.open()) {
        this.releaseFocusTrap();
      }
    });

    // Applies the disclosure ARIA attributes imperatively (never via a
    // static template binding) because the right target isn't always the
    // wrapper `<span>` itself — see resolveTriggerTarget()'s own doc comment.
    effect(() => {
      this.syncTriggerA11y();
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
    if (!this.closeOnEscape()) {
      return;
    }
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close();
    }
  }

  /** The element a screen reader actually announces disclosure state for
   *  isn't necessarily the wrapper `<span>` — if the projected content is
   *  itself a separately focusable element (the documented common case: a
   *  button), a Tab-focused user hears only *that* element's own ARIA
   *  state, never an ancestor's. Resolves to the first focusable descendant
   *  when one exists, falling back to the wrapper itself for plain
   *  non-interactive projected content. */
  private resolveTriggerTarget(): HTMLElement {
    const wrapper = this.triggerEl().nativeElement;
    return getFocusableElements(wrapper)[0] ?? wrapper;
  }

  private syncTriggerA11y(): void {
    const isOpen = this.open();
    const describedby = this.ariaDescribedby();
    const target = this.resolveTriggerTarget();

    if (this.triggerA11yTarget && this.triggerA11yTarget !== target) {
      const previous = this.triggerA11yTarget;
      this.renderer.removeAttribute(previous, 'aria-haspopup');
      this.renderer.removeAttribute(previous, 'aria-expanded');
      this.renderer.removeAttribute(previous, 'aria-controls');
      this.renderer.removeAttribute(previous, 'aria-describedby');
    }

    this.renderer.setAttribute(target, 'aria-haspopup', 'dialog');
    this.renderer.setAttribute(
      target,
      'aria-expanded',
      isOpen ? 'true' : 'false',
    );
    if (isOpen) {
      this.renderer.setAttribute(target, 'aria-controls', this.panelId);
    } else {
      this.renderer.removeAttribute(target, 'aria-controls');
    }
    if (describedby) {
      this.renderer.setAttribute(target, 'aria-describedby', describedby);
    } else {
      this.renderer.removeAttribute(target, 'aria-describedby');
    }

    this.triggerA11yTarget = target;
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
