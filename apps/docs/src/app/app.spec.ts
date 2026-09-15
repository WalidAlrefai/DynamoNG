import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideDynamoNG } from '@dynamong/core/config';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideDynamoNG(),
        provideRouter(appRoutes),
      ],
    }).compileComponents();
  });

  it('renders the sidebar nav with a link per registered component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Scoped to the persistent desktop nav (data-testid) rather than `nav a`
    // broadly — the mobile drawer projects a second copy of the same links,
    // which would otherwise double-count once it's ever opened.
    const nav = compiled.querySelector('[data-testid="dg-docs-primary-nav"]');
    const links = nav?.querySelectorAll('a') ?? [];
    // 1 wordmark link + 3 quick-nav links (Components, Templates, Foundations) + 83 component links.
    expect(links).toHaveLength(87);
  });

  it('filters the nav down to components matching the search query', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Search components"]',
    ) as HTMLInputElement;

    input.value = 'button';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector(
      '[data-testid="dg-docs-primary-nav"]',
    ) as HTMLElement;
    const names = Array.from(nav.querySelectorAll('ul a')).map((a) =>
      a.textContent?.trim(),
    );
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name?.toLowerCase().includes('button'))).toBe(
      true,
    );
  });

  it('shows a no-results message when the search query matches nothing', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Search components"]',
    ) as HTMLInputElement;

    input.value = 'zzz-not-a-component';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No components match');
  });

  it('toggles the dark class on the document element', () => {
    document.documentElement.classList.remove('dark');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const toggle = fixture.nativeElement.querySelector(
      'button[aria-label="Switch to dark theme"]',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    document.documentElement.classList.remove('dark');
  });

  it('opens the mobile nav drawer from the hamburger button', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const hamburger = fixture.nativeElement.querySelector(
      'button[aria-label="Open navigation"]',
    ) as HTMLButtonElement;

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    hamburger.click();
    fixture.detectChanges();
    // DynamoDrawer attaches its overlay from an effect() reacting to `open`
    // — under zoneless TestBed, detectChanges() alone doesn't guarantee
    // that effect has flushed yet (same reason renderDynamoComponent's
    // setInputs() calls this too).
    TestBed.flushEffects();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
