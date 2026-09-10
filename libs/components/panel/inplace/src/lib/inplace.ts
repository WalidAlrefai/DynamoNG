import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  viewChild,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  inplaceCloseButtonStyles,
  inplaceDisplayStyles,
  inplaceEditorBodyStyles,
  inplaceEditorStyles,
  inplaceRootStyles,
} from './inplace.styles';
import type { DynamoInplacePart } from './inplace.types';

const FOCUSABLE_SELECTOR =
  'input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])';

/**
 * Click-to-edit: shows a compact `[display]` region that swaps to an
 * `[editor]` region on click, with an optional close affordance and Escape
 * to dismiss. Focus moves into the editor on activate and back to the
 * display trigger on deactivate.
 */
@Component({
  selector: 'dg-inplace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inplace.html',
  host: {
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class DynamoInplace extends DynamoBaseComponent<DynamoInplacePart> {
  /** Two-way bindable: `false` = display mode, `true` = editor mode. */
  readonly active = model(false);
  readonly disabled = input(false);
  /** Show a "×" button in editor mode that returns to display. */
  readonly closable = input(true);

  private readonly displayEl =
    viewChild<ElementRef<HTMLButtonElement>>('displayEl');
  private readonly editorEl = viewChild<ElementRef<HTMLElement>>('editorEl');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(inplaceRootStyles, this.styleClass()),
  );
  protected readonly displayClasses = computed(() =>
    inplaceDisplayStyles({ disabled: this.disabled() }),
  );
  protected readonly editorClasses = inplaceEditorStyles;
  protected readonly editorBodyClasses = inplaceEditorBodyStyles;
  protected readonly closeButtonClasses = inplaceCloseButtonStyles;

  protected activate(): void {
    if (this.disabled() || this.active()) return;
    this.active.set(true);
    // Focus the editor once the swap has rendered — a plain macrotask flush,
    // the same technique the overlay components use for post-render focus.
    setTimeout(() => {
      const region = this.editorEl()?.nativeElement;
      const target =
        region?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? region;
      target?.focus();
    });
  }

  protected deactivate(): void {
    if (!this.active()) return;
    this.active.set(false);
    setTimeout(() => this.displayEl()?.nativeElement.focus());
  }

  protected onEscape(event: Event): void {
    if (!this.active()) return;
    event.preventDefault();
    this.deactivate();
  }
}
