import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoStep } from './step';
import { DynamoStepper } from './stepper';
import { DynamoStepperHarness } from './stepper.harness';

@Component({
  selector: 'dg-stepper-test-host',
  standalone: true,
  imports: [DynamoStepper, DynamoStep],
  template: `
    <dg-stepper
      [(value)]="active"
      ariaLabel="Checkout"
      (finish)="finished.set(true)"
    >
      <dg-step value="account" label="Account">
        <p data-testid="account-marker">Account content</p>
      </dg-step>
      <dg-step
        value="preferences"
        label="Preferences"
        [disabled]="preferencesDisabled()"
      >
        <p data-testid="preferences-marker">Preferences content</p>
      </dg-step>
      <dg-step value="confirm" label="Confirm">
        <p data-testid="confirm-marker">Confirm content</p>
      </dg-step>
    </dg-stepper>
  `,
})
class StepperTestHostComponent {
  readonly active = model<string | undefined>(undefined);
  readonly preferencesDisabled = signal(false);
  readonly finished = signal(false);
}

@Component({
  selector: 'dg-stepper-single-host',
  standalone: true,
  imports: [DynamoStepper, DynamoStep],
  template: `
    <dg-stepper>
      <dg-step value="only" label="Only">Only content</dg-step>
    </dg-stepper>
  `,
})
class StepperSingleHostComponent {}

function stepButton(container: HTMLElement, name: string): HTMLElement {
  return within(container).getByRole('button', { name });
}

describe('DynamoStepper', () => {
  describe('creation', () => {
    it('renders a nav with one button per projected dg-step, plus Back/Next controls', () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);

      expect(within(container).getByRole('navigation')).toBeTruthy();
      expect(stepButton(container, 'Account')).toBeTruthy();
      expect(stepButton(container, 'Preferences')).toBeTruthy();
      expect(stepButton(container, 'Confirm')).toBeTruthy();
      expect(stepButton(container, 'Back')).toBeTruthy();
      expect(stepButton(container, 'Next')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('activates the first step when no value is bound', () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );

      expect(stepButton(container, 'Account').getAttribute('aria-current')).toBe(
        'step',
      );
      expect(componentInstance.active()).toBe('account');
    });

    it('disables Back on the first step', () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);

      expect(stepButton(container, 'Back').hasAttribute('disabled')).toBe(true);
    });
  });

  describe('step indicator rendering', () => {
    it('shows a number for active/upcoming steps and a checkmark for completed ones', async () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);

      expect(stepButton(container, 'Account').textContent).toContain('1');
      expect(stepButton(container, 'Confirm').textContent).toContain('3');

      await userEvent.click(stepButton(container, 'Next'));

      // Account is now completed — its circle no longer shows "1".
      expect(stepButton(container, 'Account').textContent).not.toContain('1');
    });

    it('reflects aria-current="step" on exactly one step at a time', async () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);

      await userEvent.click(stepButton(container, 'Next'));

      const current = [
        stepButton(container, 'Account'),
        stepButton(container, 'Preferences'),
        stepButton(container, 'Confirm'),
      ].filter((button) => button.getAttribute('aria-current') === 'step');
      expect(current).toHaveLength(1);
      expect(current[0]?.textContent).toContain('Preferences');
    });
  });

  describe('Back/Next navigation', () => {
    it('advances to the next step and updates the two-way-bound value', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );

      await userEvent.click(stepButton(container, 'Next'));

      expect(componentInstance.active()).toBe('preferences');
    });

    it('moves back to the previous step', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      await userEvent.click(stepButton(container, 'Next'));

      await userEvent.click(stepButton(container, 'Back'));

      expect(componentInstance.active()).toBe('account');
    });

    it('relabels Next to Finish on the last step and emits finish instead of advancing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      await userEvent.click(stepButton(container, 'Next'));
      await userEvent.click(stepButton(container, 'Next'));
      expect(componentInstance.active()).toBe('confirm');

      await userEvent.click(stepButton(container, 'Finish'));

      expect(componentInstance.finished()).toBe(true);
      expect(componentInstance.active()).toBe('confirm');
    });

    it('skips a disabled step when advancing with Next', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      fixture.componentInstance.preferencesDisabled.set(true);
      fixture.detectChanges();

      await userEvent.click(stepButton(container, 'Next'));

      expect(componentInstance.active()).toBe('confirm');
    });

    it('skips a disabled step when moving back with Back', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      fixture.componentInstance.preferencesDisabled.set(true);
      fixture.detectChanges();
      await userEvent.click(stepButton(container, 'Next')); // -> confirm (skipping preferences)

      await userEvent.click(stepButton(container, 'Back'));

      expect(componentInstance.active()).toBe('account');
    });
  });

  describe('click-to-jump (linear gate)', () => {
    it('jumps back to a completed step when clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      await userEvent.click(stepButton(container, 'Next'));
      await userEvent.click(stepButton(container, 'Next'));
      expect(componentInstance.active()).toBe('confirm');

      await userEvent.click(stepButton(container, 'Account'));

      expect(componentInstance.active()).toBe('account');
    });

    it('does nothing when clicking an upcoming (not-yet-reached) step', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );

      await userEvent.click(stepButton(container, 'Confirm'));

      expect(componentInstance.active()).toBe('account');
    });

    it('does nothing when clicking a disabled step, regardless of position', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      fixture.componentInstance.preferencesDisabled.set(true);
      fixture.detectChanges();
      await userEvent.click(stepButton(container, 'Next')); // -> confirm

      await userEvent.click(stepButton(container, 'Preferences'));

      expect(componentInstance.active()).toBe('confirm');
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus across every step with ArrowRight/ArrowLeft, including upcoming ones, without activating', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      stepButton(container, 'Account').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(stepButton(container, 'Preferences'));
      expect(componentInstance.active()).toBe('account');
    });

    it('wraps ArrowRight from the last step to the first', async () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);
      stepButton(container, 'Confirm').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(stepButton(container, 'Account'));
    });

    it('jumps to the first/last step on Home/End', async () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);
      stepButton(container, 'Preferences').focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(stepButton(container, 'Confirm'));

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(stepButton(container, 'Account'));
    });

    it('skips disabled steps during Arrow/Home/End navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      fixture.componentInstance.preferencesDisabled.set(true);
      fixture.detectChanges();
      stepButton(container, 'Account').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(stepButton(container, 'Confirm'));
    });

    it('activates a focused completed/active step on Enter', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      await userEvent.click(stepButton(container, 'Next'));
      stepButton(container, 'Account').focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance.active()).toBe('account');
    });

    it('does nothing when Enter is pressed on a focused upcoming step', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      stepButton(container, 'Confirm').focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance.active()).toBe('account');
    });

    it('supports interaction through the DynamoStepperHarness', async () => {
      const { fixture } = renderDynamoComponent(StepperTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoStepperHarness,
      );

      expect(await harness.getActiveStepLabel()).toBe('Account');
      await harness.clickNext();
      expect(await harness.getActiveStepLabel()).toBe('Preferences');
      await harness.clickBack();
      expect(await harness.getActiveStepLabel()).toBe('Account');
    });
  });

  describe('conditional rendering', () => {
    it('does not render an inactive step panel content until first activated', () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);

      expect(container.textContent).not.toContain('Preferences content');
    });

    it('preserves panel DOM identity across navigating away and back', async () => {
      const { container } = renderDynamoComponent(StepperTestHostComponent);
      await userEvent.click(stepButton(container, 'Next'));
      const marker = container.querySelector(
        '[data-testid="preferences-marker"]',
      );
      expect(marker).toBeTruthy();

      await userEvent.click(stepButton(container, 'Next'));
      await userEvent.click(stepButton(container, 'Preferences'));

      expect(
        container.querySelector('[data-testid="preferences-marker"]'),
      ).toBe(marker);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with a mix of completed/active/upcoming/disabled steps', async () => {
      const { container, fixture } = renderDynamoComponent(
        StepperTestHostComponent,
      );
      fixture.componentInstance.preferencesDisabled.set(true);
      fixture.detectChanges();
      await userEvent.click(stepButton(container, 'Next'));
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('shows Finish immediately and disables Back for a single-step stepper', () => {
      const { container } = renderDynamoComponent(StepperSingleHostComponent);

      expect(stepButton(container, 'Only')).toBeTruthy();
      expect(stepButton(container, 'Finish')).toBeTruthy();
      expect(stepButton(container, 'Back').hasAttribute('disabled')).toBe(true);
    });

    it('does not throw when navigating a single-step stepper', async () => {
      const { container } = renderDynamoComponent(StepperSingleHostComponent);
      stepButton(container, 'Only').focus();

      await expect(userEvent.keyboard('{ArrowRight}')).resolves.not.toThrow();
    });
  });
});
