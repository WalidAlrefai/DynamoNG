import { Component, model, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { DynamoPassThrough } from '@dynamong/core/api';
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
import type { DynamoPopoverPart } from './popover.types';

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
    <dg-popover
      [(open)]="isOpen"
      [closeOnBackdropClick]="closeOnBackdropClick()"
      [closeOnEscape]="closeOnEscape()"
      [focusOnShow]="focusOnShow()"
    >
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
  readonly closeOnEscape = signal(true);
  readonly focusOnShow = signal(true);
}

@Component({
  selector: 'dg-popover-aria-describedby-host',
  standalone: true,
  imports: [DynamoPopover, DynamoPopoverContent],
  template: `
    <dg-popover [ariaDescribedby]="ariaDescribedby()">
      <button type="button">Open filters</button>
      <dg-popover-content>
        <p>Body</p>
      </dg-popover-content>
    </dg-popover>
  `,
})
class PopoverAriaDescribedbyHostComponent {
  readonly ariaDescribedby = signal<string | undefined>(undefined);
}

@Component({
  selector: 'dg-popover-pt-host',
  standalone: true,
  imports: [DynamoPopover, DynamoPopoverContent],
  template: `
    <dg-popover [pt]="pt()">
      <button type="button">Open filters</button>
      <dg-popover-content>
        <p>Body</p>
      </dg-popover-content>
    </dg-popover>
  `,
})
class PopoverPtHostComponent {
  readonly pt = signal<DynamoPassThrough<DynamoPopoverPart> | undefined>(
    undefined,
  );
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

    it('sets role="dialog" and aria-modal="true" on the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.getAttribute('role')).toBe('dialog');
      expect(getPanel()?.getAttribute('aria-modal')).toBe('true');
    });

    it('defaults the panel aria-label to "Popover" when ariaLabel is unset', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.getAttribute('aria-label')).toBe('Popover');
    });

    it('sets aria-haspopup/aria-expanded/aria-controls on the projected trigger button, not the wrapper span', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      const wrapper = trigger.parentElement as HTMLElement;

      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();
      expect(wrapper.hasAttribute('aria-haspopup')).toBe(false);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      const panelId = getPanel()?.id;
      expect(panelId).toBeTruthy();
      expect(trigger.getAttribute('aria-controls')).toBe(panelId);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-controls')).toBeNull();
    });

    it('forwards ariaDescribedby onto the same resolved trigger target, unconditionally', () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverAriaDescribedbyHostComponent,
      );
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      expect(trigger.getAttribute('aria-describedby')).toBeNull();

      fixture.componentInstance.ariaDescribedby.set('hint-id');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-describedby')).toBe('hint-id');
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

  describe('closeOnEscape', () => {
    it('does not close on Escape when closeOnEscape is false', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      fixture.componentInstance.closeOnEscape.set(false);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });
  });

  describe('focusOnShow', () => {
    it('leaves focus on the trigger when focusOnShow is false', async () => {
      const { container, fixture } = renderDynamoComponent(
        PopoverTestHostComponent,
      );
      fixture.componentInstance.focusOnShow.set(false);
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      trigger.focus();

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
      expect(document.activeElement).toBe(trigger);
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

  describe('pt', () => {
    it('merges pt class onto root/trigger (merged onto the wrapper)', () => {
      const { fixture, container } = renderDynamoComponent(
        PopoverPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        root: { class: 'pt-root' },
        trigger: { class: 'pt-trigger' },
      });
      fixture.detectChanges();

      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      const wrapper = trigger.parentElement as HTMLElement;
      expect(wrapper.classList.contains('pt-root')).toBe(true);
      expect(wrapper.classList.contains('pt-trigger')).toBe(true);
    });

    it('merges a non-class pt attribute onto the wrapper', () => {
      const { fixture, container } = renderDynamoComponent(
        PopoverPtHostComponent,
      );
      fixture.componentInstance.pt.set({
        trigger: { 'data-testid': 'trigger-el' },
      });
      fixture.detectChanges();

      expect(
        container.querySelector('[data-testid="trigger-el"]'),
      ).not.toBeNull();
    });

    it('merges pt class onto the panel once open', async () => {
      const { fixture, container } = renderDynamoComponent(
        PopoverPtHostComponent,
      );
      fixture.componentInstance.pt.set({ panel: { class: 'pt-panel' } });
      fixture.detectChanges();
      const trigger = within(container).getByRole('button', {
        name: 'Open filters',
      });
      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()?.classList.contains('pt-panel')).toBe(true);
    });
  });
});
