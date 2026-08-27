import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoListbox } from './listbox';
import { DynamoListboxHarness } from './listbox.harness';

const OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid' },
  { label: 'Card', value: 'card' },
];

const OPTIONS_WITH_DISABLED = [
  { label: 'List', value: 'list' },
  { label: 'Grid', value: 'grid', disabled: true },
  { label: 'Card', value: 'card' },
];

const GROUPED_OPTIONS = [
  { label: 'Apple', value: 'apple', group: 'Fruits' },
  { label: 'Banana', value: 'banana', group: 'Fruits' },
  { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
  { label: 'Grain', value: 'grain' },
];

function dispatchKey(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('DynamoListbox', () => {
  describe('creation', () => {
    it('renders a listbox with one option per entry in single-select mode', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, ariaLabel: 'View' },
      });

      expect(within(container).getByRole('listbox', { name: 'View' })).toBeTruthy();
      expect(within(container).getAllByRole('option')).toHaveLength(3);
      expect(container.querySelector('[role="listbox"]')?.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('sets aria-multiselectable="true" in multi-select mode', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true, ariaLabel: 'Tags' },
      });

      expect(
        container.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable'),
      ).toBe('true');
    });
  });

  describe('single-select behavior', () => {
    it('clicking an option sets value to that option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS } },
      );

      within(container).getByRole('option', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('grid');
    });

    it('clicking the already-selected option is a no-op re-set, never nulls the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'list' } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('reflects the selected option via aria-selected, and only that option', () => {
      const { fixture, container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, value: 'grid' },
      });
      fixture.detectChanges();

      expect(
        within(container).getByRole('option', { name: 'Grid' }).getAttribute('aria-selected'),
      ).toBe('true');
      expect(
        within(container).getByRole('option', { name: 'List' }).getAttribute('aria-selected'),
      ).toBe('false');
    });
  });

  describe('multi-select behavior', () => {
    it('clicking toggles membership in the value array', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();
      within(container).getByRole('option', { name: 'Card' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list', 'card']);
    });

    it('clicking an already-selected option removes it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true, value: ['list', 'grid'] } },
      );

      within(container).getByRole('option', { name: 'List' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });

    it('reflects each option independently via aria-selected, and renders a check icon only for selected options', () => {
      const { fixture, container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true, value: ['list', 'card'] },
      });
      fixture.detectChanges();

      const list = within(container).getByRole('option', { name: 'List' });
      const grid = within(container).getByRole('option', { name: 'Grid' });
      expect(list.getAttribute('aria-selected')).toBe('true');
      expect(grid.getAttribute('aria-selected')).toBe('false');
      expect(list.querySelector('svg')).not.toBeNull();
      expect(grid.querySelector('svg')).toBeNull();
    });
  });

  describe('grouping', () => {
    it('renders heading rows between groups in first-seen order, with ungrouped options unheaded', () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: GROUPED_OPTIONS },
      });

      const rows = Array.from(
        container.querySelectorAll('[role="option"], [role="presentation"]'),
      );
      const summary = rows.map((row) => [row.getAttribute('role'), row.textContent?.trim()]);

      expect(summary).toEqual([
        ['presentation', 'Fruits'],
        ['option', 'Apple'],
        ['option', 'Banana'],
        ['presentation', 'Vegetables'],
        ['option', 'Carrot'],
        ['option', 'Grain'],
      ]);
    });
  });

  describe('keyboard navigation — single-select mode', () => {
    it('ArrowDown moves the active option and selects it, wrapping at the end', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'card' } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('list');
    });

    it('ArrowDown skips disabled options', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS_WITH_DISABLED, value: 'list' } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('card');
    });

    it('Home/End jump to the first/last enabled option and select it', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, value: 'grid' } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'End');
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('card');

      dispatchKey(root, 'Home');
      fixture.detectChanges();
      expect(componentInstance.value()).toBe('list');
    });

    it('Enter selects the active option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(root, 'Enter');
      fixture.detectChanges();

      expect(componentInstance.value()).toBe('grid');
    });
  });

  describe('keyboard navigation — multi-select mode', () => {
    it('ArrowDown moves the active option without changing the value', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true, value: ['list'] } },
      );

      dispatchKey(container.querySelector('[role="listbox"]') as HTMLElement, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['list']);
    });

    it('Space toggles the active option', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, multiple: true } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      dispatchKey(root, 'ArrowDown'); // active index seeds to 0 (List); Arrow moves to Grid
      fixture.detectChanges();
      dispatchKey(root, ' ');
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual(['grid']);
    });
  });

  describe('disabled options', () => {
    it('an individually-disabled option is not clickable', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS_WITH_DISABLED } },
      );

      within(container).getByRole('option', { name: 'Grid' }).click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });

    it('a fully-disabled options list leaves activeIndex unset (no aria-activedescendant)', () => {
      const allDisabled = OPTIONS.map((o) => ({ ...o, disabled: true }));
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: allDisabled },
      });

      expect(
        container.querySelector('[role="listbox"]')?.hasAttribute('aria-activedescendant'),
      ).toBe(false);
    });
  });

  describe('disabled root', () => {
    it('makes the whole listbox inert', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoListbox,
        { inputs: { options: OPTIONS, disabled: true } },
      );
      const root = container.querySelector('[role="listbox"]') as HTMLElement;

      expect(root.getAttribute('aria-disabled')).toBe('true');
      expect(root.getAttribute('tabindex')).toBe('-1');

      within(container).getByRole('option', { name: 'Grid' }).click();
      dispatchKey(root, 'ArrowDown');
      fixture.detectChanges();

      expect(componentInstance.value()).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoListboxHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, multiple: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoListboxHarness,
      );

      await harness.clickOption('Grid');
      fixture.detectChanges();

      expect(await harness.getSelectedLabels()).toEqual(['Grid']);
    });

    it('reports a disabled option through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS_WITH_DISABLED },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoListboxHarness,
      );

      expect(await harness.isOptionDisabled('Grid')).toBe(true);
      expect(await harness.isOptionDisabled('List')).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in single-select mode with a selection', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: OPTIONS, ariaLabel: 'View', value: 'list' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in multi-select mode with mixed selected/disabled options', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: {
          options: OPTIONS_WITH_DISABLED,
          multiple: true,
          ariaLabel: 'Tags',
          value: ['list'],
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with grouped options', async () => {
      const { container } = renderDynamoComponent(DynamoListbox, {
        inputs: { options: GROUPED_OPTIONS, ariaLabel: 'Produce' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
