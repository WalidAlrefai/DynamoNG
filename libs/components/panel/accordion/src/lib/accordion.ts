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
import { DynamoAccordionPanel } from './accordion-panel';
import {
  accordionChevronStyles,
  accordionContentBodyStyles,
  accordionContentInnerStyles,
  accordionContentWrapperStyles,
  accordionHeaderStyles,
  accordionPanelStyles,
  accordionRootStyles,
} from './accordion.styles';
import type { DynamoAccordionPart } from './accordion.types';

@Component({
  selector: 'dg-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './accordion.html',
})
export class DynamoAccordion extends DynamoBaseComponent<DynamoAccordionPart> {
  /** Two-way bindable. A single string (or `undefined`) when `multiple` is `false`; a `string[]` when `multiple` is `true`. */
  readonly value = model<string | string[] | undefined>(undefined);
  /** `false` (default): expanding a panel collapses any other. `true`: panels expand/collapse independently. */
  readonly multiple = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly panels = contentChildren(DynamoAccordionPanel);
  private readonly headerButtons =
    viewChildren<ElementRef<HTMLElement>>('headerButton');

  protected readonly accordionId = this.idGenerator.next('dg-accordion');

  // Normalizes both the single-string and string[] shapes of `value()` into
  // one array, so every other piece of logic below is written once.
  protected readonly expandedValues = computed(() => {
    const current = this.value();
    if (current === undefined) {
      return [];
    }
    return Array.isArray(current) ? current : [current];
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(accordionRootStyles, this.styleClass()),
  );

  constructor() {
    super();

    // Prunes `value` of any panel value that no longer exists or has become
    // disabled — keeps `value` valid whenever the panel set changes.
    effect(() => {
      const panelsArr = this.panels();
      if (panelsArr.length === 0) {
        return;
      }
      try {
        const expanded = this.expandedValues();
        const pruned = expanded.filter((val) => {
          const panel = panelsArr.find((p) => p.value() === val);
          return panel !== undefined && !panel.disabled();
        });
        if (pruned.length === expanded.length) {
          return;
        }
        this.value.set(this.multiple() ? pruned : pruned[0]);
      } catch {
        // A content-projected panel's required inputs may not be bound yet
        // during the same change-detection pass that adds/removes panels
        // (e.g. via @for) — skip this run; the effect re-fires once those
        // inputs settle. Same NG0950 guard used by DynamoTabs.
      }
    });

    // Latches every currently-expanded panel's lazy-mount flag.
    effect(() => {
      const expanded = this.expandedValues();
      try {
        for (const panel of this.panels()) {
          if (expanded.includes(panel.value())) {
            panel.hasBeenActivated.set(true);
          }
        }
      } catch {
        // Same NG0950 guard as the pruning effect above.
      }
    });
  }

  protected isExpanded(panel: DynamoAccordionPanel): boolean {
    return this.expandedValues().includes(panel.value());
  }

  protected panelClasses(panel: DynamoAccordionPanel) {
    return accordionPanelStyles({ disabled: panel.disabled() });
  }

  protected headerClasses(panel: DynamoAccordionPanel) {
    return accordionHeaderStyles({
      expanded: this.isExpanded(panel),
      disabled: panel.disabled(),
    });
  }

  protected chevronClasses(panel: DynamoAccordionPanel) {
    return accordionChevronStyles({ expanded: this.isExpanded(panel) });
  }

  protected contentWrapperClasses(panel: DynamoAccordionPanel) {
    return accordionContentWrapperStyles({ expanded: this.isExpanded(panel) });
  }

  protected readonly contentInnerClasses = accordionContentInnerStyles;
  protected readonly contentBodyClasses = accordionContentBodyStyles;

  protected headerId(index: number): string {
    return `${this.accordionId}-header-${index}`;
  }

  protected panelId(index: number): string {
    return `${this.accordionId}-panel-${index}`;
  }

  protected togglePanel(panel: DynamoAccordionPanel): void {
    if (panel.disabled()) {
      return;
    }
    const expanded = this.expandedValues();
    const isOpen = expanded.includes(panel.value());

    if (!this.multiple()) {
      this.value.set(isOpen ? undefined : panel.value());
      if (!isOpen) {
        panel.hasBeenActivated.set(true);
      }
      return;
    }

    const next = isOpen
      ? expanded.filter((val) => val !== panel.value())
      : [...expanded, panel.value()];
    this.value.set(next);
    if (!isOpen) {
      panel.hasBeenActivated.set(true);
    }
  }

  protected onHeaderClick(panel: DynamoAccordionPanel, index: number): void {
    if (panel.disabled()) {
      return;
    }
    this.togglePanel(panel);
    this.headerButtons()[index]?.nativeElement.focus();
  }

  protected onHeaderKeydown(event: KeyboardEvent): void {
    const buttons = this.headerButtons();
    const currentIndex = buttons.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | null;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = this.findEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowUp':
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
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled panel index. Returns `null` if every panel is disabled. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const panelsArr = this.panels();
    if (panelsArr.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < panelsArr.length; step++) {
      index = (index + delta + panelsArr.length) % panelsArr.length;
      if (!panelsArr[index]?.disabled()) {
        return index;
      }
    }
    return null;
  }
}
