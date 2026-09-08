import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoPanel } from './panel';
import { DynamoPanelHarness } from './panel.harness';

@Component({
  selector: 'dg-panel-test-host',
  standalone: true,
  imports: [DynamoPanel],
  template: `
    <dg-panel header="Details" [collapsible]="true">
      <p data-testid="panel-body">Body content</p>
    </dg-panel>
  `,
})
class PanelTestHostComponent {}

describe('DynamoPanel', () => {
  describe('creation', () => {
    it('renders the header text and projected content', () => {
      const { container } = renderDynamoComponent(DynamoPanel, { inputs: { header: 'Details' } });

      expect(container.textContent).toContain('Details');
    });
  });

  describe('default behavior', () => {
    it('is expanded by default', () => {
      const { componentInstance } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true },
      });

      expect(componentInstance.collapsed()).toBe(false);
    });

    it('does not render a toggle button when not collapsible', () => {
      const { container } = renderDynamoComponent(DynamoPanel, { inputs: { header: 'Details' } });

      expect(container.querySelector('button[aria-expanded]')).toBeNull();
    });
  });

  describe('collapsing', () => {
    it('collapses and expands on click, updating the two-way-bound collapsed model', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true },
      });
      const toggle = within(container).getByRole('button');

      await userEvent.click(toggle);
      expect(componentInstance.collapsed()).toBe(true);

      await userEvent.click(toggle);
      expect(componentInstance.collapsed()).toBe(false);
    });

    it('collapses on Enter and Space (native button semantics)', async () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true },
      });
      within(container).getByRole('button').focus();

      await userEvent.keyboard('{Enter}');
      expect(componentInstance.collapsed()).toBe(true);

      await userEvent.keyboard(' ');
      expect(componentInstance.collapsed()).toBe(false);
    });

    it('keeps content visible in the DOM when not collapsible, ignoring the collapsed input', () => {
      const { container } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsed: true },
      });

      expect(container.querySelector('[role="region"]')?.textContent).toBeDefined();
    });
  });

  describe('ARIA', () => {
    it('sets aria-expanded/aria-controls on the toggle and role=region/aria-labelledby on the content', () => {
      const { container } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true },
      });
      const toggle = within(container).getByRole('button');
      const region = container.querySelector('[role="region"]') as HTMLElement;

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.getAttribute('aria-controls')).toBe(region.id);
      expect(region.getAttribute('aria-labelledby')).toBe(toggle.id);
    });

    it('flips aria-expanded to false when collapsed', () => {
      const { container } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true, collapsed: true },
      });

      expect(within(container).getByRole('button').getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('input properties', () => {
    it('accepts every documented variant without throwing', () => {
      const { componentInstance, setInputs } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details' },
      });

      for (const variant of ['elevated', 'outlined', 'filled'] as const) {
        setInputs({ variant });
        expect(componentInstance.variant()).toBe(variant);
      }
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoPanelHarness', async () => {
      const { fixture } = renderDynamoComponent(PanelTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoPanelHarness);

      expect(await harness.getHeaderText()).toBe('Details');
      expect(await harness.isCollapsed()).toBe(false);

      await harness.toggle();

      expect(await harness.isCollapsed()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when expanded', async () => {
      const { container } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when collapsed', async () => {
      const { container } = renderDynamoComponent(DynamoPanel, {
        inputs: { header: 'Details', collapsible: true, collapsed: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('renders nothing for the header block when there is no header and it is not collapsible', () => {
      const { container } = renderDynamoComponent(DynamoPanel, { inputs: {} });

      expect(container.querySelector('[data-testid="dg-panel-header"]')).toBeNull();
    });
  });
});
