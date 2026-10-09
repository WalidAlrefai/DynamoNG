import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  dockBadgeStyles,
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
  imports: [DynamoPassThroughDirective],
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
  /** Forwarded as `aria-describedby` on the `role="menu"` list. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `false` — no pre-existing
   *  full-width behavior to preserve. */
  readonly fluid = input(false);

  private readonly tileEls =
    viewChildren<ElementRef<HTMLButtonElement>>('tileEl');

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
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          dockRootStyles({ position: this.position(), fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly listClasses = computed(() =>
    cn(dockListStyles({ position: this.position() }), this.ptFor('list').class),
  );
  protected readonly itemClasses = computed(() =>
    cn(dockItemStyles({ position: this.position() }), this.ptFor('item').class),
  );
  protected readonly iconClasses = computed(() => this.ptFor('icon').class);
  protected readonly labelClasses = computed(() =>
    cn(
      dockLabelStyles({ position: this.position() }),
      this.ptFor('label').class,
    ),
  );
  protected readonly badgeClasses = computed(() =>
    cn(dockBadgeStyles, this.ptFor('badge').class),
  );

  constructor() {
    super();

    // Keeps the roving-tabindex seed valid: runs once at construction (when
    // `focusedIndex()` is still its default `0`, correcting it if
    // `items()[0]` happens to be disabled) and again whenever `items()`
    // changes such that the currently-focused tile becomes disabled or is
    // removed — the same "re-validate on change" shape Select's own round
    // used for its analogous `activeIndex` bug. Leaves `focusedIndex`
    // untouched if every item is disabled (nothing better to move to),
    // matching `focusIndex()`'s own existing null-guard.
    effect(() => {
      const list = this.items();
      const current = this.focusedIndex();
      if (list[current]?.disabled === true || !list[current]) {
        const next = this.findEnabledIndex(-1, 1);
        if (next !== null) {
          this.focusedIndex.set(next);
        }
      }
    });
  }

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
