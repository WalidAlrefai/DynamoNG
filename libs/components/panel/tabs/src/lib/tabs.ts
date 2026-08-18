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
  viewChildren,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTab } from './tab';
import {
  tabsPanelStyles,
  tabsRootStyles,
  tabsTablistStyles,
  tabsTabStyles,
} from './tabs.styles';
import type { DynamoTabsActivation, DynamoTabsPart } from './tabs.types';

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
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly tabs = contentChildren(DynamoTab);
  private readonly tabButtons =
    viewChildren<ElementRef<HTMLElement>>('tabButton');

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
    this.unstyled() ? this.styleClass() : cn(tabsRootStyles, this.styleClass()),
  );
  protected readonly tablistClasses = tabsTablistStyles;
  protected readonly panelClasses = tabsPanelStyles;

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
        nextIndex = this.findEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowLeft':
        nextIndex = this.findEnabledIndex(currentIndex, -1);
        break;
      case 'Home':
        nextIndex = this.findEnabledIndex(-1, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledIndex(0, -1);
        break;
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
}
