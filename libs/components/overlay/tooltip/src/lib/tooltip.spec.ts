import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoTooltip } from './tooltip';
import { DynamoTooltipHarness } from './tooltip.harness';

// The CDK overlay portals `role="tooltip"` content into a `.cdk-overlay-container`
// appended near document.body — outside the fixture's own `container` element — so
// every panel assertion below queries `document.body`, not `within(container)` like
// every other component's spec. `container` is only used for trigger-element checks.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="tooltip"]');
}

function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

function getTrigger(container: HTMLElement): HTMLElement {
  return container.querySelector('span') as HTMLElement;
}

// The show/hide timers run via a plain `setTimeout`, outside any Angular-tracked
// call stack — flushing that timer (a real setTimeout(0)) doesn't by itself
// guarantee Angular's zoneless scheduler has re-rendered the template yet, so an
// explicit `detectChanges()` is needed before asserting on template-bound DOM
// (e.g. `[attr.aria-describedby]`). Imperative CDK state (`getPanel()`) doesn't
// need this — overlay attach/detach happens synchronously, independent of
// Angular's own change-detection cycle.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-tooltip-trigger-host',
  standalone: true,
  imports: [DynamoTooltip],
  template: `
    <dg-tooltip content="Saves your changes" [showDelay]="0" [hideDelay]="0">
      <button type="button">Trigger</button>
    </dg-tooltip>
  `,
})
class TooltipTriggerHostComponent {}

describe('DynamoTooltip', () => {
  describe('creation', () => {
    it('renders the projected trigger content', () => {
      const { container } = renderDynamoComponent(TooltipTriggerHostComponent);

      expect(
        within(container).getByRole('button', { name: 'Trigger' }),
      ).toBeTruthy();
    });

    it('does not render a tooltip panel before any interaction', () => {
      renderDynamoComponent(DynamoTooltip, { inputs: { content: 'Hint' } });

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('defaults to position "top", showDelay 300, hideDelay 0, trigger "both", not disabled', () => {
      const { componentInstance } = renderDynamoComponent(DynamoTooltip);

      expect(componentInstance.position()).toBe('top');
      expect(componentInstance.showDelay()).toBe(300);
      expect(componentInstance.hideDelay()).toBe(0);
      expect(componentInstance.trigger()).toBe('both');
      expect(componentInstance.disabled()).toBe(false);
    });
  });

  describe('input properties', () => {
    it('shows the content text once visible', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Saves your changes', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Saves your changes');
    });

    it('accepts every documented position without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoTooltip);

      for (const position of ['top', 'bottom', 'left', 'right'] as const) {
        setInputs({ position });
        expect(componentInstance.position()).toBe(position);
      }
    });

    it('never shows a panel when content is empty', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('never shows a panel when disabled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', disabled: true, showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });
  });

  describe('user interactions', () => {
    it('shows on mouseenter after showDelay elapses', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', trigger: 'hover', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('cancels a pending show if mouseleave fires before showDelay elapses', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', trigger: 'hover', showDelay: 50 },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 80));
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
    });

    it('hides on mouseleave once visible', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: {
          content: 'Hint',
          trigger: 'hover',
          showDelay: 0,
          hideDelay: 0,
        },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('does not show on mouseenter when trigger is "focus"', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', trigger: 'focus', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('does not show on focusin when trigger is "hover"', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', trigger: 'hover', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new FocusEvent('focusin', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('shows on focusin and hides immediately on focusout, ignoring hideDelay', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: {
          content: 'Hint',
          trigger: 'focus',
          showDelay: 0,
          hideDelay: 1000,
        },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('hides on Escape while visible', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0 },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('does not attach the overlay twice when shown twice in a row', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0 },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(document.body.querySelectorAll('[role="tooltip"]')).toHaveLength(
        1,
      );
    });

    it('supports interaction through the DynamoTooltipHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Harness hint', showDelay: 0 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTooltipHarness,
      );

      expect(await harness.isVisible()).toBe(false);
      await harness.show();
      await settle(fixture);
      expect(await harness.isVisible()).toBe(true);
      expect(await harness.getPanelText()).toBe('Harness hint');
    });
  });

  describe('conditional rendering', () => {
    it('only mounts the panel element while visible', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0, hideDelay: 0 },
      });
      const trigger = getTrigger(container);

      expect(getPanel()).toBeNull();
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('renders an aria-hidden arrow element inside the panel', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getPanel()?.querySelector('[aria-hidden="true"]')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('sets aria-describedby on the trigger only while visible', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0, hideDelay: 0 },
      });
      const trigger = getTrigger(container);

      expect(trigger.getAttribute('aria-describedby')).toBeNull();

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(trigger.getAttribute('aria-describedby')).toBe(getPanel()?.id);

      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await settle(fixture);
      expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });

    it('has no axe violations on the tooltip panel while visible', async () => {
      const { container, fixture } = renderDynamoComponent(
        TooltipTriggerHostComponent,
      );

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getOverlayContainer()),
      ).resolves.toBeUndefined();
    });

    it('shows via keyboard focus alone, satisfying WCAG 1.4.13', async () => {
      const { container, fixture } = renderDynamoComponent(
        TooltipTriggerHostComponent,
      );

      await userEvent.tab();

      expect(document.activeElement).toBe(
        within(container).getByRole('button', { name: 'Trigger' }),
      );
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
    });
  });

  describe('state changes', () => {
    it('force-hides when disabled becomes true while visible', async () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        DynamoTooltip,
        {
          inputs: { content: 'Hint', showDelay: 0 },
        },
      );
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      setInputs({ disabled: true });
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('updates the arrow position class when the position input changes while visible', async () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        DynamoTooltip,
        {
          inputs: { content: 'Hint', showDelay: 0, position: 'top' },
        },
      );
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      const arrowBefore = getPanel()?.querySelector(
        '[aria-hidden="true"]',
      )?.className;

      setInputs({ position: 'left' });
      await settle(fixture);
      const arrowAfter = getPanel()?.querySelector(
        '[aria-hidden="true"]',
      )?.className;

      expect(arrowAfter).not.toBe(arrowBefore);
    });
  });

  describe('edge cases', () => {
    it('handles rapid mouseenter/mouseleave toggling without leaving a stray panel attached', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 20, hideDelay: 0 },
      });
      const trigger = getTrigger(container);

      for (let i = 0; i < 5; i++) {
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
    });

    it('disposes the overlay and removes the panel from the DOM when destroyed while visible', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoTooltip, {
        inputs: { content: 'Hint', showDelay: 0 },
      });

      getTrigger(container).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      fixture.destroy();

      expect(getPanel()).toBeNull();
    });
  });
});
