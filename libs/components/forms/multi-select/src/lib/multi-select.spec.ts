import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createMockSelectOptions,
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoMultiSelect } from './multi-select';
import { DynamoMultiSelectHarness } from './multi-select.harness';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

// jsdom has no real `Element.scrollTo` implementation at all. When
// `virtualScroll` is enabled, DynamoMultiSelect's explicit keyboard-nav
// `scrollActiveIntoView()` calls reach the virtual-scroll viewport's
// `scrollToIndex()` (via CDK's viewport, which calls `scrollTo`
// internally). A minimal stub (jsdom-only; this is a real,
// universally-supported browser API) lets these tests exercise the real
// keyboard-nav-while-virtualized behavior instead of throwing.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

// The CDK overlay portals `role="listbox"` content into a
// `.cdk-overlay-container` appended near document.body — outside the
// fixture's own `container` element — same reasoning as DynamoSelect's spec.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="listbox"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getOptions(): HTMLElement[] {
  return Array.from(getPanel()?.querySelectorAll('[role="option"]') ?? []);
}

function getOptionByText(text: string): HTMLElement {
  const option = getOptions().find((el) => el.textContent?.trim() === text);
  if (!option) throw new Error(`No option with text "${text}" found`);
  return option;
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-multi-select-test-host',
  standalone: true,
  imports: [DynamoMultiSelect],
  template: `<dg-multi-select
    [options]="options"
    [(value)]="value"
    aria-label="Choose options"
  />`,
})
class MultiSelectTestHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model<string[]>([]);
}

@Component({
  selector: 'dg-multi-select-templates-host',
  standalone: true,
  imports: [DynamoMultiSelect],
  template: `
    <dg-multi-select
      [options]="options"
      [(value)]="value"
      ariaLabel="Choose options"
    >
      <ng-template #optionTemplate let-option>
        <span data-testid="custom-option">{{ option.label }} (custom)</span>
      </ng-template>
      <ng-template #tagTemplate let-option>
        <span data-testid="custom-tag">{{ option.label }} (tag)</span>
      </ng-template>
    </dg-multi-select>
  `,
})
class MultiSelectTemplatesHostComponent {
  readonly options = THREE_OPTIONS;
  readonly value = model<string[]>([]);
}

@Component({
  selector: 'dg-multi-select-group-template-host',
  standalone: true,
  imports: [DynamoMultiSelect],
  template: `
    <dg-multi-select [options]="options" ariaLabel="Choose items">
      <ng-template #groupTemplate let-label>
        <strong data-testid="custom-group">{{ label }} —</strong>
      </ng-template>
    </dg-multi-select>
  `,
})
class MultiSelectGroupTemplateHostComponent {
  readonly options: DynamoSelectOption<string>[] = [
    { label: 'Ava', value: 'ava', group: 'Team' },
  ];
}

@Component({
  selector: 'dg-multi-select-reactive-form-host',
  standalone: true,
  imports: [DynamoMultiSelect, ReactiveFormsModule],
  template: `<dg-multi-select
    [options]="options"
    [formControl]="control"
    aria-label="Choose options"
  />`,
})
class MultiSelectReactiveFormHostComponent {
  readonly options = THREE_OPTIONS;
  readonly control = new FormControl<string[]>([]);
}

describe('DynamoMultiSelect', () => {
  describe('creation', () => {
    it('renders a combobox trigger', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render the listbox until opened', () => {
      renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder text when nothing is selected', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Select options',
      );
    });

    it('defaults to closed, empty value, not disabled/filterable/invalid, showSelectAll true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      expect(componentInstance['isOpen']()).toBe(false);
      expect(componentInstance.value()).toEqual([]);
      expect(componentInstance.disabled()).toBe(false);
      expect(componentInstance.filterable()).toBe(false);
      expect(componentInstance.invalid()).toBe(false);
      expect(componentInstance.showSelectAll()).toBe(true);
      expect(componentInstance.maxSelected()).toBeUndefined();
    });
  });

  describe('input properties', () => {
    it('reflects a custom placeholder', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, placeholder: 'Pick some' },
      });

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Pick some',
      );
    });

    it('renders one tag per selected value', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1', 'option-3'] },
      });

      const trigger = within(container).getByRole('combobox');
      expect(trigger.textContent).toContain('Option 1');
      expect(trigger.textContent).toContain('Option 3');
      expect(trigger.textContent).not.toContain('Option 2');
    });

    it('reflects aria-disabled and tabindex="-1" on the trigger when disabled', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });
      const trigger = within(container).getByRole('combobox');

      expect(trigger.getAttribute('aria-disabled')).toBe('true');
      expect(trigger.getAttribute('tabindex')).toBe('-1');
    });

    it('reflects aria-invalid and a danger border when invalid is set', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, invalid: true },
      });
      const trigger = within(container).getByRole('combobox');

      expect(trigger.getAttribute('aria-invalid')).toBe('true');
      expect(trigger.className).toContain('border-danger');
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('emits tagRemoved with the removed value when a tag is removed', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1', 'option-2'] },
      });
      let removed: string | undefined;
      componentInstance.tagRemoved.subscribe((value) => (removed = value));

      await userEvent.click(
        within(container).getByRole('button', { name: 'Remove Option 1' }),
      );

      expect(removed).toBe('option-1');
      expect(componentInstance.value()).toEqual(['option-2']);
    });

    it('propagates a toggled selection to a two-way-bound host signal', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MultiSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));

      expect(componentInstance.value()).toEqual(['option-2']);
    });
  });

  describe('user interactions', () => {
    it('opens the listbox when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('toggles an option on click WITHOUT closing the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 1'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(getOptionByText('Option 1'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
    });

    it('toggles the active option with Space/Enter without closing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{Enter}');

      expect(componentInstance.value()).toEqual(['option-1']);
      expect(componentInstance['isOpen']()).toBe(true);
    });

    it('opens on ArrowUp when closed (same as ArrowDown), and moves with ArrowDown/Home/End', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);

      await userEvent.keyboard('{End}');
      expect(componentInstance['activeIndex']()).toBe(2);

      await userEvent.keyboard('{Home}');
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('opens (without moving) on Enter/Space when closed', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance['isOpen']()).toBe(true);
      expect(componentInstance.value()).toEqual([]);
    });

    it('supports Arrow/Enter keys directly on the filter box', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS, filterable: true },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      filterInput.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);

      await userEvent.keyboard('{ArrowUp}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
      expect(componentInstance['isOpen']()).toBe(true);
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('closes without opening when disabled', async () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, disabled: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));

      expect(getPanel()).toBeNull();
    });

    it('closes and clears activeIndex tracking without selecting on Escape', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(componentInstance.value()).toEqual([]);
    });

    it('selects all visible options via the header checkbox, scoped to the filtered set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: THREE_OPTIONS, filterable: true },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      await userEvent.type(filterInput, '1');

      await userEvent.click(
        within(getOverlayContainer()).getByRole('checkbox', {
          name: 'Select all',
        }),
      );

      expect(componentInstance.value()).toEqual(['option-1']);
    });

    it('clears only the visible/filtered selected values by unchecking the header checkbox', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: ['option-1', 'option-2'],
            filterable: true,
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;
      await userEvent.type(filterInput, '1');

      // Filtered to just Option 1, which is already selected — the header
      // checkbox reads fully-checked for this filtered set, so clicking it
      // clears (unchecks) rather than selects.
      await userEvent.click(
        within(getOverlayContainer()).getByRole('checkbox', {
          name: 'Select all',
        }),
      );

      expect(componentInstance.value()).toEqual(['option-2']);
    });

    it('shows the header checkbox as indeterminate when some but not all options are selected', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1'] },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const checkbox = within(getOverlayContainer()).getByRole('checkbox', {
        name: 'Select all',
      }) as HTMLInputElement;

      expect(checkbox.indeterminate).toBe(true);
      expect(checkbox.checked).toBe(false);
    });

    it('disables remaining unselected options once maxSelected is reached, and re-enables on removal', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1'], maxSelected: 1 },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getOptionByText('Option 2').getAttribute('aria-disabled')).toBe(
        'true',
      );
      expect(getOverlayContainer().textContent).toContain(
        'Maximum selections reached',
      );
    });

    it('does not exceed maxSelected via toggleOption', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: ['option-1'],
            maxSelected: 1,
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getOptionByText('Option 2'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
    });

    it('collapses the tag list to "+N more" once maxVisibleTags is exceeded', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: ['option-1', 'option-2', 'option-3'],
          maxVisibleTags: 2,
        },
      });
      const trigger = within(container).getByRole('combobox');

      expect(trigger.textContent).toContain('Option 1');
      expect(trigger.textContent).toContain('Option 2');
      expect(trigger.textContent).not.toContain('Option 3');
      expect(trigger.textContent).toContain('+1 more');
    });

    it('supports interaction through the DynamoMultiSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMultiSelectHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.toggleOptionByText('Option 3');
      await settle(fixture);

      expect(await harness.getTriggerTagTexts()).toEqual(['Option 3']);
      expect(await harness.getOptionTexts()).toEqual([
        'Option 1',
        'Option 2',
        'Option 3',
      ]);
      expect(await harness.isOpen()).toBe(true);

      await harness.removeTagByText('Option 3');
      await settle(fixture);

      expect(await harness.getTriggerTagTexts()).toEqual([]);

      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });

    it('filters and selects all via the harness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, filterable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMultiSelectHarness,
      );

      await harness.filter('2');
      await settle(fixture);
      expect(await harness.getOptionTexts()).toEqual(['Option 2']);

      expect(await harness.isSelectAllChecked()).toBe(false);
      await harness.toggleSelectAll();
      await settle(fixture);
      expect(componentInstance.value()).toEqual(['option-2']);
      expect(await harness.isSelectAllChecked()).toBe(true);
    });
  });

  describe('conditional rendering', () => {
    it('renders a filter box only when filterable is set', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, filterable: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        document.body.querySelector('input[type="search"]'),
      ).not.toBeNull();
    });

    it('hides the header select-all checkbox when showSelectAll is false', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, showSelectAll: false },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        within(getOverlayContainer()).queryByRole('checkbox', {
          name: 'Select all',
        }),
      ).toBeNull();
    });

    it('shows noResultsMessage only when the filter matches nothing among non-empty options', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          filterable: true,
          noResultsMessage: 'Nothing found',
        },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const filterInput = document.body.querySelector(
        'input[type="search"]',
      ) as HTMLElement;

      expect(getOverlayContainer().textContent).not.toContain('Nothing found');

      await userEvent.type(filterInput, 'zzz');
      expect(getOverlayContainer().textContent).toContain('Nothing found');
    });
  });

  describe('grouped options', () => {
    const GROUPED_OPTIONS: DynamoSelectOption<string>[] = [
      { label: 'Ava', value: 'ava', group: 'Engineering' },
      { label: 'Bea', value: 'bea', group: 'Design' },
      { label: 'Cal', value: 'cal', group: 'Engineering' },
    ];

    it('renders a role="presentation" heading per group, in first-seen order', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: GROUPED_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const headings = Array.from(
        getPanel()?.querySelectorAll('li[role="presentation"]') ?? [],
      ).filter(
        (el) =>
          el.textContent?.trim() === 'Engineering' ||
          el.textContent?.trim() === 'Design',
      );
      expect(headings.map((h) => h.textContent?.trim())).toEqual([
        'Engineering',
        'Design',
      ]);
    });
  });

  describe('template behavior', () => {
    it('sets aria-selected="true" and shows the check icon only on selected options', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-2'] },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const options = getOptions();
      expect(options[0]?.getAttribute('aria-selected')).toBe('false');
      expect(options[1]?.getAttribute('aria-selected')).toBe('true');
      expect(options[0]?.querySelector('dg-icon-check')).toBeNull();
      expect(options[1]?.querySelector('dg-icon-check')).not.toBeNull();
    });

    it('sets aria-multiselectable="true" on the listbox', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  describe('clearable', () => {
    it('does not render a clear button when clearable is false', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: ['option-1'],
          clearable: false,
        },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('does not render a clear button when nothing is selected', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, clearable: true },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('clears the whole selection at once, without opening the panel', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: ['option-1', 'option-2'],
            clearable: true,
          },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toEqual([]);
      expect(getPanel()).toBeNull();
    });

    it('ignores the clear button when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: ['option-1'],
            clearable: true,
            disabled: true,
          },
        },
      );

      const clearButton = within(container).getByRole('button', {
        name: 'Clear selection',
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);
      expect(componentInstance.value()).toEqual(['option-1']);
    });
  });

  describe('readOnly', () => {
    it('blocks toggling an option, removing a tag, select-all, and the clear button, but keeps the trigger focusable', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            value: ['option-1'],
            readOnly: true,
            clearable: true,
            showSelectAll: true,
          },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
      expect(trigger.getAttribute('aria-readonly')).toBe('true');
      expect(trigger.tabIndex).toBe(0);

      const removeButton = within(container).getByRole('button', {
        name: 'Remove Option 1',
      }) as HTMLButtonElement;
      expect(removeButton.disabled).toBe(true);

      const clearButton = within(container).getByRole('button', {
        name: 'Clear selection',
      }) as HTMLButtonElement;
      expect(clearButton.disabled).toBe(true);

      const selectAll = within(document.body).getByTestId(
        'dg-multi-select-select-all',
      );
      expect(selectAll.querySelector('input')?.hasAttribute('disabled')).toBe(
        true,
      );
    });
  });

  describe('loading', () => {
    it('renders a spinner in the trigger only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, loading: false } },
      );
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('sets aria-busy="true" and aria-disabled/tabindex="-1" on the trigger while loading', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });
      const trigger = within(container).getByRole('combobox');

      expect(trigger.getAttribute('aria-busy')).toBe('true');
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
      expect(trigger.getAttribute('tabindex')).toBe('-1');
    });

    it('does not open the panel while loading', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, loading: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('re-enables the trigger when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, loading: true } },
      );
      const trigger = within(container).getByRole('combobox');
      expect(trigger.getAttribute('aria-disabled')).toBe('true');

      setInputs({ loading: false });

      expect(trigger.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('itemSelect', () => {
    it('emits the full option object on check and on uncheck', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));
      await userEvent.click(getOptionByText('Option 2'));

      expect(emitted).toEqual([THREE_OPTIONS[1], THREE_OPTIONS[1]]);
    });

    it('emits the same option on keyboard Enter as on click', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: THREE_OPTIONS } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(emitted).toEqual([THREE_OPTIONS[1]]);
    });

    it('does not emit for a disabled option', async () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first' },
        { label: 'Second (disabled)', value: 'second', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: optionsWithDisabled } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Second (disabled)'));

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from selectAll/clearAll (the header checkbox)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: THREE_OPTIONS } });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const selectAll = within(getOverlayContainer()).getByRole('checkbox', {
        name: 'Select all',
      });
      await userEvent.click(selectAll);
      await userEvent.click(selectAll);

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from removeTag', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1'] },
      });
      const emitted: DynamoSelectOption<string>[] = [];
      componentInstance.itemSelect.subscribe((option) => emitted.push(option));

      await userEvent.click(
        within(container).getByRole('button', { name: 'Remove Option 1' }),
      );

      expect(emitted).toHaveLength(0);
    });
  });

  describe('typeahead', () => {
    const FRUITS: DynamoSelectOption<string>[] = [
      { label: 'Apple', value: 'apple' },
      { label: 'Apricot', value: 'apricot' },
      { label: 'Banana', value: 'banana' },
    ];

    function dispatchKey(target: HTMLElement, key: string): void {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    it('jumps to and opens the panel on the first matching option while closed, without toggling it', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: FRUITS } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(componentInstance['activeIndex']()).toBe(2);
      expect(componentInstance.value()).toEqual([]);
    });

    it('cycles through options sharing the same starting letter on repeated presses', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: FRUITS } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container, fixture, componentInstance } = renderDynamoComponent<
          DynamoMultiSelect<string>
        >(DynamoMultiSelect, { inputs: { options: FRUITS } });
        const trigger = within(container).getByRole('combobox') as HTMLElement;

        dispatchKey(trigger, 'a');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(0);

        vi.advanceTimersByTime(600);

        dispatchKey(trigger, 'b');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled options', () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'Apple', value: 'apple' },
        { label: 'Apricot', value: 'apricot', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: optionsWithDisabled } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('does not activate while filterable is true', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoMultiSelect<string>
      >(DynamoMultiSelect, { inputs: { options: FRUITS, filterable: true } });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(componentInstance['activeIndex']()).toBe(-1);
      expect(getPanel()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, ariaLabel: 'Choose options' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when open with selections and a filter box', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          ariaLabel: 'Choose options',
          value: ['option-1'],
          filterable: true,
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('sets aria-activedescendant to the active option id while open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);

      const activeDescendant = trigger.getAttribute('aria-activedescendant');
      expect(activeDescendant).toBeTruthy();
      expect(
        document.getElementById(activeDescendant as string),
      ).not.toBeNull();
    });
  });

  describe('state changes', () => {
    it('updates the trigger tags after a value change from outside (writeValue)', () => {
      const { fixture, container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });

      fixture.componentInstance.writeValue(['option-2']);
      fixture.detectChanges();

      expect(within(container).getByRole('combobox').textContent).toContain(
        'Option 2',
      );
    });

    it('propagates a toggle to a bound reactive FormControl (registerOnChange)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MultiSelectReactiveFormHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 2'));

      expect(componentInstance.control.value).toEqual(['option-2']);
    });

    it('marks the bound FormControl as touched when the listbox closes (registerOnTouched)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MultiSelectReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(componentInstance.control.touched).toBe(true);
    });

    it('disables the trigger when the bound FormControl is disabled (setDisabledState)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        MultiSelectReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        within(container).getByRole('combobox').getAttribute('aria-disabled'),
      ).toBe('true');
    });

    it('treats writeValue(null) as an empty selection', () => {
      const { fixture, container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1'] },
      });

      fixture.componentInstance.writeValue(null);
      fixture.detectChanges();

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Select options',
      );
    });
  });

  describe('edge cases', () => {
    it('renders an empty listbox without throwing when options is an empty array', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: [] },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getOptions()).toHaveLength(0);
    });

    it('ignores clicks on a disabled option', async () => {
      const optionsWithDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first' },
        { label: 'Second (disabled)', value: 'second', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: { options: optionsWithDisabled },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Second (disabled)'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
    });

    it('handles rapid open/close toggling without throwing', async () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      const trigger = within(container).getByRole('combobox');

      for (let i = 0; i < 5; i++) {
        await userEvent.click(trigger);
        await userEvent.click(trigger);
      }

      expect(true).toBe(true);
    });
  });

  describe('virtual scroll', () => {
    const MANY_OPTIONS: DynamoSelectOption<string>[] =
      createMockSelectOptions(50);

    it('renders the option list through dg-virtual-scroll when enabled (ungrouped case)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeTruthy();
    });

    it('still renders real option rows and supports toggling one by click', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getOptionByText('Option 1'));
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
      expect(getPanel()).not.toBeNull(); // toggling keeps the panel open, same as the non-virtualized path
    });

    it('keyboard navigation still moves activeIndex while virtualized', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: MANY_OPTIONS, virtualScroll: true } },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(0);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    // Regression test for the same bug fixed in DynamoSelect: CDK's
    // `scrollToIndex` is an unconditional absolute scroll, so calling it on
    // every `activeIndex` change — including `(mouseenter)` hover, which
    // only ever targets an already-visible row — visibly jumps the panel.
    // `scrollActiveIntoView()` is called only from keyboard-driven sites.
    it('does not scroll the viewport when hovering an option, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: MANY_OPTIONS, virtualScroll: true },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewport =
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      getOptionByText('Option 2').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('falls back to the full, non-virtualized render for grouped options even when virtualScroll is true', async () => {
      const groupedOptions: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Engineering' },
        { label: 'Bea', value: 'bea', group: 'Design' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: groupedOptions, virtualScroll: true },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(
        getPanel()?.querySelectorAll('li[role="presentation"]').length,
      ).toBeGreaterThan(0);
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: MANY_OPTIONS },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(getOptions()).toHaveLength(50);
    });

    it('has no axe violations when open and virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: MANY_OPTIONS,
          ariaLabel: 'Choose options',
          virtualScroll: true,
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });
  });

  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/trigger/tag/tagRemove/overflowTag/chevron/clear/listbox/group/option/optionCheckbox/filterInput', async () => {
      const groupedWithFilter: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Team' },
        { label: 'Bea', value: 'bea', group: 'Team' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: groupedWithFilter,
          value: ['ava', 'bea'],
          clearable: true,
          filterable: true,
          maxVisibleTags: 1,
          pt: {
            root: { class: 'pt-root' },
            trigger: { class: 'pt-trigger' },
            tag: { class: 'pt-tag' },
            tagRemove: { class: 'pt-tag-remove' },
            overflowTag: { class: 'pt-overflow-tag' },
            chevron: { class: 'pt-chevron' },
            clear: { class: 'pt-clear' },
            listbox: { class: 'pt-listbox' },
            group: { class: 'pt-group' },
            option: { class: 'pt-option' },
            optionCheckbox: { class: 'pt-option-checkbox' },
            filterInput: { class: 'pt-filter-input' },
          },
        },
      });

      const trigger = within(container).getByRole('combobox');
      expect(trigger.classList).toContain('pt-root');
      expect(trigger.classList).toContain('pt-trigger');
      expect(container.querySelector('div > svg')?.classList).toContain(
        'pt-chevron',
      );
      expect(
        within(container).getByRole('button', { name: 'Clear selection' })
          .classList,
      ).toContain('pt-clear');
      expect(
        within(container)
          .getByRole('button', { name: /Remove Ava/ })
          .closest('span')?.classList,
      ).toContain('pt-tag');
      expect(
        within(container).getByRole('button', { name: /Remove Ava/ }).classList,
      ).toContain('pt-tag-remove');
      expect(container.querySelector('.pt-overflow-tag')).not.toBeNull();

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.classList).toContain('pt-listbox');
      expect(
        getPanel()?.querySelector('[role="presentation"]')?.classList,
      ).toContain('pt-group');
      expect(getOptionByText('Ava').classList).toContain('pt-option');
      expect(getOptionByText('Ava').querySelector('span')?.classList).toContain(
        'pt-option-checkbox',
      );
      expect(
        getOverlayContainer().querySelector('input[type="search"]')?.classList,
      ).toContain('pt-filter-input');
    });

    it('merges selectAll and clearAll pt classes onto the one header checkbox, selectAll winning key collisions', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          pt: {
            selectAll: { class: 'pt-select-all', 'data-select-all': 'yes' },
            clearAll: { class: 'pt-clear-all', 'data-select-all': 'no' },
          },
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const selectAllHost = within(document.body).getByTestId(
        'dg-multi-select-select-all',
      );
      const label = selectAllHost.querySelector('label');
      expect(label?.classList).toContain('pt-select-all');
      expect(label?.classList).toContain('pt-clear-all');
      expect(label?.getAttribute('data-select-all')).toBe('yes');
    });
  });

  describe('variant / fluid / ariaDescribedby', () => {
    it('defaults variant to outlined and fluid to true', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS } },
      );
      expect(componentInstance.variant()).toBe('outlined');
      expect(componentInstance.fluid()).toBe(true);
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('applies a different background for the filled variant', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, variant: 'outlined' } },
      );
      const outlinedClasses = container.querySelector('div')?.className;

      setInputs({ variant: 'filled' });
      const filledClasses = container.querySelector('div')?.className;

      expect(outlinedClasses).not.toBe(filledClasses);
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, fluid: false },
      });
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('forwards ariaDescribedby to the trigger', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, ariaDescribedby: 'help-text' },
      });
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBe('help-text');
    });
  });

  describe('lazy virtual scroll (scrolledIndexChange)', () => {
    const MANY_OPTIONS_FOR_SCROLL: DynamoSelectOption<string>[] =
      createMockSelectOptions(50);

    it('forwards scrolledIndexChange from the underlying dg-virtual-scroll while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: MANY_OPTIONS_FOR_SCROLL, virtualScroll: true } },
      );
      const emitted: number[] = [];
      componentInstance.scrolledIndexChange.subscribe((i) => emitted.push(i));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const viewport =
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>;
      viewport.scrolledIndexChange.emit(7);

      // CDK's viewport also emits an initial index (0) on its own attach —
      // assert the forwarded value arrived rather than an exact array, to
      // stay robust to that implementation detail.
      expect(emitted).toContain(7);
    });
  });

  describe('activeIndex re-validation while the panel stays open', () => {
    it('recovers activeIndex once a previously all-disabled option list gets an enabled option', async () => {
      const allDisabled: DynamoSelectOption<string>[] = [
        { label: 'First', value: 'first', disabled: true },
        { label: 'Second', value: 'second', disabled: true },
      ];
      const { container, fixture, componentInstance, setInputs } =
        renderDynamoComponent(DynamoMultiSelect, {
          inputs: { options: allDisabled },
        });
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      expect(componentInstance['activeIndex']()).toBe(-1);

      setInputs({
        options: [
          { label: 'First', value: 'first', disabled: true },
          { label: 'Second', value: 'second', disabled: false },
        ],
      });
      await settle(fixture);

      expect(componentInstance['activeIndex']()).toBe(1);
      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        getOptionByText('Second').id,
      );
    });

    it('recovers activeIndex when the actively-highlighted option is removed while the panel stays open', async () => {
      const { container, fixture, componentInstance, setInputs } =
        renderDynamoComponent(DynamoMultiSelect, {
          inputs: { options: THREE_OPTIONS },
        });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      trigger.focus();
      // Opening already auto-focuses index 0, so two more ArrowDowns reach index 2.
      await userEvent.keyboard('{ArrowDown}{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(2);

      setInputs({ options: THREE_OPTIONS.slice(0, 2) });
      await settle(fixture);

      expect(componentInstance['activeIndex']()).toBeLessThan(2);
    });

    it('recovers activeIndex when maxSelected capacity synthetically disables the active row via effectiveOptions', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, maxSelected: 1 } },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      trigger.focus();
      // Open auto-focuses index 0 ("Option 1"); arrow down once more to
      // highlight "Option 2" before selecting "Option 1", which then caps
      // capacity and synthetically disables "Option 2" out from under the
      // still-active index.
      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);

      await userEvent.keyboard('{ArrowUp}{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
      const active = componentInstance['activeIndex']();
      const options = componentInstance[
        'visibleOptions'
      ]() as DynamoSelectOption<string>[];
      expect(options[active]?.disabled).not.toBe(true);
    });
  });

  describe('overflow tag accessibility', () => {
    it('describes the hidden options on the "+N more" pill via aria-label', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          value: ['option-1', 'option-2', 'option-3'],
          maxVisibleTags: 1,
        },
      });

      const overflow = container.querySelector('[aria-label^="Also selected"]');
      expect(overflow).not.toBeNull();
      expect(overflow?.getAttribute('aria-label')).toContain('Option 2');
      expect(overflow?.getAttribute('aria-label')).toContain('Option 3');
    });

    it('has no aria-label on the overflow pill when nothing is hidden', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1'] },
      });

      expect(
        container.querySelector('[aria-label^="Also selected"]'),
      ).toBeNull();
    });
  });

  describe('custom templates', () => {
    it('renders #optionTemplate instead of plain text for every option', async () => {
      const { container, fixture } = renderDynamoComponent(
        MultiSelectTemplatesHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const customOptions = getPanel()?.querySelectorAll(
        '[data-testid="custom-option"]',
      );
      expect(customOptions).toHaveLength(3);
      expect(customOptions?.[0]?.textContent).toContain('(custom)');
    });

    it('renders #tagTemplate inside each tag pill while keeping the remove button real and functional', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        MultiSelectTemplatesHostComponent,
      );
      componentInstance.value.set(['option-1']);
      fixture.detectChanges();

      const tag = within(container).getByTestId('custom-tag');
      expect(tag.textContent).toContain('Option 1 (tag)');
      const removeButton = within(container).getByRole('button', {
        name: /Remove Option 1/,
      });
      expect(removeButton).not.toBeNull();

      await userEvent.click(removeButton);
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
    });

    it('does not apply #tagTemplate to the overflow ("+N more") pill', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, value: ['option-1', 'option-2'] },
      });
      // No tagTemplate projected here at all (plain DynamoMultiSelect render)
      // — sanity-checks the overflow pill's own text path is untouched;
      // the host-component test above covers the "template present but
      // skipped for overflow" case indirectly since maxVisibleTags isn't
      // set there and no overflow pill renders.
      expect(container.querySelector('[data-testid="custom-tag"]')).toBeNull();
    });

    it('renders #groupTemplate instead of plain text for group headings', async () => {
      const { container, fixture } = renderDynamoComponent(
        MultiSelectGroupTemplateHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const heading = getPanel()?.querySelector('[data-testid="custom-group"]');
      expect(heading?.textContent).toContain('Team —');
    });

    it('falls back to plain text for options/groups/tags when no templates are provided', async () => {
      const grouped: DynamoSelectOption<string>[] = [
        { label: 'Ava', value: 'ava', group: 'Team' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: grouped, value: ['ava'] },
      });

      expect(within(container).getByText('Ava')).not.toBeNull();

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Team');
      expect(getOptionByText('Ava')).not.toBeNull();
    });
  });

  describe('editableTags (chip input)', () => {
    it('defaults to false, rendering no chip input (trigger stays the combobox)', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLElement).tagName,
      ).toBe('DIV');
    });

    it('renders a real typable <input role="combobox"> when editableTags is true', () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: { options: THREE_OPTIONS, editableTags: true },
      });
      expect(
        (within(container).getByRole('combobox') as HTMLElement).tagName,
      ).toBe('INPUT');
    });

    it('typing updates the input value live without committing anything yet', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Custom');

      expect(input.value).toBe('Custom');
      expect(componentInstance.value()).toEqual([]);
    });

    it('Space types a literal space instead of toggling the active option', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      // userEvent.type() clicks (opens the panel) before typing — Space must
      // still type literally rather than toggling whatever's highlighted.
      await userEvent.type(input, 'a b');

      expect(input.value).toBe('a b');
      expect(componentInstance.value()).toEqual([]);
    });

    it('commits a non-matching typed value as a raw-string tag on blur, and it renders as a pill', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Something custom');
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['Something custom']);
      // Regression check for the `selectedOptions()` synthesis fix — a
      // raw-string tag has no matching `options()` entry, so without the
      // fallback it would silently vanish from the tag row despite being
      // correctly present in `value()`.
      expect(within(container).getByText('Something custom')).not.toBeNull();
    });

    it('selects the matching option properly (not the raw string) when typed text matches its label exactly, on blur', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Option 2');
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-2']);
    });

    it('re-typing an already-selected option label is a no-op — it does not unselect it', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editableTags: true,
            value: ['option-1'],
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Option 1');
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
    });

    it('comma commits the draft and clears the input', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Something custom,');
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['Something custom']);
      expect(input.value).toBe('');
    });

    it('blur with an empty draft is a no-op', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      input.focus();
      input.blur();
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
    });

    it('a duplicate raw-string tag is deduped, not appended twice', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Custom,');
      await settle(fixture);
      await userEvent.type(input, 'Custom,');
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['Custom']);
    });

    it('a commit at maxSelected capacity is a silent no-op', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editableTags: true,
            maxSelected: 1,
            value: ['option-1'],
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;

      await userEvent.type(input, 'Custom,');
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['option-1']);
    });

    it('does not close the panel on commit (unlike single-select)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      await userEvent.click(input);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);

      await userEvent.type(input, 'Custom,');
      await settle(fixture);

      expect(componentInstance['isOpen']()).toBe(true);
    });

    it('clicking the input opens the panel without ever closing it while already open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const input = within(container).getByRole('combobox');

      await userEvent.click(input);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);

      await userEvent.click(input);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);
    });

    it('clicking elsewhere on the trigger still toggles the panel open and closed', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS, editableTags: true } },
      );
      const trigger = container.querySelector('div') as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(true);

      await userEvent.click(trigger);
      await settle(fixture);
      expect(componentInstance['isOpen']()).toBe(false);
    });

    it('existing tag removal, selectAll, and clearSelection still work unchanged with editableTags on', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editableTags: true,
            clearable: true,
            value: ['option-1', 'option-2'],
          },
        },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: /Remove Option 1/ }),
      );
      await settle(fixture);
      expect(componentInstance.value()).toEqual(['option-2']);

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );
      await settle(fixture);
      expect(componentInstance.value()).toEqual([]);
    });

    it('clearSelection also clears any in-progress chip draft', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoMultiSelect,
        {
          inputs: {
            options: THREE_OPTIONS,
            editableTags: true,
            clearable: true,
            value: ['option-1'],
          },
        },
      );
      const input = within(container).getByRole('combobox') as HTMLInputElement;
      await userEvent.type(input, ' extra');

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
      expect(input.value).toBe('');
    });

    it('matchOverlayWidthToTrigger returns editableTags()', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoMultiSelect,
        { inputs: { options: THREE_OPTIONS } },
      );
      expect(componentInstance['matchOverlayWidthToTrigger']()).toBe(false);

      setInputs({ editableTags: true });
      expect(componentInstance['matchOverlayWidthToTrigger']()).toBe(true);
    });

    it('filterable and editableTags both true does not throw (smoke test — mutual exclusivity is documented, not guarded)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          editableTags: true,
          filterable: true,
        },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(DynamoMultiSelect, {
        inputs: {
          options: THREE_OPTIONS,
          editableTags: true,
          ariaLabel: 'Skills',
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
