import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { DynamoToggleButton } from './toggle-button';
import { DynamoToggleButtonHarness } from './toggle-button.harness';

@Component({
  selector: 'dg-toggle-button-two-way-host',
  standalone: true,
  imports: [DynamoToggleButton],
  template: `<dg-toggle-button [(pressed)]="value">Bold</dg-toggle-button>`,
})
class ToggleButtonTwoWayHostComponent {
  readonly value = model(false);
}

describe('DynamoToggleButton', () => {
  describe('creation', () => {
    it('renders projected content inside a native button', () => {
      const { container } = renderDynamoComponent(DynamoToggleButton);

      const button = within(container).getByRole('button');
      expect(button).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to unpressed', () => {
      const { container } = renderDynamoComponent(DynamoToggleButton);

      expect(
        within(container).getByRole('button').getAttribute('aria-pressed'),
      ).toBe('false');
    });
  });

  describe('user interactions', () => {
    it('clicking toggles pressed true, then false, then true again', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoToggleButton,
      );
      const button = within(container).getByRole('button');

      button.click();
      fixture.detectChanges();
      expect(componentInstance.pressed()).toBe(true);
      expect(button.getAttribute('aria-pressed')).toBe('true');

      button.click();
      fixture.detectChanges();
      expect(componentInstance.pressed()).toBe(false);
      expect(button.getAttribute('aria-pressed')).toBe('false');

      button.click();
      fixture.detectChanges();
      expect(componentInstance.pressed()).toBe(true);
    });

    it('updates a two-way-bound value when clicked', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ToggleButtonTwoWayHostComponent,
      );
      expect(componentInstance.value()).toBe(false);

      within(container).getByRole('button').click();
      fixture.detectChanges();

      expect(componentInstance.value()).toBe(true);
    });

    it('does not toggle when disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoToggleButton,
        { inputs: { disabled: true } },
      );

      (within(container).getByRole('button') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(componentInstance.pressed()).toBe(false);
    });

    it('supports interaction through the DynamoToggleButtonHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoToggleButton);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoToggleButtonHarness,
      );

      expect(await harness.isPressed()).toBe(false);
      await harness.click();
      fixture.detectChanges();
      expect(await harness.isPressed()).toBe(true);
    });

    it('reports disabled state through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoToggleButton, {
        inputs: { disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoToggleButtonHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
    });
  });

  describe('template behavior', () => {
    it('renders solid + the configured severity when pressed', () => {
      const { fixture, container } = renderDynamoComponent(
        DynamoToggleButton,
        { inputs: { severity: 'danger' } },
      );

      within(container).getByRole('button').click();
      fixture.detectChanges();

      const className = within(container).getByRole('button').className;
      expect(className).toContain('danger');
    });

    it('always renders a neutral (secondary/outline) style when unpressed, regardless of severity', () => {
      const { container } = renderDynamoComponent(DynamoToggleButton, {
        inputs: { severity: 'danger' },
      });

      const className = within(container).getByRole('button').className;
      expect(className).not.toContain('danger');
    });

    it('reserves the same border width pressed and unpressed, only making it transparent when pressed', () => {
      // Regression test: pressed uses variant="solid" (no border from
      // DynamoButton itself) while unpressed uses variant="outline" (a real
      // 1px border) — without a same-width transparent border when pressed,
      // toggling visibly shrinks/grows the button (same bug as Select
      // Button's segments).
      const { fixture, container } = renderDynamoComponent(DynamoToggleButton);
      const button = within(container).getByRole('button');

      expect(button.className).toContain('border-secondary');

      button.click();
      fixture.detectChanges();

      expect(button.className).toContain('border');
      expect(button.className).toContain('border-transparent');
    });
  });

  describe('input properties', () => {
    it('reflects the disabled input onto the native button', () => {
      const { container } = renderDynamoComponent(DynamoToggleButton, {
        inputs: { disabled: true },
      });

      expect(
        (within(container).getByRole('button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(
        DynamoToggleButton,
      );

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with visible text content, pressed and unpressed', async () => {
      const { fixture, container } = renderDynamoComponent(
        ToggleButtonTwoWayHostComponent,
      );

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();

      within(container).getByRole('button').click();
      fixture.detectChanges();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('flags a nameless toggle as an accessibility violation (sanity check on the test helper itself)', async () => {
      const { container } = renderDynamoComponent(DynamoToggleButton);

      await expect(expectNoA11yViolations(container)).rejects.toThrow(/name/i);
    });

    it('has no axe violations for an icon-only toggle given an ariaLabel', async () => {
      const { container } = renderDynamoComponent(DynamoToggleButton, {
        inputs: { ariaLabel: 'Bold' },
      });

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
