import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoSplitterPanel } from './splitter-panel';
import {
  splitterDividerStyles,
  splitterPanelStyles,
  splitterRootStyles,
} from './splitter.styles';
import type {
  DynamoSplitterOrientation,
  DynamoSplitterPart,
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
  imports: [NgTemplateOutlet],
  templateUrl: './splitter.html',
})
export class DynamoSplitter extends DynamoBaseComponent<DynamoSplitterPart> {
  readonly orientation = input<DynamoSplitterOrientation>('horizontal');
  readonly disabled = input(false);
  readonly gutterSize = input(8);

  protected readonly panels = contentChildren(DynamoSplitterPanel);
  private readonly containerRef =
    viewChild.required<ElementRef<HTMLElement>>('container');

  // Percentages, one per panel, always summing to 100 (barring floating-point
  // noise) — recomputed whenever the panel count changes.
  protected readonly sizes = signal<number[]>([]);
  private dragStart: DragState | null = null;

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          splitterRootStyles({ orientation: this.orientation() }),
          this.styleClass(),
        ),
  );
  protected readonly panelClasses = splitterPanelStyles;
  protected readonly dividerClasses = computed(() =>
    splitterDividerStyles({
      orientation: this.orientation(),
      disabled: this.disabled(),
    }),
  );

  constructor() {
    super();
    effect(() => {
      const panels = this.panels();
      untracked(() => this.sizes.set(this.computeInitialSizes(panels)));
    });
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
    const rect = this.containerRef().nativeElement.getBoundingClientRect();
    const totalPx =
      this.orientation() === 'horizontal' ? rect.width : rect.height;
    const clientPos =
      this.orientation() === 'horizontal' ? event.clientX : event.clientY;
    const deltaPct =
      totalPx > 0
        ? ((clientPos - dragStart.startClientPos) / totalPx) * 100
        : 0;
    this.applyDelta(dragStart.index, deltaPct, dragStart.startSizes);
  }

  protected onDividerPointerUp(): void {
    this.dragStart = null;
  }

  protected onDividerKeydown(index: number, event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const horizontal = this.orientation() === 'horizontal';
    const step = 5;
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
    this.applyDelta(index, delta, [sizes[index] ?? 0, sizes[index + 1] ?? 0]);
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
    const rawA = deltaPct === Infinity || deltaPct === -Infinity
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
