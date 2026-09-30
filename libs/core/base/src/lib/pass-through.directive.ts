import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import type { DynamoPassThroughAttrs } from '@dynamong/core/api';

/**
 * Applies arbitrary non-`class` attributes from a `DynamoPassThrough` part's config onto this
 * element — the general-purpose half of DynamoNG's `pt` escape hatch. `class` is not handled here;
 * each component merges `ptFor(part).class` into its own `cn(...)`-computed classes instead, so this
 * directive's imperative attribute writes never fight with Angular's own `[class]="classes()"`
 * binding (which overwrites the whole class string whenever that computed's memoized value changes).
 */
@Directive({ selector: '[dgPt]', standalone: true })
export class DynamoPassThroughDirective {
  readonly dgPt = input<DynamoPassThroughAttrs | undefined>(undefined);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private appliedKeys = new Set<string>();

  constructor() {
    effect(() => {
      const attrs = this.dgPt();
      for (const key of this.appliedKeys) {
        this.renderer.removeAttribute(this.el.nativeElement, key);
      }
      this.appliedKeys.clear();
      if (!attrs) return;
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'class' || value === null || value === undefined) continue;
        this.renderer.setAttribute(this.el.nativeElement, key, String(value));
        this.appliedKeys.add(key);
      }
    });
  }
}
