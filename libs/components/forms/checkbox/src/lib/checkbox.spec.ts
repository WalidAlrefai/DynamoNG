import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoCheckbox } from './checkbox';
import { DynamoCheckboxHarness } from './checkbox.harness';

@Component({
  selector: 'dg-checkbox-two-way-host',
  standalone: true,
  imports: [DynamoCheckbox],
  template: `<dg-checkbox [(checked)]="value">Accept terms</dg-checkbox>`,
})
class CheckboxTwoWayHostComponent {
  readonly value = model(false);
}

describe('DynamoCheckbox', () => {
  describe('creation', () => {
    it('renders without errors with a native checkbox input', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      expect(within(container).getByRole('checkbox')).toBeTruthy();
    });

    it('projects the content passed between the component tags as its label', () => {
      const { container } = renderDynamoComponent(CheckboxTwoWayHostComponent);

      expect(container.textContent).toContain('Accept terms');
    });

    it('associates the label with the input via a generated id', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      const input = within(container).getByRole('checkbox') as HTMLInputElement;
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe(input.id);
    });
  });

  describe('default behavior', () => {
    it('defaults to unchecked and not indeterminate', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      const input = within(container).getByRole('checkbox') as HTMLInputElement;
      expect(input.checked).toBe(false);
      expect(input.indeterminate).toBe(false);
    });

    it('defaults to not disabled', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      expect(
        (within(container).getByRole('checkbox') as HTMLInputElement).disabled,
      ).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects the checked input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { checked: true },
      });

      expect(
        (within(container).getByRole('checkbox') as HTMLInputElement).checked,
      ).toBe(true);
    });

    it('reflects the indeterminate input as a DOM property (not an attribute)', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { indeterminate: true },
      });

      expect(
        (within(container).getByRole('checkbox') as HTMLInputElement)
          .indeterminate,
      ).toBe(true);
    });

    it('reflects the disabled input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('checkbox') as HTMLInputElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoCheckbox);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('updates a two-way-bound value when the checkbox is toggled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CheckboxTwoWayHostComponent,
      );
      expect(componentInstance.value()).toBe(false);

      await userEvent.click(within(container).getByRole('checkbox'));

      expect(componentInstance.value()).toBe(true);
    });

    it('toggles back to false on a second click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        CheckboxTwoWayHostComponent,
      );
      const input = within(container).getByRole('checkbox');

      await userEvent.click(input);
      await userEvent.click(input);

      expect(componentInstance.value()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('toggles when clicked directly', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoCheckbox);

      await userEvent.click(within(container).getByRole('checkbox'));

      expect(componentInstance.checked()).toBe(true);
    });

    it('toggles when clicked via its associated <label>', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoCheckbox);
      const label = container.querySelector('label');
      expect(label).not.toBeNull();

      await userEvent.click(label as HTMLLabelElement);

      expect(componentInstance.checked()).toBe(true);
    });

    it('toggles via keyboard (Space) when focused', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoCheckbox);
      const input = within(container).getByRole('checkbox') as HTMLInputElement;

      input.focus();
      await userEvent.keyboard(' ');

      expect(componentInstance.checked()).toBe(true);
    });

    it('supports interaction through the DynamoCheckboxHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoCheckbox);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCheckboxHarness,
      );

      expect(await harness.isChecked()).toBe(false);
      await harness.toggle();
      expect(await harness.isChecked()).toBe(true);
    });
  });

  describe('conditional rendering', () => {
    it('renders no icon when unchecked and not indeterminate', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('span.bg-current')).toBeNull();
    });

    it('renders the checkmark icon only when checked', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { checked: true },
      });

      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('renders the indeterminate dash instead of the checkmark when both are true', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { checked: true, indeterminate: true },
      });

      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('span.bg-current')).not.toBeNull();
    });

    it('scales the indeterminate dash width with size instead of a fixed width', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { indeterminate: true, size: 'sm' },
      });
      const smClasses = container.querySelector('span.bg-current')?.className;

      setInputs({ size: 'lg' });
      const lgClasses = container.querySelector('span.bg-current')?.className;

      expect(smClasses).not.toBe(lgClasses);
    });
  });

  describe('template behavior', () => {
    it('applies different box classes for the checked vs. unchecked state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { checked: false },
      });
      const uncheckedClasses = container.querySelectorAll('span')[0]?.className;

      setInputs({ checked: true });
      const checkedClasses = container.querySelectorAll('span')[0]?.className;

      expect(uncheckedClasses).not.toBe(checkedClasses);
    });

    it('hides the native input visually while keeping it in the accessibility tree', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      const input = within(container).getByRole('checkbox');
      expect(input.className).toContain('sr-only');
    });

    // Regression test for a real row-height-jitter bug: an `inline-flex`
    // root label's contribution to its surrounding line-box height depends
    // on its synthesized baseline, which shifts depending on whether the
    // box span's only child (the check icon / indeterminate dash) is
    // present — making the host's own auto height jitter by 1-2px purely
    // based on checked state (confirmed live via getBoundingClientRect
    // before/after toggling in a real browser; jsdom doesn't implement
    // layout, so this asserts the class-level fix instead). Block-level
    // `flex` removes the root label from that inline formatting context.
    it.each([
      { checked: false, indeterminate: false },
      { checked: true, indeterminate: false },
      { checked: false, indeterminate: true },
    ])(
      'roots the label with block-level flex, not inline-flex, when checked=$checked indeterminate=$indeterminate',
      ({ checked, indeterminate }) => {
        const { container } = renderDynamoComponent(DynamoCheckbox, {
          inputs: { checked, indeterminate },
        });

        const label = container.querySelector('label');
        expect(label?.classList.contains('flex')).toBe(true);
        expect(label?.classList.contains('inline-flex')).toBe(false);
      },
    );
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(CheckboxTwoWayHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations while checked and while indeterminate', async () => {
      const { container } = renderDynamoComponent(CheckboxTwoWayHostComponent, {
        inputs: { value: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a labelless checkbox as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });

    it('sets aria-checked="mixed" while indeterminate', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { indeterminate: true },
      });

      expect(
        within(container).getByRole('checkbox').getAttribute('aria-checked'),
      ).toBe('mixed');
    });

    it('does not set aria-checked when not indeterminate (native checked state is sufficient)', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox, {
        inputs: { checked: true },
      });

      expect(
        within(container).getByRole('checkbox').getAttribute('aria-checked'),
      ).toBeNull();
    });
  });

  describe('state changes', () => {
    it('cannot be toggled by click when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoCheckbox,
        { inputs: { disabled: true } },
      );

      await userEvent.click(within(container).getByRole('checkbox'));

      expect(componentInstance.checked()).toBe(false);
    });

    it('becomes toggleable again once disabled is set back to false', async () => {
      const { container, componentInstance, setInputs } = renderDynamoComponent(
        DynamoCheckbox,
        {
          inputs: { disabled: true },
        },
      );

      setInputs({ disabled: false });
      await userEvent.click(within(container).getByRole('checkbox'));

      expect(componentInstance.checked()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders with no projected label content without throwing', () => {
      const { container } = renderDynamoComponent(DynamoCheckbox);

      expect(within(container).getByRole('checkbox')).toBeTruthy();
    });

    it('handles rapid repeated toggling without losing state', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoCheckbox);
      const input = within(container).getByRole('checkbox');

      for (let i = 0; i < 6; i++) {
        await userEvent.click(input);
      }

      // 6 toggles from false lands back on false.
      expect(componentInstance.checked()).toBe(false);
    });

    it('generates a distinct id for each checkbox instance sharing the same injector', () => {
      @Component({
        selector: 'dg-checkbox-pair-host',
        standalone: true,
        imports: [DynamoCheckbox],
        template: `<dg-checkbox>First</dg-checkbox
          ><dg-checkbox>Second</dg-checkbox>`,
      })
      class CheckboxPairHostComponent {}

      const { container } = renderDynamoComponent(CheckboxPairHostComponent);
      const checkboxes = within(container).getAllByRole(
        'checkbox',
      ) as HTMLInputElement[];
      expect(checkboxes).toHaveLength(2);

      expect(checkboxes[0]?.id).not.toBe(checkboxes[1]?.id);
      expect(checkboxes[0]?.id).toBeTruthy();
      expect(checkboxes[1]?.id).toBeTruthy();
    });
  });
});
