import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  effect,
  input,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTab } from './tab';
import {
  tabsCloseButtonStyles,
  tabsPanelStyles,
  tabsRootStyles,
  tabsScrollNavButtonStyles,
  tabsScrollNavIconStyles,
  tabsTablistRowStyles,
  tabsTablistStyles,
  tabsTabStyles,
} from './tabs.styles';
import type {
  DynamoTabsActivation,
  DynamoTabsOrientation,
  DynamoTabsPart,
} from './tabs.types';

@Component({
  selector: 'dg-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './tabs.html',
})
export class DynamoTabs extends DynamoBaseComponent<DynamoTabsPart> {
  /** Two-way bindable: `<dg-tabs [(value)]="active">`. */
  readonly value = model<string | undefined>(undefined);
  /** `'manual'` (default): arrow keys move focus only, Enter/Space/click activates. `'automatic'`: arrow-key focus movement activates immediately. */
  readonly activation = input<DynamoTabsActivation>('manual');
  /** Lets the tablist scroll horizontally instead of wrapping — for more tabs than fit on one line. */
  readonly scrollable = input(false);
  /** Prev/next scroll buttons, shown only when `scrollable` is true. */
  readonly showNavigators = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly orientation = input<DynamoTabsOrientation>('horizontal');
  /** Rail width in px — only consulted while `orientation` is `'vertical'`;
   *  there's no natural intrinsic width for a side rail (same reasoning as
   *  Slider's/Carousel's own `verticalHeight`). */
  readonly verticalWidth = input(200);
  /** Fires with the closed tab's `value` when its close button is clicked.
   *  `DynamoTabs` never removes anything itself — content-projected
   *  `<dg-tab>`s are the consumer's own data; they remove it (e.g. from an
   *  `@for`), same as every other closable-item pattern in this codebase. */
  readonly tabClose = output<string>();

  protected readonly tabs = contentChildren(DynamoTab);
  private readonly tabButtons =
    viewChildren<ElementRef<HTMLElement>>('tabButton');
  private readonly tablistRef = viewChild<ElementRef<HTMLElement>>('tablist');

  protected readonly tabsId = this.idGenerator.next('dg-tabs');

  protected readonly activeTab = computed(() => {
    const tabsArr = this.tabs();
    try {
      return (
        tabsArr.find((tab) => tab.value() === this.value()) ??
        tabsArr.find((tab) => !tab.disabled()) ??
        tabsArr[0]
      );
    } catch {
      // See the matching try/catch in the constructor effect below.
      return tabsArr[0];
    }
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          tabsRootStyles({ orientation: this.orientation() }),
          this.styleClass(),
        ),
  );
  protected readonly tablistRowClasses = computed(() =>
    tabsTablistRowStyles({ orientation: this.orientation() }),
  );
  protected readonly tablistClasses = computed(() =>
    tabsTablistStyles({
      orientation: this.orientation(),
      scrollable: this.scrollable(),
    }),
  );
  protected readonly panelClasses = computed(() =>
    tabsPanelStyles({ orientation: this.orientation() }),
  );
  protected readonly scrollNavButtonClasses = tabsScrollNavButtonStyles;
  protected readonly scrollNavIconClasses = computed(() =>
    tabsScrollNavIconStyles({ orientation: this.orientation() }),
  );
  protected readonly closeButtonClasses = tabsCloseButtonStyles;

  constructor() {
    super();

    // Keeps `value` valid whenever the tab set changes (mount, tabs added/removed,
    // or the active tab becoming disabled) — falls back to the first enabled tab,
    // so exactly one (non-disabled, when possible) tab is always selected.
    effect(() => {
      const tabsArr = this.tabs();
      if (tabsArr.length === 0) {
        return;
      }
      try {
        const current = tabsArr.find((tab) => tab.value() === this.value());
        if (current && !current.disabled()) {
          return;
        }
        const fallback = tabsArr.find((tab) => !tab.disabled()) ?? tabsArr[0];
        if (fallback && fallback.value() !== this.value()) {
          this.value.set(fallback.value());
        }
      } catch {
        // A content-projected tab's required inputs may not be bound yet during
        // the same change-detection pass that adds/removes tabs (e.g. via @for) —
        // skip this run; the effect re-fires once those inputs settle.
      }
    });

    // Latches the active tab's lazy-mount flag once selection settles.
    effect(() => this.activeTab()?.hasBeenActivated.set(true));
  }

  protected isActive(tab: DynamoTab): boolean {
    return this.activeTab() === tab;
  }

  protected tabClasses(tab: DynamoTab) {
    return tabsTabStyles({
      orientation: this.orientation(),
      active: this.isActive(tab),
      disabled: tab.disabled(),
    });
  }

  protected tabId(index: number): string {
    return `${this.tabsId}-tab-${index}`;
  }

  protected panelId(index: number): string {
    return `${this.tabsId}-panel-${index}`;
  }

  protected selectTab(tab: DynamoTab): void {
    if (tab.disabled()) {
      return;
    }
    tab.hasBeenActivated.set(true);
    this.value.set(tab.value());
  }

  protected onTabClick(tab: DynamoTab, index: number): void {
    if (tab.disabled()) {
      return;
    }
    this.selectTab(tab);
    this.tabButtons()[index]?.nativeElement.focus();
  }

  protected onCloseClick(event: Event, tab: DynamoTab): void {
    event.stopPropagation();
    this.tabClose.emit(tab.value());
  }

  protected onTablistKeydown(event: KeyboardEvent): void {
    const buttons = this.tabButtons();
    const currentIndex = buttons.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = this.findEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = this.findEnabledIndex(currentIndex, -1);
        break;
      case 'Home':
        nextIndex = this.findEnabledIndex(-1, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledIndex(0, -1);
        break;
      case 'Delete':
      case 'Backspace': {
        const tab = this.tabs()[currentIndex];
        if (tab?.closable()) {
          event.preventDefault();
          this.tabClose.emit(tab.value());
        }
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    if (nextIndex === null || nextIndex === currentIndex) {
      return;
    }

    buttons[nextIndex]?.nativeElement.focus();
    const nextTab = this.tabs()[nextIndex];
    if (this.activation() === 'automatic' && nextTab) {
      this.selectTab(nextTab);
    }
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled tab index. Returns `null` if every tab is disabled. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const tabsArr = this.tabs();
    if (tabsArr.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < tabsArr.length; step++) {
      index = (index + delta + tabsArr.length) % tabsArr.length;
      if (!tabsArr[index]?.disabled()) {
        return index;
      }
    }
    return null;
  }

  // Not implemented in jsdom (guarded rather than assumed, same defensiveness
  // as any other real-only browser API used in this codebase) — and plain
  // 'auto' rather than 'smooth', matching the docs-app scroll-spy's own
  // finding that `behavior: 'smooth'` can silently no-op in some automated/
  // nested-scroller contexts.
  protected scrollTablist(direction: -1 | 1): void {
    const amount = direction * 160;
    this.tablistRef()?.nativeElement.scrollBy?.(
      this.orientation() === 'vertical'
        ? { top: amount, behavior: 'auto' }
        : { left: amount, behavior: 'auto' },
    );
  }

  protected scrollNavAriaLabel(direction: -1 | 1): string {
    if (this.orientation() === 'vertical') {
      return direction === -1 ? 'Scroll tabs up' : 'Scroll tabs down';
    }
    return direction === -1 ? 'Scroll tabs left' : 'Scroll tabs right';
  }
}
