import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

export interface DocExampleRef {
  /** Anchor id — must match a `docs-example`'s `exampleId` on the page. */
  id: string;
  /** Label shown in the right-hand on-page nav. */
  title: string;
}

/** Nearest scrollable ancestor of `el`, or `window` if none. */
function scrollParent(el: HTMLElement): HTMLElement | Window {
  let node = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return window;
}

/**
 * Page frame for a component doc page built from titled examples (replaces
 * `DocPageShell` on migrated pages). Renders the page header, projects the
 * `docs-example` blocks in the main column, projects an `[api]` block below
 * them, and builds a sticky right-hand "On this page" nav from `examples`
 * that scroll-spies the section currently at the top of the viewport.
 */
@Component({
  selector: 'docs-examples-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_180px]">
      <article class="min-w-0 space-y-10">
        <header>
          <h1 class="text-2xl font-bold text-text-primary">{{ name() }}</h1>
          <p class="mt-1 text-text-muted">{{ description() }}</p>
        </header>

        <ng-content />

        <section class="space-y-3">
          <h2
            class="text-sm font-semibold uppercase tracking-wide text-text-muted"
          >
            API
          </h2>
          <ng-content select="[api]" />
        </section>
      </article>

      <nav class="hidden lg:block">
        <div class="sticky top-8 space-y-1">
          <p
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted"
          >
            On this page
          </p>
          @for (ex of examples(); track ex.id) {
            <a
              [href]="'#' + ex.id"
              (click)="jump(ex.id, $event)"
              class="block rounded px-2 py-1 text-sm"
              [class]="
                active() === ex.id
                  ? 'bg-surface-100 font-medium text-primary'
                  : 'text-text-muted hover:text-text-primary'
              "
            >
              {{ ex.title }}
            </a>
          }
        </div>
      </nav>
    </div>
  `,
})
export class DocExamplesLayout {
  readonly name = input.required<string>();
  readonly description = input.required<string>();
  readonly examples = input.required<DocExampleRef[]>();

  protected readonly active = signal('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof window === 'undefined') return;

      const target = scrollParent(this.host.nativeElement);

      const recompute = () => {
        // The last section whose top has crossed above the offset line wins;
        // fall back to the first so something is always highlighted.
        let current = this.examples()[0]?.id ?? '';
        for (const ex of this.examples()) {
          const el = document.getElementById(ex.id);
          if (el && el.getBoundingClientRect().top <= 120) current = ex.id;
        }
        this.active.set(current);
      };
      // Time-based throttle rather than requestAnimationFrame: rAF callbacks
      // are paused for a backgrounded tab, and the on-page nav should still
      // track a programmatic scroll there.
      let last = 0;
      const onScroll = () => {
        const now = Date.now();
        if (now - last < 100) return;
        last = now;
        recompute();
      };

      // Scrolls to and highlights the section named by the current URL hash,
      // if any — lets a shared/bookmarked link (`.../button#link`) land on
      // the right section on load, and lets Back/Forward retrace previously
      // visited sections (see the `popstate` listener below). Returns
      // whether a matching section was found, so the caller can fall back to
      // the scroll-position-based `recompute()` when there's no hash.
      const scrollToHash = (): boolean => {
        const id = window.location.hash.slice(1);
        const el = id ? document.getElementById(id) : null;
        if (!el) return false;
        el.scrollIntoView({ block: 'start' });
        this.active.set(id);
        return true;
      };

      target.addEventListener('scroll', onScroll, { passive: true });
      const onPopState = () => {
        if (!scrollToHash()) recompute();
      };
      window.addEventListener('popstate', onPopState);

      if (!scrollToHash()) recompute();

      destroyRef.onDestroy(() => {
        target.removeEventListener('scroll', onScroll);
        window.removeEventListener('popstate', onPopState);
      });
    });
  }

  protected jump(id: string, event: Event): void {
    event.preventDefault();
    // Plain `scrollIntoView()` (no `behavior`) so it honours CSS
    // `scroll-behavior` and degrades to an instant jump where smooth
    // scrolling isn't supported — an explicit `behavior: 'smooth'` silently
    // no-ops in some headless/automation Chrome builds when the scroller is
    // a nested element.
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
    this.active.set(id);
    // Updates the address bar and creates a navigable history entry (so
    // Back/Forward retraces visited sections), without a full Router
    // navigation — the app uses the default `PathLocationStrategy` with no
    // hash-routing/anchor-scrolling feature enabled, so a raw hash push is
    // invisible to Angular Router and can't conflict with route matching.
    //
    // The URL is built explicitly from the current pathname/search rather
    // than passed as a bare `#${id}` fragment: this app's `<base href="/">`
    // makes `pushState`'s relative-URL argument resolve against the *base*
    // URI, not the current path (unlike a plain `<a href="#x">` click, which
    // gets special same-document fragment-navigation handling per the HTML
    // spec that ignores `<base>`) — a bare fragment would silently collapse
    // the address bar to the site root.
    history.pushState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${id}`,
    );
  }
}
