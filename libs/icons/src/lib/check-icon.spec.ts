import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDynamoNG } from '@dynamong/core/config';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { DynamoCheckIcon } from './check-icon';

// This lib is tagged `type:core`, which the module-boundary rules (see
// eslint.config.mjs) deliberately keep dependency-free of `type:testing`
// (`@dynamong/testing` is meant for `type:component` specs). So this renders
// via plain TestBed directly instead of `renderDynamoComponent`, and checks
// accessibility via `axe-core` directly instead of `expectNoA11yViolations`.

const attached: HTMLElement[] = [];

afterEach(() => {
  for (const el of attached.splice(0)) {
    el.remove();
  }
});

function render(inputs: { size?: 'sm' | 'md' | 'lg' } = {}) {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideDynamoNG()],
  });

  const fixture = TestBed.createComponent(DynamoCheckIcon);
  const container = fixture.nativeElement as HTMLElement;
  document.body.appendChild(container);
  attached.push(container);

  if (inputs.size) {
    fixture.componentRef.setInput('size', inputs.size);
  }
  fixture.detectChanges();

  return { fixture, container };
}

describe('DynamoCheckIcon', () => {
  describe('creation', () => {
    it('renders a real svg with a path', () => {
      const { container } = render();

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.querySelector('path')).not.toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to the md size (16px)', () => {
      const { container } = render();

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('16');
      expect(svg?.getAttribute('height')).toBe('16');
    });
  });

  describe('input properties', () => {
    it('reflects every documented size onto width/height', () => {
      const { fixture, container } = render();
      const svg = container.querySelector('svg');

      const expected: Record<'sm' | 'md' | 'lg', string> = { sm: '14', md: '16', lg: '20' };
      for (const [size, px] of Object.entries(expected) as ['sm' | 'md' | 'lg', string][]) {
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        expect(svg?.getAttribute('width')).toBe(px);
        expect(svg?.getAttribute('height')).toBe(px);
      }
    });
  });

  describe('template behavior', () => {
    it('marks the svg as aria-hidden (decorative icon)', () => {
      const { container } = render();

      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations (decorative, aria-hidden)', async () => {
      const { container } = render();

      const results = await axe.run(container);
      expect(results.violations).toHaveLength(0);
    });
  });
});
