import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoOrderList } from './order-list';
import { DynamoOrderListHarness } from './order-list.harness';
import type { DynamoSelectOption } from './order-list.types';

const ITEMS: DynamoSelectOption<string>[] = [
  { label: 'Alpha', value: 'a' },
  { label: 'Bravo', value: 'b' },
  { label: 'Charlie', value: 'c' },
  { label: 'Delta', value: 'd' },
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

function dropEvent(previousIndex: number, currentIndex: number): CdkDragDrop<unknown> {
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
      within(container).getAllByRole('option')[2]?.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
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
        within(container).getAllByRole('option')[1]?.getAttribute('aria-selected'),
      ).toBe('true');
    });

    it('move-to-top / move-to-bottom jump the active row to an edge', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoOrderList,
        { inputs: { value: ITEMS } },
      );
      within(container).getAllByRole('option')[1]?.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
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
        within(container).getAllByRole('option')[0]?.getAttribute('aria-selected'),
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
      within(container).getAllByRole('option')[0]?.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
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
