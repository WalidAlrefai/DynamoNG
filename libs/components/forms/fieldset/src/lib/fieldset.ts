import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  fieldsetChevronStyles,
  fieldsetContentBodyStyles,
  fieldsetContentInnerStyles,
  fieldsetContentWrapperStyles,
  fieldsetLegendStyles,
  fieldsetStyles,
  fieldsetToggleButtonStyles,
} from './fieldset.styles';
import type { DynamoFieldsetPart } from './fieldset.types';

/**
 * A bordered, `<legend>`'d form section built on the real native
 * `<fieldset>`/`<legend>` elements — the first component in this codebase to
 * use them (confirmed zero prior use). Two things that fall out of that for
 * free: `<fieldset disabled>` disables every descendant form control without
 * this component touching any of them, and assistive tech already gets a
 * native grouping relationship from `<fieldset>`+`<legend>` — so unlike
 * Panel/Accordion, the collapsible content region deliberately does NOT get
 * `role="region"`/`aria-labelledby`; layering that on top would just
 * duplicate semantics the native elements already provide.
 */
@Component({
  selector: 'dg-fieldset',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fieldset.html',
})
export class DynamoFieldset extends DynamoBaseComponent<DynamoFieldsetPart> {
  readonly legend = input('');
  readonly collapsible = input(false);
  /** Two-way bindable: `<dg-fieldset [(collapsed)]="isCollapsed">`. Only meaningful when collapsible. */
  readonly collapsed = model(false);
  /** Maps to the native `<fieldset disabled>` attribute — disables every descendant form control. */
  readonly disabled = input(false);

  protected readonly contentId = this.idGenerator.next('dg-fieldset-content');

  protected readonly expanded = computed(() => !this.collapsible() || !this.collapsed());

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(fieldsetStyles({ disabled: this.disabled() }), this.styleClass()),
  );
  protected readonly legendClasses = fieldsetLegendStyles;
  protected readonly toggleButtonClasses = fieldsetToggleButtonStyles;
  protected readonly contentInnerClasses = fieldsetContentInnerStyles;
  protected readonly contentBodyClasses = fieldsetContentBodyStyles;

  protected readonly contentWrapperClasses = computed(() =>
    fieldsetContentWrapperStyles({ expanded: this.expanded() }),
  );
  protected readonly chevronClasses = computed(() => fieldsetChevronStyles({ expanded: this.expanded() }));

  protected toggle(): void {
    this.collapsed.update((value) => !value);
  }
}
