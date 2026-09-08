import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  inputGroupPrefixStyles,
  inputGroupSuffixStyles,
  inputGroupWrapperStyles,
} from './input-group.styles';
import type { DynamoInputGroupPart } from './input-group.types';

/**
 * A bordered wrapper adding `[prefix]`/`[suffix]` content alongside any
 * projected input — an icon, a `$` sign, a unit label, or a button.
 *
 * Generalizes the wrapper-owns-the-border shape Password/InputNumber/
 * ColorPicker each independently arrived at (a bordered flex wrapper with
 * `focus-within:` chrome, native input inside left transparent) using
 * Toolbar's named-slot content-projection idiom instead of hard-coded
 * internal markup, since this wrapper must work with *any* projected input.
 *
 * Because every DynamoNG input already renders its own border directly
 * (e.g. `input-text.html`'s `<input>` carries its own `cva()` border
 * classes), a `<dg-input-text>` placed inside needs `[unstyled]="true"` so
 * only this group's border shows — documented on the doc page, not
 * something this component can enforce for you.
 *
 * Deliberately has no `disabled` input of its own: disabling is the
 * projected input's job, and a wrapper-level visual dim would create a
 * "set it in two places" footgun. A known, deliberate v1 scope cut.
 */
@Component({
  selector: 'dg-input-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-group.html',
})
export class DynamoInputGroup extends DynamoBaseComponent<DynamoInputGroupPart> {
  readonly size = input<DynamoSize>('md');
  readonly invalid = input(false);

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          inputGroupWrapperStyles({ size: this.size(), invalid: this.invalid() }),
          this.styleClass(),
        ),
  );
  protected readonly prefixClasses = inputGroupPrefixStyles;
  protected readonly suffixClasses = inputGroupSuffixStyles;
}
