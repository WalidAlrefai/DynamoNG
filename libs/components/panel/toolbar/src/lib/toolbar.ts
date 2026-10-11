import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  Renderer2,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { getRovingTabbableElements } from '@dynamong/utils/dom';
import {
  toolbarCenterStyles,
  toolbarEndStyles,
  toolbarRootStyles,
  toolbarStartStyles,
} from './toolbar.styles';
import type { DynamoToolbarPart } from './toolbar.types';

// Native controls with their own meaningful arrow-key behavior (text
// caret movement, value stepping, native radio-group/select cycling) —
// toolbar-level roving-tabindex defers entirely to these rather than
// hijacking Left/Right/Home/End while one of them is focused.
const ARROW_KEY_OWNING_TAGS = new Set(['TEXTAREA', 'SELECT']);
const ARROW_KEY_OWNING_INPUT_TYPES = new Set([
  'text',
  'search',
  'email',
  'url',
  'tel',
  'password',
  'number',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'range',
  'radio',
]);

function ownsArrowKeys(element: Element): boolean {
  if (ARROW_KEY_OWNING_TAGS.has(element.tagName)) return true;
  if (element.tagName === 'INPUT') {
    const type = (element as HTMLInputElement).type || 'text';
    return ARROW_KEY_OWNING_INPUT_TYPES.has(type);
  }
  return false;
}

/**
 * `role="toolbar"` carries a mandatory keyboard contract — one shared tab
 * stop, Left/Right/Home/End roving among the toolbar's own children — that
 * content projection can't provide for free. This component builds that
 * contract itself over whatever's actually projected: it scans its own real
 * DOM for tabbable descendants (`getRovingTabbableElements`, queried fresh
 * on every interaction rather than cached, so content projection changes
 * can't go stale) and manages their `tabindex` imperatively, since there's
 * no `*ngFor`-owned item list to bind declaratively the way every other
 * roving-tabindex component in this library has one.
 *
 * Self-healing uses a `MutationObserver`, not an Angular lifecycle hook —
 * projected content living in a *different* component's view (e.g. a
 * wrapped `dg-button` re-evaluating its own `[attr.tabindex]` binding back
 * to `null`) doesn't reliably mark this zoneless OnPush component dirty, so
 * `ngAfterContentChecked` can't be trusted to re-fire when it should. A
 * `MutationObserver` watches the real DOM directly instead, independent of
 * whatever triggered the change.
 */
@Component({
  selector: 'dg-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './toolbar.html',
})
export class DynamoToolbar
  extends DynamoBaseComponent<DynamoToolbarPart>
  implements AfterViewInit, OnDestroy
{
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the `role="toolbar"` root. */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  private readonly renderer = inject(Renderer2);
  // The template's own root div — NOT this component's host element
  // (`<dg-toolbar>`), which would make `querySelectorAll` also see that
  // root div itself as a descendant (it carries its own `tabindex="-1"`,
  // for `interactive-supports-focus`, which would otherwise wrongly sweep
  // it into the roving candidate set).
  private readonly rootEl = viewChild<ElementRef<HTMLElement>>('rootEl');
  private mutationObserver: MutationObserver | undefined;

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(toolbarRootStyles, this.styleClass(), this.ptFor('root').class),
  );
  protected readonly startClasses = computed(() =>
    cn(toolbarStartStyles, this.ptFor('start').class),
  );
  protected readonly centerClasses = computed(() =>
    cn(toolbarCenterStyles, this.ptFor('center').class),
  );
  protected readonly endClasses = computed(() =>
    cn(toolbarEndStyles, this.ptFor('end').class),
  );

  ngAfterViewInit(): void {
    const root = this.rootEl()?.nativeElement;
    if (!root) return;
    this.syncRovingTabindex();
    this.mutationObserver = new MutationObserver(() =>
      this.syncRovingTabindex(),
    );
    this.mutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ['disabled', 'tabindex'],
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as Element;
    if (ownsArrowKeys(target)) return;

    const root = this.rootEl()?.nativeElement;
    if (!root) return;
    const items = getRovingTabbableElements(root);
    if (items.length === 0) return;
    const current = items.indexOf(target as HTMLElement);

    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = items[current === -1 ? 0 : (current + 1) % items.length];
        break;
      case 'ArrowLeft':
        next =
          items[
            current === -1
              ? items.length - 1
              : (current - 1 + items.length) % items.length
          ];
        break;
      case 'Home':
        next = items[0];
        break;
      case 'End':
        next = items[items.length - 1];
        break;
      default:
        return;
    }
    if (!next) return;

    event.preventDefault();
    this.setActive(items, next);
    next.focus();
  }

  protected onFocusIn(event: FocusEvent): void {
    const root = this.rootEl()?.nativeElement;
    if (!root) return;
    const items = getRovingTabbableElements(root);
    const target = event.target as HTMLElement;
    if (items.includes(target)) {
      this.setActive(items, target);
    }
  }

  private syncRovingTabindex(): void {
    const root = this.rootEl()?.nativeElement;
    if (!root) return;
    const items = getRovingTabbableElements(root);
    if (items.length === 0) return;
    const active =
      items.find((item) => item.getAttribute('tabindex') === '0') ?? items[0];
    this.setActive(items, active as HTMLElement);
  }

  private setActive(items: HTMLElement[], active: HTMLElement): void {
    for (const item of items) {
      const tabindex = item === active ? '0' : '-1';
      if (item.getAttribute('tabindex') !== tabindex) {
        this.renderer.setAttribute(item, 'tabindex', tabindex);
      }
    }
  }
}
