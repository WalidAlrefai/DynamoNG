import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoSwitch } from './switch';
import { DynamoSwitchHarness } from './switch.harness';

@Component({
  selector: 'dg-switch-two-way-host',
  standalone: true,
  imports: [DynamoSwitch],
  template: `<dg-switch [(checked)]="value">Enable notifications</dg-switch>`,
})
class SwitchTwoWayHostComponent {
  readonly value = model(false);
}

describe('DynamoSwitch', () => {
  describe('creation', () => {
    it('renders without errors with a native switch input', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(within(container).getByRole('switch')).toBeTruthy();
    });

    it('projects the content passed between the component tags as its label', () => {
      const { container } = renderDynamoComponent(SwitchTwoWayHostComponent);

      expect(container.textContent).toContain('Enable notifications');
    });

    it('associates the label with the input via a generated id', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      const input = within(container).getByRole('switch') as HTMLInputElement;
      const label = container.querySelector('label');
      expect(label?.getAttribute('for')).toBe(input.id);
    });
  });

  describe('default behavior', () => {
    it('defaults to unchecked', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(
        (within(container).getByRole('switch') as HTMLInputElement).checked,
      ).toBe(false);
    });

    it('defaults to not disabled', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(
        (within(container).getByRole('switch') as HTMLInputElement).disabled,
      ).toBe(false);
    });
  });

  describe('input properties', () => {
    it('reflects the checked input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoSwitch, {
        inputs: { checked: true },
      });

      expect(
        (within(container).getByRole('switch') as HTMLInputElement).checked,
      ).toBe(true);
    });

    it('reflects the disabled input onto the native input element', () => {
      const { container } = renderDynamoComponent(DynamoSwitch, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('switch') as HTMLInputElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoSwitch);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('output events', () => {
    it('updates a two-way-bound value when the switch is toggled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        SwitchTwoWayHostComponent,
      );
      expect(componentInstance.value()).toBe(false);

      await userEvent.click(within(container).getByRole('switch'));

      expect(componentInstance.value()).toBe(true);
    });

    it('toggles back to false on a second click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        SwitchTwoWayHostComponent,
      );
      const input = within(container).getByRole('switch');

      await userEvent.click(input);
      await userEvent.click(input);

      expect(componentInstance.value()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('toggles when clicked directly', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoSwitch);

      await userEvent.click(within(container).getByRole('switch'));

      expect(componentInstance.checked()).toBe(true);
    });

    it('toggles when clicked via its associated <label>', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoSwitch);
      const label = container.querySelector('label');
      expect(label).not.toBeNull();

      await userEvent.click(label as HTMLLabelElement);

      expect(componentInstance.checked()).toBe(true);
    });

    it('toggles via keyboard (Space) when focused', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoSwitch);
      const input = within(container).getByRole('switch') as HTMLInputElement;

      input.focus();
      await userEvent.keyboard(' ');

      expect(componentInstance.checked()).toBe(true);
    });

    it('supports interaction through the DynamoSwitchHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSwitch);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSwitchHarness,
      );

      expect(await harness.isChecked()).toBe(false);
      await harness.toggle();
      expect(await harness.isChecked()).toBe(true);
    });

    it('reports disabled state through the DynamoSwitchHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoSwitch, {
        inputs: { disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSwitchHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
    });
  });

  describe('template behavior', () => {
    it('applies different track classes for the checked vs. unchecked state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSwitch, {
        inputs: { checked: false },
      });
      const uncheckedClasses = container.querySelectorAll('span')[0]?.className;

      setInputs({ checked: true });
      const checkedClasses = container.querySelectorAll('span')[0]?.className;

      expect(uncheckedClasses).not.toBe(checkedClasses);
    });

    it('applies different thumb classes (slide position) for the checked vs. unchecked state', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoSwitch, {
        inputs: { checked: false },
      });
      const uncheckedClasses = container.querySelectorAll('span')[1]?.className;

      setInputs({ checked: true });
      const checkedClasses = container.querySelectorAll('span')[1]?.className;

      expect(uncheckedClasses).not.toBe(checkedClasses);
    });

    it('hides the native input visually while keeping it in the accessibility tree', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      const input = within(container).getByRole('switch');
      expect(input.className).toContain('sr-only');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(SwitchTwoWayHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations while checked', async () => {
      const { container } = renderDynamoComponent(SwitchTwoWayHostComponent, {
        inputs: { value: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a labelless switch as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoSwitch);
      await expect(expectNoA11yViolations(container)).rejects.toThrow(/label/i);
    });

    it('exposes role="switch" instead of the native checkbox role', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(within(container).getByRole('switch').getAttribute('role')).toBe(
        'switch',
      );
      expect(within(container).queryByRole('checkbox')).toBeNull();
    });

    it('reflects aria-checked="false" when unchecked', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(
        within(container).getByRole('switch').getAttribute('aria-checked'),
      ).toBe('false');
    });

    it('reflects aria-checked="true" when checked', () => {
      const { container } = renderDynamoComponent(DynamoSwitch, {
        inputs: { checked: true },
      });

      expect(
        within(container).getByRole('switch').getAttribute('aria-checked'),
      ).toBe('true');
    });
  });

  describe('state changes', () => {
    it('cannot be toggled by click when disabled', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoSwitch,
        { inputs: { disabled: true } },
      );

      await userEvent.click(within(container).getByRole('switch'));

      expect(componentInstance.checked()).toBe(false);
    });

    it('becomes toggleable again once disabled is set back to false', async () => {
      const { container, componentInstance, setInputs } = renderDynamoComponent(
        DynamoSwitch,
        {
          inputs: { disabled: true },
        },
      );

      setInputs({ disabled: false });
      await userEvent.click(within(container).getByRole('switch'));

      expect(componentInstance.checked()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('renders with no projected label content without throwing', () => {
      const { container } = renderDynamoComponent(DynamoSwitch);

      expect(within(container).getByRole('switch')).toBeTruthy();
    });

    it('handles rapid repeated toggling without losing state', async () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoSwitch);
      const input = within(container).getByRole('switch');

      for (let i = 0; i < 6; i++) {
        await userEvent.click(input);
      }

      // 6 toggles from false lands back on false.
      expect(componentInstance.checked()).toBe(false);
    });

    it('generates a distinct id for each switch instance sharing the same injector', () => {
      @Component({
        selector: 'dg-switch-pair-host',
        standalone: true,
        imports: [DynamoSwitch],
        template: `<dg-switch>First</dg-switch><dg-switch>Second</dg-switch>`,
      })
      class SwitchPairHostComponent {}

      const { container } = renderDynamoComponent(SwitchPairHostComponent);
      const switches = within(container).getAllByRole(
        'switch',
      ) as HTMLInputElement[];
      expect(switches).toHaveLength(2);

      expect(switches[0]?.id).not.toBe(switches[1]?.id);
      expect(switches[0]?.id).toBeTruthy();
      expect(switches[1]?.id).toBeTruthy();
    });
  });
});
