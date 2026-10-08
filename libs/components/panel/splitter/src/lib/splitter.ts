import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoSplitterPanel } from './splitter-panel';
import {
  readSplitterSizes,
  writeSplitterSizes,
} from './splitter-state-storage';
import {
  splitterDividerStyles,
  splitterPanelStyles,
  splitterRootStyles,
} from './splitter.styles';
import type {
  DynamoSplitterOrientation,
  DynamoSplitterPart,
  DynamoSplitterStateStorage,
} from './splitter.types';

interface DragState {
  index: number;
  startSizes: [number, number];
  startClientPos: number;
}

@Component({
  selector: 'dg-splitter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, DynamoPassThroughDirective],
  templateUrl: './splitter.html',
})
export class DynamoSplitter extends DynamoBaseComponent<DynamoSplitterPart> {
  readonly orientation = input<DynamoSplitterOrientation>('horizontal');
  readonly disabled = input(false);
  readonly gutterSize = input(8);
  /** Percentage points a single keyboard press (arrow key) resizes by. */
  readonly step = input(5);
  /** Forwarded as `aria-describedby` on every divider. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` (today's existing,
   *  always-full-width behavior). */
  readonly fluid = input(true);
  /** Fires with the full sizes array once a drag or keyboard resize completes. */
  readonly resizeEnd = output<number[]>();
  /** Opt-in — when set, panel sizes are saved to browser storage under this
   *  key whenever a resize completes, and restored on mount instead of the
   *  normal initialSize-driven distribution. `undefined` by default, so
   *  every existing splitter is unaffected. */
  readonly stateKey = input<string | undefined>(undefined);
  /** Which storage to persist to — only consulted while `stateKey` is set.
   *  Matches PrimeNG's own Splitter default. */
  readonly stateStorage = input<DynamoSplitterStateStorage>('session');

  protected readonly panels = contentChildren(DynamoSplitterPanel);
  private readonly containerRef =
    viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly directionality = inject(Directionality);

  // Percentages, one per panel, always summing to 100 (barring floating-point
  // noise) — recomputed whenever the panel count changes.
  protected readonly sizes = signal<number[]>([]);
  private dragStart: DragState | null = null;

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          splitterRootStyles({
            orientation: this.orientation(),
            fluid: this.fluid(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly panelClasses = computed(() =>
    cn(splitterPanelStyles, this.ptFor('panel').class),
  );
  protected readonly dividerClasses = computed(() =>
    cn(
      splitterDividerStyles({
        orientation: this.orientation(),
        disabled: this.disabled(),
      }),
      this.ptFor('divider').class,
    ),
  );

  constructor() {
    super();
    effect(() => {
      const panels = this.panels();
      const key = this.stateKey();
      const storageKind = this.stateStorage();
      untracked(() => {
        const restored = key
          ? readSplitterSizes(key, storageKind, panels.length)
          : null;
        this.sizes.set(restored ?? this.computeInitialSizes(panels));
      });
    });
  }

  private persistSizes(): void {
    const key = this.stateKey();
    if (!key) return;
    writeSplitterSizes(key, this.stateStorage(), this.sizes());
  }

  private computeInitialSizes(
    panels: readonly DynamoSplitterPanel[],
  ): number[] {
    if (panels.length === 0) {
      return [];
    }
    const explicit = panels.map((panel) => panel.initialSize());
    const explicitSum = explicit.reduce<number>(
      (sum, size) => sum + (size ?? 0),
      0,
    );
    const undefinedCount = explicit.filter((size) => size == null).length;
    const remainder = Math.max(0, 100 - explicitSum);
    const evenShare = undefinedCount > 0 ? remainder / undefinedCount : 0;
    const sizes = explicit.map((size) => size ?? evenShare);

    const total = sizes.reduce<number>((sum, size) => sum + size, 0);
    if (total <= 0) {
      return panels.map(() => 100 / panels.length);
    }
    return sizes.map((size) => (size / total) * 100);
  }

  protected panelStyle(index: number): Record<string, string> {
    return { flex: `0 0 ${this.sizes()[index] ?? 0}%` };
  }

  protected dividerStyle(): Record<string, string> {
    return this.orientation() === 'horizontal'
      ? { width: `${this.gutterSize()}px` }
      : { height: `${this.gutterSize()}px` };
  }

  // The largest value this divider can actually reach: resizing only ever
  // redistributes between the two adjacent panels (their combined size never
  // changes), so the true ceiling is that pair's current combined size minus
  // the second panel's minSize — not a fixed 100 - minSize, which would
  // overstate how far the divider can move whenever other panels exist.
  protected dividerMax(index: number): number {
    const sizes = this.sizes();
    const panels = this.panels();
    const combined = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0);
    const minB = panels[index + 1]?.minSize() ?? 0;
    return combined - minB;
  }

  protected onDividerPointerDown(index: number, event: PointerEvent): void {
    if (this.disabled()) {
      return;
    }
    const sizes = this.sizes();
    this.dragStart = {
      index,
      startSizes: [sizes[index] ?? 0, sizes[index + 1] ?? 0],
      startClientPos:
        this.orientation() === 'horizontal' ? event.clientX : event.clientY,
    };
    // Not implemented in jsdom — guarded rather than assumed, same
    // defensiveness as Carousel/Slider's pointer-drag.
    (
      event.currentTarget as HTMLElement & {
        setPointerCapture?(pointerId: number): void;
      }
    ).setPointerCapture?.(event.pointerId);
  }

  protected onDividerPointerMove(event: PointerEvent): void {
    const dragStart = this.dragStart;
    if (!dragStart) {
      return;
    }
    // A disabled flip mid-drag isn't guaranteed a clean pointerup afterward
    // (captured-pointer event delivery bypasses the disabled divider's own
    // pointer-events:none), so clear drag state proactively here too, not
    // just inside pointerup — same defensiveness as Slider's own
    // onTrackPointerMove. The partial resize already applied stays as-is
    // (no rollback); only the still-in-progress drag is stopped.
    if (this.disabled()) {
      this.dragStart = null;
      return;
    }
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const totalPx =
      this.orientation() === 'horizontal' ? rect.width : rect.height;
    const clientPos =
      this.orientation() === 'horizontal' ? event.clientX : event.clientY;
    const deltaPct =
      totalPx > 0
        ? ((clientPos - dragStart.startClientPos) / totalPx) * 100
        : 0;
    this.applyDelta(
      dragStart.index,
      this.physicalDelta(deltaPct),
      dragStart.startSizes,
    );
  }

  protected onDividerPointerUp(): void {
    if (this.dragStart && !this.disabled()) {
      this.dragStart = null;
      this.resizeEnd.emit(this.sizes());
      this.persistSizes();
    } else {
      this.dragStart = null;
    }
  }

  // Splitter's divider follows the ARIA APG Window Splitter pattern —
  // physical/visual semantics (dragging/pressing "right" always means
  // "toward the right edge of the screen"), unlike a Slider's role="slider"
  // thumb, where "right" always means "increase value" regardless of
  // direction. flex-direction: row visually mirrors panel order under
  // dir="rtl" with zero CSS/layout changes needed here, but the drag/
  // keyboard math has no such free mirroring — it must be negated here.
  // Vertical orientation is never mirrored by text direction.
  private physicalDelta(deltaPct: number): number {
    const isRtl =
      this.orientation() === 'horizontal' &&
      this.directionality.value === 'rtl';
    return isRtl ? -deltaPct : deltaPct;
  }

  protected onDividerKeydown(index: number, event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const horizontal = this.orientation() === 'horizontal';
    const step = this.step();
    let delta: number | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        if (horizontal) delta = -step;
        break;
      case 'ArrowRight':
        if (horizontal) delta = step;
        break;
      case 'ArrowUp':
        if (!horizontal) delta = -step;
        break;
      case 'ArrowDown':
        if (!horizontal) delta = step;
        break;
      case 'Home':
        delta = -Infinity;
        break;
      case 'End':
        delta = Infinity;
        break;
      default:
        return;
    }
    if (delta === undefined) {
      return;
    }
    event.preventDefault();
    const sizes = this.sizes();
    this.applyDelta(index, this.physicalDelta(delta), [
      sizes[index] ?? 0,
      sizes[index + 1] ?? 0,
    ]);
    this.resizeEnd.emit(this.sizes());
    this.persistSizes();
  }

  // Clamps so neither adjacent panel goes below its own minSize; the pair's
  // combined size never changes.
  private applyDelta(
    index: number,
    deltaPct: number,
    [startA, startB]: [number, number],
  ): void {
    const panels = this.panels();
    const panelA = panels[index];
    const panelB = panels[index + 1];
    if (!panelA || !panelB) {
      return;
    }
    const combined = startA + startB;
    const minA = panelA.minSize();
    const minB = panelB.minSize();
    const rawA =
      deltaPct === Infinity || deltaPct === -Infinity
        ? deltaPct > 0
          ? combined - minB
          : minA
        : startA + deltaPct;
    const nextA = Math.min(combined - minB, Math.max(minA, rawA));
    const nextB = combined - nextA;

    this.sizes.update((current) => {
      const updated = [...current];
      updated[index] = nextA;
      updated[index + 1] = nextB;
      return updated;
    });
  }
}
