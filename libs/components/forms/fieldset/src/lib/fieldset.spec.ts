import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoFieldset } from './fieldset';
import { DynamoFieldsetHarness } from './fieldset.harness';

@Component({
  selector: 'dg-fieldset-test-host',
  standalone: true,
  imports: [DynamoFieldset],
  template: `
    <dg-fieldset legend="Contact info" [collapsible]="true" [disabled]="disabled">
      <input type="text" placeholder="Name" />
    </dg-fieldset>
  `,
})
class FieldsetTestHostComponent {
  disabled = false;
}

describe('DynamoFieldset', () => {
  describe('creation', () => {
    it('renders a real <fieldset> and <legend>', () => {
      const { container } = renderDynamoComponent(DynamoFieldset, { inputs: { legend: 'Contact info' } });

      expect(container.querySelector('fieldset')).not.toBeNull();
      expect(container.querySelector('legend')?.textContent?.trim()).toBe('Contact info');
    });

    it('projects content inside the fieldset', () => {
      const { fixture } = renderDynamoComponent(FieldsetTestHostComponent);
      const container = fixture.nativeElement as HTMLElement;

      expect(container.querySelector('input[placeholder="Name"]')).not.toBeNull();
    });
  });

  describe('default behavior', () => {
    it('is expanded by default', () => {
      const { componentInstance } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info', collapsible: true },
      });

      expect(componentInstance.collapsed()).toBe(false);
    });

    it('does not render a toggle button when not collapsible', () => {
      const { container } = renderDynamoComponent(DynamoFieldset, { inputs: { legend: 'Contact info' } });

      expect(container.querySelector('[data-testid="dg-fieldset-toggle"]')).toBeNull();
    });
  });

  describe('collapsing', () => {
    it('collapses and expands on click, updating the two-way-bound collapsed model', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info', collapsible: true },
      });
      const toggle = within(container).getByRole('button');

      await userEvent.click(toggle);
      expect(componentInstance.collapsed()).toBe(true);

      await userEvent.click(toggle);
      expect(componentInstance.collapsed()).toBe(false);
    });
  });

  describe('native disabled cascade', () => {
    // jsdom does not implement the HTML spec's fieldset-disables-descendants
    // cascade (a known jsdom gap — verified live in a real browser instead,
    // same posture as this session's other jsdom gaps like execCommand and
    // window.prompt). What IS testable here is that the `disabled` input
    // correctly reflects onto the native <fieldset>'s own `disabled`
    // property — the cascade itself is then the browser's job, not ours.
    it('reflects the disabled input onto the native <fieldset> element', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info' },
      });
      const fieldsetEl = container.querySelector('fieldset') as HTMLFieldSetElement;
      expect(fieldsetEl.disabled).toBe(false);

      setInputs({ disabled: true });

      expect(fieldsetEl.disabled).toBe(true);
    });

    it('does not disable the toggle button inside the legend (native legend exclusion)', () => {
      const { fixture, componentInstance } = renderDynamoComponent(FieldsetTestHostComponent);
      componentInstance.disabled = true;
      fixture.detectChanges();
      const container = fixture.nativeElement as HTMLElement;

      const toggle = container.querySelector('[data-testid="dg-fieldset-toggle"]') as HTMLButtonElement;
      expect(toggle.disabled).toBe(false);
    });
  });

  describe('ARIA', () => {
    it('sets aria-expanded/aria-controls on the toggle button', () => {
      const { container } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info', collapsible: true },
      });
      const toggle = within(container).getByRole('button');
      const contentDiv = container.querySelector(`#${toggle.getAttribute('aria-controls')}`);

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(contentDiv).not.toBeNull();
    });

    it('does not add role=region to the content wrapper (native fieldset/legend already groups it)', () => {
      const { container } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info', collapsible: true },
      });

      expect(container.querySelector('[role="region"]')).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoFieldsetHarness', async () => {
      const { fixture } = renderDynamoComponent(FieldsetTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoFieldsetHarness);

      expect(await harness.getLegendText()).toBe('Contact info');
      expect(await harness.isCollapsed()).toBe(false);
      expect(await harness.isDisabled()).toBe(false);

      await harness.toggle();

      expect(await harness.isCollapsed()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when expanded', async () => {
      const { container } = renderDynamoComponent(DynamoFieldset, {
        inputs: { legend: 'Contact info', collapsible: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when disabled', async () => {
      const { fixture } = renderDynamoComponent(FieldsetTestHostComponent);
      fixture.componentInstance.disabled = true;
      fixture.detectChanges();
      await expect(expectNoA11yViolations(fixture.nativeElement)).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders no legend element when legend is empty and not collapsible', () => {
      const { container } = renderDynamoComponent(DynamoFieldset, { inputs: {} });

      expect(container.querySelector('legend')).toBeNull();
    });

    it('renders an empty collapsible content region without throwing', () => {
      expect(() => {
        renderDynamoComponent(DynamoFieldset, { inputs: { legend: 'Empty', collapsible: true } });
      }).not.toThrow();
    });
  });
});
