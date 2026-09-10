import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  dockItemStyles,
  dockLabelStyles,
  dockListStyles,
  dockRootStyles,
} from './dock.styles';
import type {
  DynamoDockItem,
  DynamoDockPart,
  DynamoDockPosition,
} from './dock.types';

/**
 * A macOS-style dock: a row (bottom/top) or column (left/right) of tiles
 * that magnify toward the pointer. Keyboard nav is a roving-tabindex row —
 * the same model as Menubar's bar. The magnification transform is the one
 * deliberate inline-style exception, like Progress's fill width.
 */
@Component({
  selector: 'dg-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dock.html',
})
export class DynamoDock extends DynamoBaseComponent<DynamoDockPart> {
  readonly items = input.required<DynamoDockItem[]>();
  readonly position = input<DynamoDockPosition>('bottom');
  readonly magnification = input(true);
  readonly magnificationScale = input(1.6);
  /** Pixel distance from the pointer at which magnification falls to zero. */
  readonly magnificationRange = input(140);
  readonly ariaLabel = input<string | undefined>(undefined);

  private readonly tileEls = viewChildren<ElementRef<HTMLButtonElement>>('tileEl');

  /** Roving-tabindex position — always exactly one item. */
  protected readonly focusedIndex = signal(0);
  /**
   * Pointer coordinate along the dock's primary axis (x for a row, y for a
   * column), or `null` when the pointer is outside the dock.
   */
  private readonly pointer = signal<number | null>(null);

  protected readonly isVertical = computed(
    () => this.position() === 'left' || this.position() === 'right',
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(dockRootStyles({ position: this.position() }), this.styleClass()),
  );
  protected readonly listClasses = computed(() =>
    dockListStyles({ position: this.position() }),
  );
  protected readonly itemClasses = computed(() =>
    dockItemStyles({ position: this.position() }),
  );
  protected readonly labelClasses = computed(() =>
    dockLabelStyles({ position: this.position() }),
  );

  protected onPointerMove(event: MouseEvent): void {
    if (!this.magnification()) return;
    this.pointer.set(this.isVertical() ? event.clientY : event.clientX);
  }

  protected resetScale(): void {
    this.pointer.set(null);
  }

  /** The `transform` for tile `index` — `scale(1)` unless the pointer is near it. */
  protected tileTransform(index: number): string {
    const pointer = this.pointer();
    if (pointer === null || !this.magnification()) return 'scale(1)';

    const rect = this.tileEls()[index]?.nativeElement.getBoundingClientRect();
    if (!rect) return 'scale(1)';

    const centre = this.isVertical()
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const distance = Math.abs(pointer - centre);
    const proximity = Math.max(0, 1 - distance / this.magnificationRange());
    const scale = 1 + (this.magnificationScale() - 1) * proximity;
    return `scale(${scale.toFixed(3)})`;
  }

  protected run(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.focusedIndex.set(index);
    item.command?.();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const tiles = this.tileEls();
    const current = tiles.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (current === -1) return;

    const nextKey = this.isVertical() ? 'ArrowDown' : 'ArrowRight';
    const prevKey = this.isVertical() ? 'ArrowUp' : 'ArrowLeft';

    switch (event.key) {
      case nextKey:
        event.preventDefault();
        this.focusIndex(this.findEnabledIndex(current, 1), tiles);
        break;
      case prevKey:
        event.preventDefault();
        this.focusIndex(this.findEnabledIndex(current, -1), tiles);
        break;
      case 'Home':
        event.preventDefault();
        this.focusIndex(this.findEnabledIndex(-1, 1), tiles);
        break;
      case 'End':
        event.preventDefault();
        this.focusIndex(this.findEnabledIndex(0, -1), tiles);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.run(current);
        break;
      default:
        break;
    }
  }

  private focusIndex(
    index: number | null,
    tiles: readonly ElementRef<HTMLButtonElement>[],
  ): void {
    if (index === null) return;
    this.focusedIndex.set(index);
    tiles[index]?.nativeElement.focus();
  }

  /** Wrapping scan for the next non-disabled item — copy of Menubar's `findEnabledBarIndex`. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const list = this.items();
    if (list.length === 0) return null;
    let index = from;
    for (let step = 0; step < list.length; step++) {
      index = (index + delta + list.length) % list.length;
      if (!list[index]?.disabled) return index;
    }
    return null;
  }
}
