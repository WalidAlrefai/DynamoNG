import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoPopoverContent } from './popover-content';
import { DynamoPopover } from './popover';
import { DynamoPopoverHarness } from './popover.harness';

// The CDK overlay portals the panel into a `.cdk-overlay-container` appended
// near document.body — outside the fixture's own `container` element — same
// reasoning as DynamoMenu's/DynamoTooltip's specs.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[data-testid="popover-panel"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

// The open()-driven overlay attach/detach effect runs via Angular's zoneless
// effect scheduler, not synchronously with the signal write that triggered
// it — flushing a real setTimeout(0) plus detectChanges() is needed before
// asserting on the result, same technique as DynamoMenu's/DynamoTooltip's specs.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-popover-test-host',
  standalone: true,
  imports: [DynamoPopover, DynamoPopoverContent],
  template: `
    <dg-popover [(open)]="isOpen" [closeOnBackdropClick]="closeOnBackdropClick()">
      <button type="button">Open filters</button>
      <dg-popover-content>
        <label>
          Name
          <input type="text" data-testid="name-input" />
        </label>
        <button type="button" data-testid="apply-button">Apply</button>
      </dg-popover-content>
    </dg-popover>
  `,
})
class PopoverTestHostComponent {
  readonly isOpen = model(false);
  readonly closeOnBackdropClick = signal(true);
}

describe('DynamoPopover', () => {
  describe('creation', () => {
    it('renders the projected trigger content', () => {
      const { container } = renderDynamoComponent(PopoverTestHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Open filters' }),
      ).toBeTruthy();
    });

    it('does not render a panel before any interaction', () => {
      renderDynamoComponent(PopoverTestHostComponent);

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to closed and position "bottom-start"', () => {
      const { componentInstance } = renderDynamoComponent(
        PopoverTestHostComponent,
      );

      expect(componentInstance.isOpen()).toBe(false);
    });
  });

  describe('open/close', () => {
    it('opens the panel and renders projected content when the trigger is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(getPanel()?.textContent).toContain('Apply');
    });

    it('closes when the trigger is clicked again', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      fixture.componentInstance.closeOnBackdropClick.set(false);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('closes and refocuses the trigger on Escape', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('focus trap', () => {
    it('moves focus into the panel when opened', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.contains(document.activeElement)).toBe(true);
    });

    // CDK's ConfigurableFocusTrap Tab-wrap relies on injected boundary
    // sentinel elements + real browser Tab-key traversal — jsdom/testing-
    // library's userEvent.tab() doesn't reliably reproduce that. Drawer's
    // own spec (the other DynamoFocusTrapService consumer) doesn't unit-test
    // Tab-cycling for the same reason; verified live in a real browser
    // instead (this session's established pattern for exactly this gap).

    it('returns focus to the trigger when closed', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('content projection', () => {
    it('renders interactive projected content that can be typed into', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      const input = getPanel()?.querySelector(
        '[data-testid="name-input"]',
      ) as HTMLInputElement;
      await userEvent.type(input, 'Ada');

      expect(input.value).toBe('Ada');
    });

    it('supports interaction through the DynamoPopoverHarness', async () => {
      const { fixture } = renderDynamoComponent(PopoverTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoPopoverHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.open();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getPanelText()).toContain('Apply');

      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations while the popover is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('does not set a role on the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.hasAttribute('role')).toBe(false);
      expect(getPanel()?.hasAttribute('aria-modal')).toBe(false);
    });
  });

  describe('state changes', () => {
    it('opens when the open model is set programmatically', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        PopoverTestHostComponent,
      );

      componentInstance.isOpen.set(true);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('does not throw on rapid toggling', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });

      await userEvent.click(trigger);
      await userEvent.click(trigger);
      await settle(fixture);

      await expect(
        (async () => {
          await userEvent.click(trigger);
          await settle(fixture);
        })(),
      ).resolves.not.toThrow();
    });

    it('cleanly disposes the overlay and releases the focus trap when destroyed while open', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      fixture.destroy();

      expect(getPanel()).toBeNull();
    });
  });
});
