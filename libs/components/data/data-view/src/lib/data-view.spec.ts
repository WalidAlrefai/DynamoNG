import { Component, signal, viewChild } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoDataView } from './data-view';
import { DynamoDataViewHarness } from './data-view.harness';

interface Product {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `Product ${String(i + 1).padStart(2, '0')}`,
  price: (i + 1) * 10,
}));

@Component({
  selector: 'dg-data-view-test-host',
  standalone: true,
  imports: [DynamoDataView],
  template: `
    <dg-data-view
      [value]="products()"
      [(layout)]="layout"
      [(page)]="page"
      [(rows)]="rows"
      [sortField]="sortField()"
      [sortOrder]="sortOrder()"
      [paginator]="paginator()"
      [paginatorPosition]="paginatorPosition()"
      dataKey="id"
    >
      <ng-template let-product let-i="index">
        <div class="p-3" [attr.data-testid]="'row-' + product.id">
          {{ i }} — {{ product.name }} — {{ product.price }}
        </div>
      </ng-template>
    </dg-data-view>
  `,
})
class DataViewTestHostComponent {
  readonly products = signal<Product[]>(PRODUCTS);
  readonly layout = signal<'list' | 'grid'>('list');
  readonly page = signal(1);
  readonly rows = signal(10);
  readonly sortField = signal<keyof Product | null>(null);
  readonly sortOrder = signal<1 | -1>(1);
  readonly paginator = signal(true);
  readonly paginatorPosition = signal<'top' | 'bottom' | 'both'>('bottom');
}

function getRenderedItems(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll('[data-testid="DynamoDataView-content"] > *'),
  );
}

describe('DynamoDataView', () => {
  describe('creation', () => {
    it('renders the host element with a content region', () => {
      const { container } = renderDynamoComponent(DataViewTestHostComponent);

      expect(
        container.querySelector('[data-testid="DynamoDataView"]'),
      ).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoDataView-content"]'),
      ).toBeTruthy();
    });
  });

  describe('paging', () => {
    it('renders only the first `rows` items on page 1', () => {
      const { container } = renderDynamoComponent(DataViewTestHostComponent);

      expect(getRenderedItems(container)).toHaveLength(10);
      expect(container.textContent).toContain('Product 01');
      expect(container.textContent).not.toContain('Product 11');
    });

    it('reslices when the page changes', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      componentInstance.page.set(3);
      fixture.detectChanges();

      // page 3 of 23 items / 10 per page → 3 items (21..23)
      expect(getRenderedItems(container)).toHaveLength(3);
      expect(container.textContent).toContain('Product 21');
      expect(container.textContent).toContain('Product 23');
    });

    it('reslices when rows-per-page changes', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      componentInstance.rows.set(25);
      fixture.detectChanges();

      expect(getRenderedItems(container)).toHaveLength(23);
    });

    it('renders every item when paginator is disabled', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      componentInstance.paginator.set(false);
      fixture.detectChanges();

      expect(getRenderedItems(container)).toHaveLength(23);
      expect(container.querySelector('dg-pagination')).toBeNull();
    });
  });

  describe('layout', () => {
    it('applies grid classes when layout is "grid" and list classes otherwise', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      const content = container.querySelector(
        '[data-testid="DynamoDataView-content"]',
      ) as HTMLElement;

      expect(content.getAttribute('data-layout')).toBe('list');
      expect(content.className).toContain('divide-y');

      componentInstance.layout.set('grid');
      fixture.detectChanges();

      expect(content.getAttribute('data-layout')).toBe('grid');
      expect(content.className).toContain('grid-cols-1');
    });
  });

  describe('sorting', () => {
    it('sorts by the given field/order before paging', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      componentInstance.sortField.set('price');
      componentInstance.sortOrder.set(-1);
      fixture.detectChanges();

      const first = getRenderedItems(container)[0];
      expect(first?.textContent).toContain('Product 23'); // highest price first
    });
  });

  describe('empty state', () => {
    it('shows the empty message and no content region when value is empty', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      componentInstance.products.set([]);
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="DynamoDataView-content"]'),
      ).toBeNull();
      expect(
        container.querySelector('[data-testid="DynamoDataView-empty"]')
          ?.textContent,
      ).toContain('No records found');
    });
  });

  describe('user interactions', () => {
    it('paging through the embedded paginator updates the rendered slice', async () => {
      const { container, fixture } = renderDynamoComponent(
        DataViewTestHostComponent,
      );

      const next = within(container).getByRole('button', { name: /next/i });
      await userEvent.click(next);
      fixture.detectChanges();

      expect(container.textContent).toContain('Product 11');
      expect(container.textContent).not.toContain('Product 01');
    });
  });

  describe('harness', () => {
    it('reports the rendered item count, layout, and empty state', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDataViewHarness,
      );

      expect(await harness.getRenderedItemCount()).toBe(10);
      expect(await harness.getLayout()).toBe('list');
      expect(await harness.isEmpty()).toBe(false);

      componentInstance.layout.set('grid');
      fixture.detectChanges();
      expect(await harness.getLayout()).toBe('grid');

      componentInstance.products.set([]);
      fixture.detectChanges();
      expect(await harness.isEmpty()).toBe(true);
      expect(await harness.getRenderedItemCount()).toBe(0);
      expect(await harness.getLayout()).toBeNull();
    });
  });

  describe('paginatorPosition', () => {
    it('renders the paginator only at the bottom by default', () => {
      const { container } = renderDynamoComponent(DataViewTestHostComponent);
      const content = container.querySelector(
        '[data-testid="DynamoDataView-content"]',
      );
      const paginators = container.querySelectorAll('dg-pagination');

      expect(paginators).toHaveLength(1);
      expect(
        content!.compareDocumentPosition(paginators[0]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('renders the paginator only at the top when set to top', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      componentInstance.paginatorPosition.set('top');
      fixture.detectChanges();
      const content = container.querySelector(
        '[data-testid="DynamoDataView-content"]',
      );
      const paginators = container.querySelectorAll('dg-pagination');

      expect(paginators).toHaveLength(1);
      expect(
        content!.compareDocumentPosition(paginators[0]!) &
          Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();
    });

    it('renders the paginator at both top and bottom when set to both', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      componentInstance.paginatorPosition.set('both');
      fixture.detectChanges();

      expect(container.querySelectorAll('dg-pagination')).toHaveLength(2);
    });
  });

  describe('trackBy', () => {
    @Component({
      selector: 'dg-data-view-trackby-test-host',
      standalone: true,
      imports: [DynamoDataView],
      template: `
        <dg-data-view
          #dataView
          [value]="products"
          dataKey="id"
          [trackBy]="trackBy()"
        >
          <ng-template let-product let-i="index">
            <div>{{ i }} — {{ product.name }}</div>
          </ng-template>
        </dg-data-view>
      `,
    })
    class TrackByTestHostComponent {
      readonly products = PRODUCTS;
      readonly trackBy = signal<
        ((item: Product, index: number) => unknown) | undefined
      >(undefined);
      readonly dataView = viewChild.required(DynamoDataView);
    }

    it('takes priority over dataKey when both are set', () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        TrackByTestHostComponent,
      );
      componentInstance.trackBy.set(() => 'custom-key');
      fixture.detectChanges();

      expect(componentInstance.dataView()['trackItem'](PRODUCTS[0]!, 0)).toBe(
        'custom-key',
      );
    });

    it('falls back to dataKey when trackBy is unset', () => {
      const { componentInstance } = renderDynamoComponent(
        TrackByTestHostComponent,
      );

      expect(componentInstance.dataView()['trackItem'](PRODUCTS[0]!, 0)).toBe(
        PRODUCTS[0]!.id,
      );
    });
  });

  describe('lazy mode', () => {
    @Component({
      selector: 'dg-data-view-lazy-test-host',
      standalone: true,
      imports: [DynamoDataView],
      template: `
        <dg-data-view
          [value]="pageItems()"
          [(page)]="page"
          [(rows)]="rows"
          [(sortField)]="sortField"
          [(sortOrder)]="sortOrder"
          [lazy]="true"
          [totalRecords]="23"
          (lazyLoad)="onLazyLoad($event)"
        >
          <ng-template let-product let-i="index">
            <div [attr.data-testid]="'row-' + product.id">
              {{ i }} — {{ product.name }}
            </div>
          </ng-template>
        </dg-data-view>
      `,
    })
    class LazyTestHostComponent {
      readonly pageItems = signal<Product[]>(PRODUCTS.slice(0, 10));
      readonly page = signal(1);
      readonly rows = signal(10);
      readonly sortField = signal<keyof Product | null>(null);
      readonly sortOrder = signal<1 | -1>(1);
      readonly events: unknown[] = [];

      onLazyLoad(event: unknown): void {
        this.events.push(event);
      }
    }

    it('renders value as-is without re-sorting or re-slicing', () => {
      const { container } = renderDynamoComponent(LazyTestHostComponent);

      expect(getRenderedItems(container)).toHaveLength(10);
      expect(container.textContent).toContain('Product 01');
    });

    it('uses totalRecords, not value.length, for the paginator', () => {
      const { fixture } = renderDynamoComponent(LazyTestHostComponent);

      const summary = fixture.nativeElement.querySelector(
        '[aria-live="polite"]',
      ) as HTMLElement | null;
      expect(summary?.textContent).toContain('23');
    });

    it('emits lazyLoad on page change, but not on the initial render', () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        LazyTestHostComponent,
      );
      expect(componentInstance.events).toHaveLength(0);

      componentInstance.page.set(2);
      fixture.detectChanges();

      expect(componentInstance.events).toEqual([
        { first: 10, rows: 10, sortField: null, sortOrder: 1 },
      ]);
    });

    it('emits lazyLoad on sort change', () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        LazyTestHostComponent,
      );

      componentInstance.sortField.set('price');
      componentInstance.sortOrder.set(-1);
      fixture.detectChanges();

      expect(componentInstance.events).toEqual([
        { first: 0, rows: 10, sortField: 'price', sortOrder: -1 },
      ]);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in list layout', async () => {
      const { container } = renderDynamoComponent(DataViewTestHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in grid layout', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      componentInstance.layout.set('grid');
      fixture.detectChanges();
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in the empty state', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DataViewTestHostComponent,
      );
      componentInstance.products.set([]);
      fixture.detectChanges();
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
