import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
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
  GlobalPositionStrategy,
  OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import type { DynamoPassThroughAttrs } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { getFocusableElements } from '@dynamong/utils/dom';
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
  imports: [DynamoPassThroughDirective],
  templateUrl: './tooltip.html',
})
export class DynamoTooltip extends DynamoBaseComponent<DynamoTooltipPart> {
  /** Plain-text hint shown while the trigger is hovered/focused. No content is shown when empty. */
  readonly content = input('');
  readonly position = input<DynamoTooltipPosition>('top');
  readonly showDelay = input(300);
  readonly hideDelay = input(0);
  readonly disabled = input(false);
  /** Forwarded as `aria-describedby`, combined with the tooltip's own content
   *  id while visible, onto the same resolved target `content` itself uses
   *  (see `resolveDescribedbyTarget()`). */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Which interaction(s) show the tooltip. Defaults to `'both'` so keyboard-only users can reach it too (WCAG 1.4.13). */
  readonly trigger = input<DynamoTooltipTrigger>('both');
  /** Auto-hides the tooltip this many ms after it appears, regardless of continued hover/focus. Left unset (the default), it only hides on mouse-leave/blur/Escape as usual. */
  readonly life = input<number | undefined>(undefined);
  /** Only shows the tooltip when the trigger's own text is actually truncated (`scrollWidth > offsetWidth`) — e.g. an ellipsis-overflowed table cell. */
  readonly showOnEllipsis = input(false);
  /**
   * Positions the panel near the cursor instead of anchored to a fixed side
   * of the trigger — useful over a large/irregular hit area (a chart, a
   * canvas, a wide row) where a fixed anchor reads oddly as the pointer
   * moves. `position` is ignored while this is on. A keyboard-triggered
   * show (no cursor position to use) falls back to the trigger element's
   * own bounding-rect center.
   */
  readonly mouseTrack = input(false);
  /** Px offset from the cursor to the panel's top-left corner — only consulted while `mouseTrack` is true. */
  readonly mouseTrackOffsetX = input(12);
  readonly mouseTrackOffsetY = input(12);
  /** Fills the width of its container. Defaults `false` — the wrapper is
   *  genuinely intrinsically sized today, no pre-existing full-width default
   *  to preserve. Useful with `showOnEllipsis`: the truncation check measures
   *  the wrapper's own box, so a `fluid` wrapper spanning its full container
   *  (e.g. a table cell) reflects the actual available width. */
  readonly fluid = input(false);

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
  private readonly renderer = inject(Renderer2);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private showTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lifeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  // Tracks which element (the wrapper, or a resolved focusable descendant —
  // see resolveDescribedbyTarget()) currently carries aria-describedby, and
  // what value, so a target/value change can clean up the old one correctly.
  private describedbyTarget: HTMLElement | null = null;
  private appliedDescribedby: string | null = null;

  // A separate, parallel overlay path for `mouseTrack` — kept fully
  // independent of `overlayHandle` above (a `FlexibleConnectedPositionStrategy`,
  // a different shape entirely) so the cursor-following mode can't affect
  // the default anchored behavior. Only one path is ever exercised per
  // tooltip instance in practice.
  private mouseTrackOverlayRef: OverlayRef | null = null;
  private mouseTrackStrategy: GlobalPositionStrategy | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // No separate wrapper exists — the single top-level `<span>` IS the
  // trigger, so `root` and `trigger` both merge onto it, the same shape
  // Menu's own `triggerPt` computed already established. Each part's own
  // `class` is merged separately below into `triggerClasses`.
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
          tooltipTriggerStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
        ),
  );
  protected readonly panelClasses = computed(() =>
    cn(
      tooltipPanelStyles({ position: this.resolvedPosition() }),
      this.ptFor('panel').class,
    ),
  );
  protected readonly arrowClasses = computed(() =>
    cn(
      tooltipArrowStyles({ position: this.resolvedPosition() }),
      this.ptFor('arrow').class,
    ),
  );

  constructor() {
    super();

    // Repositions an already-visible tooltip if `position` changes at runtime.
    // `resolvedPosition` is set optimistically to the newly-requested side —
    // the async `positionChanges` subscription in `attachOverlay()` corrects it
    // afterward if CDK ends up flipping to a different side on collision.
    effect(() => {
      const preferred = this.position();
      if (!this.mouseTrack() && this.overlayHandle && this.isVisible()) {
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

    // Applies aria-describedby imperatively (never via a static template
    // binding) because the right target isn't always the wrapper `<span>`
    // itself — see resolveDescribedbyTarget()'s own doc comment.
    effect(() => {
      const ids = [
        this.ariaDescribedby(),
        this.isVisible() ? this.contentId : undefined,
      ].filter((id): id is string => !!id);
      this.syncDescribedby(ids.length > 0 ? ids.join(' ') : null);
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected onMouseEnter(event: MouseEvent): void {
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    if (this.usesHover()) this.show();
  }

  protected onMouseMove(event: MouseEvent): void {
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
    if (this.mouseTrack() && this.isVisible()) {
      this.updateMouseTrackPosition();
    }
  }

  protected onMouseLeave(): void {
    if (this.usesHover()) this.hide();
  }

  protected onFocusIn(): void {
    if (this.usesFocus()) {
      if (this.mouseTrack()) {
        // No cursor position exists for a keyboard-triggered show — fall
        // back to the trigger's own center point.
        const rect = this.triggerEl().nativeElement.getBoundingClientRect();
        this.lastMouseX = rect.left + rect.width / 2;
        this.lastMouseY = rect.top + rect.height / 2;
      }
      this.show();
    }
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
    if (this.showOnEllipsis() && !this.isTriggerTruncated()) {
      return;
    }
    this.showTimeoutId = setTimeout(
      () => this.attachOverlay(),
      this.showDelay(),
    );
  }

  /** The element a screen reader actually announces a description for isn't
   *  necessarily the wrapper `<span>` — if the projected content is itself a
   *  separately focusable element (the common case: a button, a link), a
   *  Tab-focused user hears only *that* element's own aria-describedby, never
   *  an ancestor's. Resolves to the first focusable descendant when one
   *  exists, falling back to the wrapper itself for plain non-interactive
   *  projected content (e.g. a showOnEllipsis-truncated text cell), which
   *  correctly has no competing focusable element to lose the description to. */
  private resolveDescribedbyTarget(): HTMLElement {
    const wrapper = this.triggerEl().nativeElement;
    return getFocusableElements(wrapper)[0] ?? wrapper;
  }

  private syncDescribedby(next: string | null): void {
    const target = this.resolveDescribedbyTarget();
    if (
      this.describedbyTarget &&
      this.describedbyTarget !== target &&
      this.appliedDescribedby !== null
    ) {
      this.renderer.removeAttribute(this.describedbyTarget, 'aria-describedby');
    }
    if (next === null) {
      if (this.appliedDescribedby !== null) {
        this.renderer.removeAttribute(target, 'aria-describedby');
      }
    } else {
      this.renderer.setAttribute(target, 'aria-describedby', next);
    }
    this.describedbyTarget = target;
    this.appliedDescribedby = next;
  }

  private isTriggerTruncated(): boolean {
    const el = this.triggerEl().nativeElement;
    return el.scrollWidth > el.offsetWidth;
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
    if (this.lifeTimeoutId !== null) {
      clearTimeout(this.lifeTimeoutId);
      this.lifeTimeoutId = null;
    }
  }

  private attachOverlay(): void {
    if (this.isVisible()) {
      return;
    }
    this.resolvedPosition.set(this.position());

    if (this.mouseTrack()) {
      this.attachMouseTrackOverlay();
    } else {
      this.attachConnectedOverlay();
    }
    this.isVisible.set(true);

    const life = this.life();
    if (life !== undefined) {
      this.lifeTimeoutId = setTimeout(() => this.hide(true), life);
    }
  }

  private attachConnectedOverlay(): void {
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
  }

  private attachMouseTrackOverlay(): void {
    if (!this.mouseTrackOverlayRef) {
      let strategy!: GlobalPositionStrategy;
      this.mouseTrackOverlayRef = this.overlayService.createGlobalOverlay(
        (s) => {
          strategy = s;
        },
      );
      this.mouseTrackStrategy = strategy;
    }
    this.updateMouseTrackPosition();

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.tooltipTemplate(),
        this.viewContainerRef,
      );
    }

    if (!this.mouseTrackOverlayRef.hasAttached()) {
      this.mouseTrackOverlayRef.attach(this.portal);
    }
  }

  private updateMouseTrackPosition(): void {
    if (!this.mouseTrackStrategy || !this.mouseTrackOverlayRef) {
      return;
    }
    this.mouseTrackStrategy
      .left(`${this.lastMouseX + this.mouseTrackOffsetX()}px`)
      .top(`${this.lastMouseY + this.mouseTrackOffsetY()}px`);
    this.mouseTrackOverlayRef.updatePosition();
  }

  private detachOverlay(): void {
    if (this.mouseTrack()) {
      if (this.mouseTrackOverlayRef?.hasAttached()) {
        this.mouseTrackOverlayRef.detach();
      }
    } else if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
    this.isVisible.set(false);
  }

  private destroyOverlay(): void {
    this.clearTimers();
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.mouseTrackOverlayRef?.dispose();
    this.mouseTrackOverlayRef = null;
    this.mouseTrackStrategy = null;
    this.portal = null;
  }
}
