import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoBreadcrumb } from './breadcrumb';
import { DynamoBreadcrumbHarness } from './breadcrumb.harness';
import type { DynamoBreadcrumbItem } from './breadcrumb.types';

const ITEMS: DynamoBreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Archived' },
  { label: 'Products', href: '/products' },
  { label: 'Keyboard' },
];

describe('DynamoBreadcrumb', () => {
  describe('creation', () => {
    it('renders one item per entry, with a separator between all but the last', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      expect(within(container).getAllByRole('listitem')).toHaveLength(4);
      // 3 separators for 4 items.
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        3,
      );
    });
  });

  describe('default behavior', () => {
    it('labels the nav "Breadcrumb" when ariaLabel is not set', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      expect(
        within(container).getByRole('navigation').getAttribute('aria-label'),
      ).toBe('Breadcrumb');
    });
  });

  describe('input properties', () => {
    it('renders a middle item with an href as a real link', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      const link = within(container).getByRole('link', { name: 'Home' });
      expect(link.getAttribute('href')).toBe('/');
    });

    it('renders a middle item without an href as plain, non-linked text', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      expect(container.textContent).toContain('Archived');
      expect(
        within(container).queryByRole('link', { name: 'Archived' }),
      ).toBeNull();
    });

    it('renders the last item as aria-current="page" plain text even when it has an href', () => {
      const itemsWithHrefOnLast: DynamoBreadcrumbItem[] = [
        { label: 'Home', href: '/' },
        { label: 'Current', href: '/current' },
      ];
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: itemsWithHrefOnLast },
      });

      const current = container.querySelector('[aria-current="page"]');
      expect(current?.textContent?.trim()).toBe('Current');
      expect(current?.tagName).toBe('SPAN');
      expect(
        within(container).queryByRole('link', { name: 'Current' }),
      ).toBeNull();
    });

    it('reflects a custom ariaLabel onto the nav', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS, ariaLabel: 'Path' },
      });

      expect(
        within(container).getByRole('navigation').getAttribute('aria-label'),
      ).toBe('Path');
    });
  });

  describe('accessibility', () => {
    it('has exactly one aria-current="page" element', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      expect(
        container.querySelectorAll('[aria-current="page"]'),
      ).toHaveLength(1);
    });

    it('has no axe violations', async () => {
      const { fixture } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('harness', () => {
    it('supports interaction through the DynamoBreadcrumbHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: ITEMS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoBreadcrumbHarness,
      );

      expect(await harness.getItemLabels()).toEqual([
        'Home',
        'Archived',
        'Products',
        'Keyboard',
      ]);
      expect(await harness.getCurrentLabel()).toBe('Keyboard');
      expect(await harness.getHref(0)).toBe('/');
      expect(await harness.getHref(1)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('renders a single-item breadcrumb with no separator, treated as current', () => {
      const { container } = renderDynamoComponent(DynamoBreadcrumb, {
        inputs: { items: [{ label: 'Home' }] },
      });

      expect(within(container).getAllByRole('listitem')).toHaveLength(1);
      expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(
        0,
      );
      expect(
        container.querySelector('[aria-current="page"]')?.textContent?.trim(),
      ).toBe('Home');
    });

    it('renders an empty items array without throwing', () => {
      expect(() =>
        renderDynamoComponent(DynamoBreadcrumb, { inputs: { items: [] } }),
      ).not.toThrow();
    });
  });
});
