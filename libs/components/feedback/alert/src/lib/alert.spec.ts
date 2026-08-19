import { Component, input, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoSeverity } from '@dynamong/core/api';
import { describe, expect, it } from 'vitest';
import { DynamoAlert } from './alert';
import { DynamoAlertHarness } from './alert.harness';

@Component({
  selector: 'dg-alert-test-host',
  standalone: true,
  imports: [DynamoAlert],
  template: `<dg-alert
    [severity]="severity()"
    [title]="title()"
    [closable]="closable()"
    [(visible)]="visible"
    >{{ message() }}</dg-alert
  >`,
})
class AlertTestHostComponent {
  readonly severity = input<DynamoSeverity>('info');
  readonly title = input<string | undefined>(undefined);
  readonly closable = input(false);
  readonly message = input('Something happened.');
  readonly visible = model(true);
}

describe('DynamoAlert', () => {
  describe('creation', () => {
    it('renders projected content', () => {
      const { container } = renderDynamoComponent(AlertTestHostComponent);

      expect(container.textContent).toContain('Something happened.');
    });

    it('renders with role="alert"', () => {
      const { container } = renderDynamoComponent(DynamoAlert);

      expect(container.querySelector('[role="alert"]')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults severity to "info", closable to false, visible to true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoAlert);

      expect(componentInstance.severity()).toBe('info');
      expect(componentInstance.closable()).toBe(false);
      expect(componentInstance.visible()).toBe(true);
    });

    it('reflects the info default as info border classes', () => {
      const { container } = renderDynamoComponent(DynamoAlert);

      const root = container.querySelector('[role="alert"]');
      expect(root?.className).toContain('border-info');
    });

    it('renders no title and no close button by default', () => {
      const { container } = renderDynamoComponent(DynamoAlert);

      expect(container.querySelector('p')).toBeNull();
      expect(container.querySelector('button')).toBeNull();
    });
  });

  describe('input properties', () => {
    it.each([
      'primary',
      'secondary',
      'success',
      'info',
      'warning',
      'danger',
    ] as const)('applies border classes for severity "%s"', (severity) => {
      const { container } = renderDynamoComponent(AlertTestHostComponent, {
        inputs: { severity },
      });

      const root = container.querySelector('[role="alert"]');
      expect(root?.className).toContain(`border-${severity}`);
    });

    it('renders the title text when set', () => {
      const { container } = renderDynamoComponent(AlertTestHostComponent, {
        inputs: { title: 'Heads up' },
      });

      expect(container.querySelector('p')?.textContent).toBe('Heads up');
    });
  });

  describe('output events', () => {
    it('sets visible to false via the [(visible)] model when dismissed', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        AlertTestHostComponent,
        { inputs: { closable: true } },
      );
      const closeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      closeButton.click();
      fixture.detectChanges();

      expect(componentInstance.visible()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('removes the alert from the DOM when the close button is clicked', () => {
      const { container, fixture } = renderDynamoComponent(
        AlertTestHostComponent,
        { inputs: { closable: true } },
      );
      const closeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      closeButton.click();
      fixture.detectChanges();

      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('conditional rendering', () => {
    it('renders a close button only when closable is true', () => {
      const { container } = renderDynamoComponent(DynamoAlert, {
        inputs: { closable: true },
      });

      expect(container.querySelector('button')).not.toBeNull();
    });

    it('renders nothing when visible is set to false', () => {
      const { container } = renderDynamoComponent(DynamoAlert, {
        inputs: { visible: false },
      });

      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('template behavior', () => {
    it('skips all built-in classes when unstyled is true, keeping only styleClass', () => {
      const { container } = renderDynamoComponent(DynamoAlert, {
        inputs: { unstyled: true, styleClass: 'custom-alert' },
      });

      expect(container.querySelector('[role="alert"]')?.className).toBe(
        'custom-alert',
      );
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { fixture } = renderDynamoComponent(DynamoAlert);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with a title and close button', async () => {
      const { fixture } = renderDynamoComponent(AlertTestHostComponent, {
        inputs: { title: 'Heads up', closable: true },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('reappears when visible is set back to true', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        DynamoAlert,
        { inputs: { visible: false } },
      );
      expect(container.querySelector('[role="alert"]')).toBeNull();

      setInputs({ visible: true });
      fixture.detectChanges();

      expect(container.querySelector('[role="alert"]')).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('does not throw when rendered with no projected content', () => {
      expect(() => renderDynamoComponent(DynamoAlert)).not.toThrow();
    });

    it('does not throw on repeated dismiss clicks', () => {
      const { container, fixture } = renderDynamoComponent(
        AlertTestHostComponent,
        { inputs: { closable: true } },
      );
      const closeButton = container.querySelector(
        'button',
      ) as HTMLButtonElement;

      closeButton.click();
      fixture.detectChanges();

      expect(() => {
        closeButton.click();
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('harness', () => {
    it('reads visibility and text through the DynamoAlertHarness', async () => {
      const { fixture } = renderDynamoComponent(AlertTestHostComponent, {
        inputs: { title: 'Heads up', message: 'Body text' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoAlertHarness,
      );

      expect(await harness.isVisible()).toBe(true);
      expect(await harness.getText()).toContain('Body text');
    });

    it('dismisses the alert through the harness', async () => {
      const { fixture } = renderDynamoComponent(AlertTestHostComponent, {
        inputs: { closable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoAlertHarness,
      );

      await harness.dismiss();
      fixture.detectChanges();

      expect(await harness.isVisible()).toBe(false);
    });
  });
});
