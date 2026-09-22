import type { ComponentFixture } from '@angular/core/testing';
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { fireEvent, within } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { DynamoOrderList } from './order-list';
import { DynamoOrderListHarness } from './order-list.harness';
import type { DynamoSelectOption } from './order-list.types';

// jsdom has no real `Element.scrollTo`. While `virtualScroll` is enabled,
// OrderList's `scrollActiveIntoView()` reaches the virtual-scroll
// viewport's `scrollToIndex()` (CDK's viewport calls `scrollTo`
// internally) — a minimal stub lets these tests exercise the real
// keyboard-nav-while-virtualized behavior instead of throwing, same gap
// already worked around in Picklist's/Listbox's own specs.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

// jsdom reports a zero-height viewport, so CDK's fixed-size strategy
// renders zero rows synchronously — flush a real setTimeout(0) +
// detectChanges() before asserting on virtualized content.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

const ITEMS: DynamoSelectOption<string>[] = [
  { label: 'Alpha', value: 'a' },
  { label: 'Bravo', value: 'b' },
  { label: 'Charlie', value: 'c' },
  { label: 'Delta', value: 'd' },
];

const MANY_ITEMS: DynamoSelectOption<string>[] = Array.from(
  { length: 50 },
  (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }),
);

// "e" matches One/Three but not Two — a clean way to exercise "one item
// hidden between two visible ones" without relying on substrings that
// accidentally match more/fewer items than intended.
const FILTER_ITEMS: DynamoSelectOption<string>[] = [
  { label: 'One', value: '1' },
  { label: 'Two', value: '2' },
  { label: 'Three', value: '3' },
];

const ITEMS_WITH_DISABLED: DynamoSelectOption<string>[] = [
  { label: 'Alpha', value: 'a' },
  { label: 'Bravo', value: 'b', disabled: true },
  { label: 'Charlie', value: 'c' },
];

function dispatchKey(target: HTMLElement, key: string): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
}

function getList(container: HTMLElement): HTMLElement {
  return container.querySelector('[role="listbox"]') as HTMLElement;
}

function getRowTexts(container: HTMLElement): string[] {
  return within(container)
    .getAllByRole('option')
    .map((el) => el.textContent?.trim() ?? '');
}

function dropEvent(
  previousIndex: number,
  currentIndex: number,
): CdkDragDrop<unknown> {
  const container = {};
  return {
    previousContainer: container,
    container,
    previousIndex,
    currentIndex,
  } as unknown as CdkDragDrop<unknown>;
}

describe('DynamoOrderList', () => {
  describe('creation', () => {
    it('renders one row per item, in order, with an accessible listbox name', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, listLabel: 'Steps' },
      });

      expect(
        within(container).getByRole('listbox', { name: 'Steps' }),
      ).toBeTruthy();
      expect(getRowTexts(container)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
    });
  });

  describe('reorder buttons', () => {
    it('▲/▼ move the active row and keep it active', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS } },
      );
      // activate "Charlie" (index 2)
      within(container)
        .getAllByRole('option')[2]
        ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: /move up/i })
        .click();
      fixture.detectChanges();

      expect(componentInstance.value().map((o) => o.label)).toEqual([
        'Alpha',
        'Charlie',
        'Bravo',
        'Delta',
      ]);
      expect(getRowTexts(container)[1]).toBe('Charlie');
      expect(
        within(container)
          .getAllByRole('option')[1]
          ?.getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('move-to-top / move-to-bottom jump the active row to an edge', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS } },
      );
      within(container)
        .getAllByRole('option')[1]
        ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: /move to bottom/i })
        .click();
      fixture.detectChanges();
      expect(componentInstance.value().map((o) => o.label)).toEqual([
        'Alpha',
        'Charlie',
        'Delta',
        'Bravo',
      ]);

      within(container)
        .getByRole('button', { name: /move to top/i })
        .click();
      fixture.detectChanges();
      expect(componentInstance.value()[0]?.label).toBe('Bravo');
    });

    it('buttons are disabled at the list edges and when nothing is active', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS },
      });
      expect(
        (
          within(container).getByRole('button', {
            name: /move up/i,
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(true);
    });
  });

  describe('drag & drop', () => {
    it('reorders via a same-container drop', () => {
      const { componentInstance } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS },
      });

      (
        componentInstance as unknown as {
          onDropped: (e: CdkDragDrop<unknown>) => void;
        }
      ).onDropped(dropEvent(0, 3));

      expect(componentInstance.value().map((o) => o.label)).toEqual([
        'Bravo',
        'Charlie',
        'Delta',
        'Alpha',
      ]);
    });
  });

  describe('keyboard', () => {
    it('ArrowDown/ArrowUp move the active row, skipping disabled rows', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS_WITH_DISABLED } },
      );
      const list = getList(container);

      dispatchKey(list, 'ArrowDown'); // -> Alpha (0)
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(list, 'ArrowDown'); // skips disabled Bravo -> Charlie (2)
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('Enter toggles selection only when selectable', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, selectable: true } },
      );
      const list = getList(container);

      dispatchKey(list, 'ArrowDown');
      dispatchKey(list, 'Enter');
      fixture.detectChanges();

      expect(componentInstance['selected']().has('a')).toBe(true);
      expect(
        within(container)
          .getAllByRole('option')[0]
          ?.getAttribute('aria-selected'),
      ).toBe('true');
    });
  });

  describe('more keyboard & guards', () => {
    it('Home/End jump the active row to the first/last enabled item', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS_WITH_DISABLED } },
      );
      const list = getList(container);

      dispatchKey(list, 'End');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(2); // Charlie

      dispatchKey(list, 'Home');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0); // Alpha (Bravo disabled)
    });

    it('an unrelated key is ignored', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS } },
      );
      dispatchKey(getList(container), 'x');
      expect(componentInstance['activeIndex']()).toBe(-1);
    });

    it('clicking a disabled row activates it but never toggles selection', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS_WITH_DISABLED, selectable: true } },
      );

      within(container).getAllByRole('option')[1]?.click(); // Bravo (disabled)
      fixture.detectChanges();

      expect(componentInstance['activeIndex']()).toBe(1);
      expect(componentInstance['selected']().size).toBe(0);
    });

    it('reorder is a no-op at the list edge', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS } },
      );
      within(container)
        .getAllByRole('option')[0]
        ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      (
        componentInstance as unknown as { reorder: (d: -1 | 1) => void }
      ).reorder(-1);
      expect(componentInstance.value()[0]?.label).toBe('Alpha');
    });
  });

  describe('inputs', () => {
    it('moveTopBottom=false hides the ⤒/⤓ buttons', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, moveTopBottom: false },
      });
      expect(
        within(container).queryByRole('button', { name: /move to top/i }),
      ).toBeNull();
      expect(
        within(container).getByRole('button', { name: /move up/i }),
      ).toBeTruthy();
    });

    it('dragdrop=false disables the CDK drop list', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, dragdrop: false },
      });
      // CDK adds `cdk-drop-list-disabled` when disabled.
      expect(
        getList(container).classList.contains('cdk-drop-list-disabled'),
      ).toBe(true);
    });
  });

  describe('selectable', () => {
    it('shows a checkbox per row and toggles selection on click', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, selectable: true } },
      );

      within(container).getAllByRole('option')[1]?.click();
      fixture.detectChanges();

      expect(componentInstance['selected']().has('b')).toBe(true);
      expect(
        container.querySelectorAll('dg-icon-check').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('itemSelect', () => {
    it('emits the full option object on check and uncheck when selectable', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoOrderList<string>
      >(DynamoOrderList, { inputs: { value: ITEMS, selectable: true } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getAllByRole('option')[1]?.click();
      fixture.detectChanges();
      within(container).getAllByRole('option')[1]?.click();
      fixture.detectChanges();

      expect(emitted).toEqual([ITEMS[1], ITEMS[1]]);
    });

    it('emits on Enter when selectable', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoOrderList<string>
      >(DynamoOrderList, { inputs: { value: ITEMS, selectable: true } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      dispatchKey(getList(container), 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(getList(container), 'Enter');
      fixture.detectChanges();

      expect(emitted).toEqual([ITEMS[0]]);
    });

    it('does not emit when not selectable', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoOrderList<string>
      >(DynamoOrderList, { inputs: { value: ITEMS } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getAllByRole('option')[1]?.click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('does not emit for a disabled option', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoOrderList<string>
      >(DynamoOrderList, {
        inputs: { value: ITEMS_WITH_DISABLED, selectable: true },
      });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      within(container).getAllByRole('option')[1]?.click();
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from reordering (▲/▼, top/bottom, drag)', () => {
      const { fixture, componentInstance } = renderDynamoComponent<
        DynamoOrderList<string>
      >(DynamoOrderList, { inputs: { value: ITEMS, selectable: true } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      componentInstance['activeValue'].set('a');
      (
        componentInstance as unknown as {
          reorder: (direction: -1 | 1) => void;
        }
      ).reorder(1);
      (
        componentInstance as unknown as {
          onDropped: (e: CdkDragDrop<unknown>) => void;
        }
      ).onDropped(dropEvent(0, 2));
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('disabled', () => {
    it('freezes reordering, keyboard, and drag', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, disabled: true } },
      );

      expect(getList(container).getAttribute('tabindex')).toBe('-1');

      dispatchKey(getList(container), 'ArrowDown');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(-1);

      (
        componentInstance as unknown as {
          onDropped: (e: CdkDragDrop<unknown>) => void;
        }
      ).onDropped(dropEvent(0, 2));
      expect(componentInstance.value().map((o) => o.label)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
    });
  });

  describe('readOnly', () => {
    it('freezes reordering, selection, and drag, but keeps keyboard navigation and focus working', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, readOnly: true, selectable: true } },
      );
      const list = getList(container);

      expect(list.getAttribute('tabindex')).toBe('0');
      expect(list.getAttribute('aria-readonly')).toBe('true');

      dispatchKey(list, 'ArrowDown');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(list, 'Enter');
      fixture.detectChanges();
      expect(componentInstance['selected']().size).toBe(0);

      (
        componentInstance as unknown as {
          onDropped: (e: CdkDragDrop<unknown>) => void;
        }
      ).onDropped(dropEvent(0, 2));
      expect(componentInstance.value().map((o) => o.label)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
    });

    it('disables the reorder buttons', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, readOnly: true },
      });

      dispatchKey(getList(container), 'ArrowDown');

      const buttons = within(container).getAllByRole('button');
      for (const button of buttons) {
        expect((button as HTMLButtonElement).disabled).toBe(true);
      }
    });
  });

  describe('harness', () => {
    it('reads labels/active index and drives the reorder buttons', async () => {
      const { fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOrderListHarness,
      );

      expect(await harness.getItemLabels()).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
      expect(await harness.isDisabled()).toBe(false);

      await harness.clickRow('Delta'); // activate index 3
      expect(await harness.getActiveIndex()).toBe(3);

      await harness.clickButton('up');
      expect(await harness.getItemLabels()).toEqual([
        'Alpha',
        'Bravo',
        'Delta',
        'Charlie',
      ]);
      expect(await harness.getActiveIndex()).toBe(2);
    });

    it('drives the filter box and reports no-results/drag-disabled state', async () => {
      const { fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOrderListHarness,
      );

      expect(await harness.getFilterText()).toBe('');
      expect(await harness.isDragDisabled()).toBe(false);

      await harness.setFilterText('ra');
      fixture.detectChanges();
      expect(await harness.getFilterText()).toBe('ra');
      expect(await harness.getItemLabels()).toEqual(['Bravo']);
      expect(await harness.isDragDisabled()).toBe(true);
      expect(await harness.hasNoResults()).toBe(false);

      await harness.setFilterText('zzz');
      fixture.detectChanges();
      expect(await harness.hasNoResults()).toBe(true);
    });

    it('throws from setFilterText when filterable is off', async () => {
      const { fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOrderListHarness,
      );

      await expect(harness.setFilterText('x')).rejects.toThrow(/filterable/);
    });
  });

  describe('filter', () => {
    it('renders no filter box by default', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS },
      });

      expect(container.querySelector('input[type="search"]')).toBeNull();
    });

    it('narrows visible rows as the query changes, and restores them when cleared', () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'ra' } });
      fixture.detectChanges();
      expect(getRowTexts(container)).toEqual(['Bravo']);

      fireEvent.input(input, { target: { value: '' } });
      fixture.detectChanges();
      expect(getRowTexts(container)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
    });

    it('shows the no-results message only when the filter matches nothing', () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;

      expect(within(container).queryByRole('status')).toBeNull();

      fireEvent.input(input, { target: { value: 'zzz' } });
      fixture.detectChanges();

      expect(within(container).getByRole('status').textContent).toBe(
        'No matching items',
      );
    });

    it('does not show the no-results message for a genuinely empty list', () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: [], filterable: true },
      });

      expect(within(container).queryByRole('status')).toBeNull();
    });

    it('clicking a filtered row sets the correct active item', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, filterable: true, selectable: true } },
      );
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'ra' } });

      within(container).getByRole('option', { name: 'Charlie' }).click();

      expect(componentInstance['activeValue']()).toBe('c');
    });

    it('keyboard navigation only visits filtered/visible rows', () => {
      // "e" matches One/Three but not Two — ArrowDown from One should land
      // on Three directly, not the hidden Two.
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: FILTER_ITEMS, filterable: true } },
      );
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'e' } });
      fixture.detectChanges();
      // Typing already activates the first match (One) — confirm that,
      // then one ArrowDown should land on Three, skipping the hidden Two.
      expect(componentInstance['activeValue']()).toBe('1');

      dispatchKey(getList(container), 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance['activeValue']()).toBe('3');
    });

    it('makes dropListDisabled() true while a filter query is active, false once cleared', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, filterable: true } },
      );
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'ra' } });
      fixture.detectChanges();
      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(true);

      fireEvent.input(input, { target: { value: '' } });
      fixture.detectChanges();
      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(false);
    });

    it('reorder buttons still move the active item in the full value() while filtered', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: FILTER_ITEMS, filterable: true, selectable: true } },
      );
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'e' } }); // One, Three visible; Two hidden
      fixture.detectChanges();

      within(container).getByRole('option', { name: 'One' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move down in Items' })
        .click();
      fixture.detectChanges();

      // One moved past the hidden Two in the full array...
      expect(componentInstance.value().map((o) => o.value)).toEqual([
        '2',
        '1',
        '3',
      ]);
      // ...but the filtered/visible order is unaffected, since filtering
      // preserves relative order among visible rows — the documented,
      // data-correct "looks like a no-op" quirk.
      expect(getRowTexts(container)).toEqual(['One', 'Three']);
    });

    it('Escape in the filter box clears the query', () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'ra' } });
      fixture.detectChanges();

      dispatchKey(input, 'Escape');
      fixture.detectChanges();

      expect(getRowTexts(container)).toEqual([
        'Alpha',
        'Bravo',
        'Charlie',
        'Delta',
      ]);
    });

    it('has no axe violations with the filter box rendered', async () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with the no-results message rendered', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true },
      });
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'zzz' } });
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('virtual scroll', () => {
    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: MANY_ITEMS },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).toBeNull();
      expect(container.querySelectorAll('[role="option"]')).toHaveLength(50);
    });

    it('renders through dg-virtual-scroll when enabled, with no cdkDrag rows', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: MANY_ITEMS, virtualScroll: true },
      });
      await settle(fixture);

      expect(container.querySelector('dg-virtual-scroll')).not.toBeNull();
      expect(container.querySelectorAll('[cdkdrag]')).toHaveLength(0);
    });

    it('makes dropListDisabled() true while virtualized, independent of disabled/readOnly', () => {
      const { componentInstance } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, virtualScroll: true },
      });

      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(true);
    });

    it('▲/▼ reorder buttons still work while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS, virtualScroll: true, selectable: true } },
      );
      await settle(fixture);

      within(container).getByRole('option', { name: 'Alpha' }).click();
      fixture.detectChanges();
      within(container)
        .getByRole('button', { name: 'Move down in Items' })
        .click();
      fixture.detectChanges();

      expect(componentInstance.value().map((o) => o.value)).toEqual([
        'b',
        'a',
        'c',
        'd',
      ]);
    });

    it('keyboard navigation still moves the active row while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        {
          inputs: {
            value: MANY_ITEMS,
            virtualScroll: true,
            selectable: true,
          },
        },
      );
      await settle(fixture);

      dispatchKey(getList(container), 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(getList(container), 'Enter');
      fixture.detectChanges();

      expect(componentInstance.value()[0]?.value).toBe('option-1');
      expect(
        within(container)
          .getAllByRole('option')[0]
          ?.getAttribute('aria-selected'),
      ).toBe('true');
    });

    // Regression test for the same bug fixed in Picklist/Listbox: CDK's
    // `scrollToIndex` is an unconditional absolute scroll, so wiring it to
    // every activeValue change — including `(mouseenter)` hover — would
    // jump the list on every mouseover. `scrollActiveIntoView()` runs only
    // from the keyboard-nav/reorder paths.
    it('does not scroll the viewport on hover, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: MANY_ITEMS, virtualScroll: true },
      });
      await settle(fixture);
      const viewport = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      ).componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      const secondOption = within(container).getAllByRole(
        'option',
      )[1] as HTMLElement;
      secondOption.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      dispatchKey(getList(container), 'ArrowDown');
      fixture.detectChanges();
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('has no axe violations when virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: MANY_ITEMS, virtualScroll: true },
      });
      await settle(fixture);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('filter + virtual scroll combined', () => {
    it('filters the virtualized set (filteredItems feeds [items], not the raw value())', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        {
          inputs: { value: MANY_ITEMS, filterable: true, virtualScroll: true },
        },
      );
      await settle(fixture);
      const input = container.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;

      fireEvent.input(input, { target: { value: 'Option 1' } });
      await settle(fixture);

      // Matches "Option 1", "Option 10".."Option 19" — 11 total. Asserted
      // against the logical filtered set, not DOM-rendered row count —
      // the virtualized viewport only ever mounts however many rows fit,
      // not every match.
      expect(componentInstance['filteredItems']()).toHaveLength(11);
      expect(container.querySelector('dg-virtual-scroll')).not.toBeNull();
    });

    it('drag stays disabled while filtering, even with virtualScroll off', () => {
      const { componentInstance } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, filterable: true, filterText: 'a' },
      });
      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(true);
    });

    it('drag stays disabled while virtualized, even with filterable off', () => {
      const { componentInstance } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, virtualScroll: true },
      });
      expect(
        (
          componentInstance as unknown as { dropListDisabled: () => boolean }
        ).dropListDisabled(),
      ).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations (plain)', async () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, listLabel: 'Steps' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations (selectable)', async () => {
      const { container } = renderDynamoComponent(DynamoOrderList, {
        inputs: { value: ITEMS, listLabel: 'Steps', selectable: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
