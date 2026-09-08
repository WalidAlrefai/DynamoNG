import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  panelChevronStyles,
  panelContentBodyStyles,
  panelContentInnerStyles,
  panelContentWrapperStyles,
  panelHeaderButtonStyles,
  panelHeaderStyles,
  panelStyles,
  panelTitleStyles,
} from './panel.styles';
import type { DynamoPanelPart, DynamoPanelVariant } from './panel.types';

/**
 * A single standalone collapsible section — the gap between Card (a plain
 * content container, no collapse) and Accordion (coordinates *multiple*
 * mutually-exclusive/multi panels). Collapse mechanics are Accordion's own
 * proven 0fr/1fr grid-rows trick, adapted down to Panel's one-header-one-
 * region case (no roving tabindex needed — there's only ever one toggle).
 */
@Component({
  selector: 'dg-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './panel.html',
})
export class DynamoPanel extends DynamoBaseComponent<DynamoPanelPart> {
  readonly header = input('');
  readonly variant = input<DynamoPanelVariant>('elevated');
  readonly collapsible = input(false);
  /** Two-way bindable: `<dg-panel [(collapsed)]="isCollapsed">`. Only meaningful when collapsible. */
  readonly collapsed = model(false);

  protected readonly headerId = this.idGenerator.next('dg-panel-header');
  protected readonly contentId = this.idGenerator.next('dg-panel-content');

  protected readonly expanded = computed(() => !this.collapsible() || !this.collapsed());

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(panelStyles({ variant: this.variant() }), this.styleClass()),
  );
  protected readonly headerClasses = panelHeaderStyles;
  protected readonly headerButtonClasses = panelHeaderButtonStyles;
  protected readonly titleClasses = panelTitleStyles;
  protected readonly contentInnerClasses = panelContentInnerStyles;
  protected readonly contentBodyClasses = panelContentBodyStyles;

  protected readonly contentWrapperClasses = computed(() =>
    panelContentWrapperStyles({ expanded: this.expanded() }),
  );
  protected readonly chevronClasses = computed(() => panelChevronStyles({ expanded: this.expanded() }));

  protected toggle(): void {
    this.collapsed.update((value) => !value);
  }
}
