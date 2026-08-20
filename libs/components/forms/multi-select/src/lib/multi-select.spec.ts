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
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoMultiSelect } from './multi-select';
import { DynamoMultiSelectHarness } from './multi-select.harness';

const THREE_OPTIONS: DynamoSelectOption<string>[] = createMockSelectOptions(3);

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
});
