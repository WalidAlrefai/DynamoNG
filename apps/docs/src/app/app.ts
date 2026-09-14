import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamoDrawer } from '@dynamong/drawer';
import {
  COMPONENT_REGISTRY,
  DocComponentEntry,
  filterComponentRegistry,
} from './component-registry';

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

const THEME_STORAGE_KEY = 'dg-docs-theme';

/** Reads the persisted theme preference, falling back to the OS preference — guarded because a privacy-mode browser can throw on localStorage access. */
function readStoredThemePreference(): boolean {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') {
      return true;
    }
    if (stored === 'light') {
      return false;
    }
  } catch {
    /* localStorage unavailable (privacy mode, etc.) — fall through to OS preference. */
  }
  // Not implemented in jsdom (this codebase's test environment) — guarded
  // rather than assumed, same defensiveness as the ResizeObserver guard in
  // DynamoSelect's listbox-base.component.ts.
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function persistThemePreference(dark: boolean): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* Nothing to do if storage is unavailable — the toggle still works for this page load. */
  }
}

@Component({
  selector: 'docs-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    DynamoDrawer,
    NgTemplateOutlet,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly searchQuery = signal('');
  protected readonly mobileNavOpen = signal(false);
  protected readonly darkMode = signal(readStoredThemePreference());

  protected readonly groupedComponents = computed(() => {
    const filtered = filterComponentRegistry(
      COMPONENT_REGISTRY,
      this.searchQuery(),
    );
    return CATEGORY_ORDER.map((category) => ({
      category,
      entries: filtered.filter((entry) => entry.category === category),
    })).filter((group) => group.entries.length > 0);
  });

  protected readonly hasNoResults = computed(
    () =>
      this.searchQuery().trim().length > 0 &&
      this.groupedComponents().length === 0,
  );

  constructor() {
    document.documentElement.classList.toggle('dark', this.darkMode());
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected toggleDarkMode(): void {
    const next = !this.darkMode();
    this.darkMode.set(next);
    document.documentElement.classList.toggle('dark', next);
    persistThemePreference(next);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }
}
