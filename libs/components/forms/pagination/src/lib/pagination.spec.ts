import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoPagination } from './pagination';
import { DynamoPaginationHarness } from './pagination.harness';

// The nested `<dg-select>` (rows-per-page dropdown) portals its listbox into
// a `.cdk-overlay-container` appended near document.body — same pattern as
// DynamoSelect's own spec.
function getListbox(): HTMLElement | null {
  return document.body.querySelector('[role="listbox"]');
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

describe('DynamoPagination', () => {
  describe('creation', () => {
    it('renders a nav landmark with the default aria-label', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100 },
      });

      expect(
        within(container).getByRole('navigation', { name: 'Pagination' }),
      ).toBeTruthy();
    });

    it('renders Previous/Next buttons and numbered page buttons', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 30 },
      });

      expect(
        within(container).getByRole('button', { name: 'Previous page' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Next page' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Page 1' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Page 3' }),
      ).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to page 1, pageSize 10, and a visible rows-per-page selector', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100 },
      });

      expect(componentInstance.page()).toBe(1);
      expect(componentInstance.pageSize()).toBe(10);
      expect(componentInstance.pageSizeOptions()).toEqual([10, 25, 50, 100]);
      expect(componentInstance.showPageSizeSelector()).toBe(true);
    });

    it('shows a "Showing X-Y of Z" summary for the current page', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 45 },
      });

      expect(
        container.querySelector('[aria-live="polite"]')?.textContent?.trim(),
      ).toBe('Showing 1-10 of 45');
    });
  });

  describe('input properties', () => {
    it('derives pageCount from totalItems and pageSize, exposed via the last page button', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 25, pageSize: 10 },
      });

      // ceil(25 / 10) = 3
      expect(
        within(container).getByRole('button', { name: 'Page 3' }),
      ).toBeTruthy();
      expect(
        within(container).queryByRole('button', { name: 'Page 4' }),
      ).toBeNull();
    });

    it('respects a caller-supplied pageSizeOptions list', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, pageSizeOptions: [5, 20] },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const listbox = getListbox();
      expect(listbox?.textContent).toContain('5 / page');
      expect(listbox?.textContent).toContain('20 / page');
      expect(listbox?.textContent).not.toContain('10 / page');
    });
  });

  describe('output events', () => {
    it('increments the page model when Next is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPagination,
        {
          inputs: { totalItems: 100 },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Next page' }),
      );

      expect(componentInstance.page()).toBe(2);
    });

    it('decrements the page model when Previous is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPagination,
        {
          inputs: { totalItems: 100, page: 2 },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Previous page' }),
      );

      expect(componentInstance.page()).toBe(1);
    });

    it('jumps directly to the clicked page number', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoPagination,
        {
          inputs: { totalItems: 100 },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Page 4' }),
      );

      expect(componentInstance.page()).toBe(4);
    });

    it('updates the pageSize model and resets page to 1 when a rows-per-page option is chosen', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        DynamoPagination,
        {
          inputs: { totalItems: 100, page: 3 },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const option = Array.from(
        getListbox()?.querySelectorAll('[role="option"]') ?? [],
      ).find((el) => el.textContent?.trim() === '25 / page');
      await userEvent.click(option as HTMLElement);
      await settle(fixture);

      expect(componentInstance.pageSize()).toBe(25);
      expect(componentInstance.page()).toBe(1);
    });
  });

  describe('user interactions', () => {
    it('supports Next/Previous/page-jump through the DynamoPaginationHarness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoPagination,
        {
          inputs: { totalItems: 100 },
        },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoPaginationHarness,
      );

      await harness.goToNextPage();
      expect(componentInstance.page()).toBe(2);

      // Page count for 100 items @ 10/page is 10, so with maxVisiblePages'
      // default of 5, the rendered window from page 2 is [1, 2, 3, 4, …, 10]
      // — page 4 is the furthest page still directly clickable (not
      // collapsed behind the ellipsis).
      await harness.clickPage(4);
      expect(componentInstance.page()).toBe(4);

      await harness.goToPreviousPage();
      expect(componentInstance.page()).toBe(3);

      expect(await harness.getCurrentPage()).toBe(3);
      expect(await harness.getSummaryText()).toBe('Showing 21-30 of 100');
    });

    it('exposes disabled-state and page-size-selector state through the DynamoPaginationHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 300, pageSize: 10, page: 15 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoPaginationHarness,
      );

      expect(await harness.isPreviousPageDisabled()).toBe(false);
      expect(await harness.isNextPageDisabled()).toBe(false);
      expect(await harness.hasPageSizeSelector()).toBe(true);
      expect(await harness.getPageSizeText()).toBe('10 / page');
      expect(await harness.getVisiblePageLabels()).toEqual([
        '1',
        '…',
        '14',
        '15',
        '16',
        '…',
        '30',
      ]);

      await harness.openPageSizeSelector();
      await settle(fixture);
      expect(getListbox()).not.toBeNull();
    });

    it('throws from openPageSizeSelector when the selector is hidden', async () => {
      const { fixture } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, showPageSizeSelector: false },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoPaginationHarness,
      );

      await expect(harness.openPageSizeSelector()).rejects.toThrow(
        'DynamoPagination has no page-size selector',
      );
    });
  });

  describe('conditional rendering', () => {
    it('does not render the rows-per-page selector when showPageSizeSelector is false', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, showPageSizeSelector: false },
      });

      expect(within(container).queryByRole('combobox')).toBeNull();
    });

    it('collapses to an ellipsis once the page count exceeds maxVisiblePages', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 300, pageSize: 10, page: 15 },
      });

      expect(
        container
          .querySelector('span[aria-hidden="true"]')
          ?.textContent?.trim(),
      ).toBe('…');
    });

    it('renders every page number, no ellipsis, when the page count fits within maxVisiblePages', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 30, pageSize: 10 },
      });

      expect(
        within(container).getByRole('button', { name: 'Page 3' }),
      ).toBeTruthy();
      expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('template behavior', () => {
    it('marks only the current page button with aria-current="page"', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100 },
      });

      const current = () =>
        Array.from(container.querySelectorAll('button')).filter(
          (button) => button.getAttribute('aria-current') === 'page',
        );
      expect(current()).toHaveLength(1);
      expect(current()[0]?.textContent?.trim()).toBe('1');

      await userEvent.click(
        within(container).getByRole('button', { name: 'Page 3' }),
      );
      fixture.detectChanges();

      expect(current()).toHaveLength(1);
      expect(current()[0]?.textContent?.trim()).toBe('3');
    });

    it('reflects the size input via distinct classes on the root element', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, size: 'sm' },
      });
      const smClasses = container.querySelector('nav')?.className ?? '';

      setInputs({ size: 'lg' });
      const lgClasses = container.querySelector('nav')?.className ?? '';

      expect(smClasses).not.toBe(lgClasses);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100 },
      });
      await expectNoA11yViolations(container);
    });

    it('has no axe violations with an ellipsis-truncated page range', async () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 500, page: 25 },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('state changes', () => {
    it('disables Previous on the first page and Next on the last page', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 30, pageSize: 10, page: 1 },
      });

      expect(
        (
          within(container).getByRole('button', {
            name: 'Previous page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Next page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false);

      setInputs({ page: 3 });

      expect(
        (
          within(container).getByRole('button', {
            name: 'Next page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('disables every control when disabled is true', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, page: 2, disabled: true },
      });

      expect(
        (
          within(container).getByRole('button', {
            name: 'Previous page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Next page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
      expect(
        (
          within(container).getByRole('button', {
            name: 'Page 1',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders a single, disabled page for zero total items', () => {
      const { container } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 0 },
      });

      expect(
        container.querySelector('[aria-live="polite"]')?.textContent?.trim(),
      ).toBe('No results');
      expect(
        within(container).getByRole('button', { name: 'Page 1' }),
      ).toBeTruthy();
      expect(
        within(container).queryByRole('button', { name: 'Page 2' }),
      ).toBeNull();
      expect(
        (
          within(container).getByRole('button', {
            name: 'Next page',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });

    it('clamps the rendered current page down when totalItems shrinks out from under an out-of-range page', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPagination, {
        inputs: { totalItems: 100, page: 10 },
      });

      setInputs({ totalItems: 15 });

      const current = Array.from(container.querySelectorAll('button')).find(
        (button) => button.getAttribute('aria-current') === 'page',
      );
      expect(current?.textContent?.trim()).toBe('2');
    });

    it('handles a very large totalItems without throwing', () => {
      expect(() =>
        renderDynamoComponent(DynamoPagination, {
          inputs: { totalItems: 1_000_000 },
        }),
      ).not.toThrow();
    });
  });
});
