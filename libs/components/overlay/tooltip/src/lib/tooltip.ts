import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  ConnectedPosition,
  ConnectionPositionPair,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import {
  tooltipArrowStyles,
  tooltipPanelStyles,
  tooltipTriggerStyles,
} from './tooltip.styles';
import type {
  DynamoTooltipPart,
  DynamoTooltipPosition,
  DynamoTooltipTrigger,
} from './tooltip.types';

const POSITION_MAP: Record<DynamoTooltipPosition, ConnectedPosition> = {
  top: {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetY: -8,
  },
  bottom: {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetY: 8,
  },
  left: {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -8,
  },
  right: {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: 8,
  },
};

const OPPOSITE: Record<DynamoTooltipPosition, DynamoTooltipPosition> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

// Preferred position first, then its opposite, then the two remaining sides —
// the order CDK tries positions in when the preferred one collides with the
// viewport.
function buildPositions(preferred: DynamoTooltipPosition): ConnectedPosition[] {
  const opposite = OPPOSITE[preferred];
  const rest = (['top', 'bottom', 'left', 'right'] as const).filter(
    (candidate) => candidate !== preferred && candidate !== opposite,
  );
  return [
    POSITION_MAP[preferred],
    POSITION_MAP[opposite],
    ...rest.map((candidate) => POSITION_MAP[candidate]),
  ];
}

function resolvePositionName(
  pair: ConnectionPositionPair,
): DynamoTooltipPosition {
  const match = (
    Object.entries(POSITION_MAP) as [DynamoTooltipPosition, ConnectedPosition][]
  ).find(
    ([, candidate]) =>
      candidate.originX === pair.originX &&
      candidate.originY === pair.originY &&
      candidate.overlayX === pair.overlayX &&
      candidate.overlayY === pair.overlayY,
  );
  return match?.[0] ?? 'top';
}

@Component({
  selector: 'dg-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooltip.html',
})
export class DynamoTooltip extends DynamoBaseComponent<DynamoTooltipPart> {
  /** Plain-text hint shown while the trigger is hovered/focused. No content is shown when empty. */
  readonly content = input('');
  readonly position = input<DynamoTooltipPosition>('top');
  readonly showDelay = input(300);
  readonly hideDelay = input(0);
  readonly disabled = input(false);
  /** Which interaction(s) show the tooltip. Defaults to `'both'` so keyboard-only users can reach it too (WCAG 1.4.13). */
  readonly trigger = input<DynamoTooltipTrigger>('both');

  protected readonly contentId = this.idGenerator.next('dg-tooltip');
  protected readonly isVisible = signal(false);
  protected readonly resolvedPosition = signal<DynamoTooltipPosition>('top');

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly tooltipTemplate =
    viewChild.required<TemplateRef<unknown>>('tooltipTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private showTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(tooltipTriggerStyles(), this.styleClass()),
  );
  protected readonly panelClasses = computed(() =>
    tooltipPanelStyles({ position: this.resolvedPosition() }),
  );
  protected readonly arrowClasses = computed(() =>
    tooltipArrowStyles({ position: this.resolvedPosition() }),
  );

  constructor() {
    super();

    // Repositions an already-visible tooltip if `position` changes at runtime.
    // `resolvedPosition` is set optimistically to the newly-requested side —
    // the async `positionChanges` subscription in `attachOverlay()` corrects it
    // afterward if CDK ends up flipping to a different side on collision.
    effect(() => {
      const preferred = this.position();
      if (this.overlayHandle && this.isVisible()) {
        this.resolvedPosition.set(preferred);
        this.overlayHandle.positionStrategy.withPositions(
          buildPositions(preferred),
        );
        this.overlayHandle.overlayRef.updatePosition();
      }
    });

    // Force-hides a visible tooltip the moment `disabled` becomes true.
    effect(() => {
      if (this.disabled() && this.isVisible()) {
        this.hide(true);
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected onMouseEnter(): void {
    if (this.usesHover()) this.show();
  }

  protected onMouseLeave(): void {
    if (this.usesHover()) this.hide();
  }

  protected onFocusIn(): void {
    if (this.usesFocus()) this.show();
  }

  protected onFocusOut(): void {
    if (this.usesFocus()) this.hide(true);
  }

  protected onEscape(): void {
    if (this.isVisible()) this.hide(true);
  }

  private usesHover(): boolean {
    return this.trigger() !== 'focus';
  }

  private usesFocus(): boolean {
    return this.trigger() !== 'hover';
  }

  private show(): void {
    this.clearTimers();
    if (this.disabled() || !this.content().trim() || this.isVisible()) {
      return;
    }
    this.showTimeoutId = setTimeout(
      () => this.attachOverlay(),
      this.showDelay(),
    );
  }

  private hide(immediate = false): void {
    this.clearTimers();
    if (!this.isVisible()) {
      return;
    }
    this.hideTimeoutId = setTimeout(
      () => this.detachOverlay(),
      immediate ? 0 : this.hideDelay(),
    );
  }

  private clearTimers(): void {
    if (this.showTimeoutId !== null) {
      clearTimeout(this.showTimeoutId);
      this.showTimeoutId = null;
    }
    if (this.hideTimeoutId !== null) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }

  private attachOverlay(): void {
    if (this.isVisible()) {
      return;
    }
    this.resolvedPosition.set(this.position());

    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerEl().nativeElement,
        buildPositions(this.position()),
      );
      handle.positionStrategy.positionChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((change) => {
          this.resolvedPosition.set(resolvePositionName(change.connectionPair));
        });
      this.overlayHandle = handle;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.tooltipTemplate(),
        this.viewContainerRef,
      );
    }

    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
    this.isVisible.set(true);
  }

  private detachOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
    this.isVisible.set(false);
  }

  private destroyOverlay(): void {
    this.clearTimers();
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
  }
}
