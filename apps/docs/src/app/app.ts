import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { COMPONENT_REGISTRY, DocComponentEntry } from './component-registry';

const CATEGORY_ORDER: DocComponentEntry['category'][] = [
  'Form',
  'Button',
  'Data',
  'Panel',
  'Overlay',
  'Menu',
  'Messages',
  'Media',
  'Misc',
  'Directives',
];

@Component({
  selector: 'docs-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  // Static registry data — grouped once, not a signal/computed(); the list
  // never changes at runtime. The trailing filter guards against a category
  // temporarily having zero members (nothing renders an empty group).
  protected readonly groupedComponents = CATEGORY_ORDER.map((category) => ({
    category,
    entries: COMPONENT_REGISTRY.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);
}
