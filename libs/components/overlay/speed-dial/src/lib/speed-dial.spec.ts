import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoSpeedDial } from './speed-dial';
import { DynamoSpeedDialHarness } from './speed-dial.harness';
import type { DynamoSpeedDialAction } from './speed-dial.types';

const editSpy = vi.fn();

function actions(): DynamoSpeedDialAction[] {
  return [
    { label: 'Edit', icon: 'E', command: editSpy },
    { label: 'Share', icon: 'S' },
    { label: 'Delete', icon: 'D', disabled: true },
  ];
}

function getTrigger(container: HTMLElement): HTMLButtonElement {
  return within(container).getByRole('button', {
    name: 'Speed dial',
  }) as HTMLButtonElement;
}

function getActionButtons(container: HTMLElement): HTMLButtonElement[] {
  return within(container).getAllByRole('menuitem') as HTMLButtonElement[];
}

describe('DynamoSpeedDial', () => {
  describe('creation', () => {
    it('renders a trigger and one button per action, collapsed by default', () => {
      const { container } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });

      const trigger = getTrigger(container);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(getActionButtons(container)).toHaveLength(3);
    });
  });

  describe('toggling', () => {
    it('opens and closes on trigger click, reflecting aria-expanded', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        { inputs: { actions: actions() } },
      );
      const trigger = getTrigger(container);

      await userEvent.click(trigger);
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(componentInstance.open()).toBe(true);

      await userEvent.click(trigger);
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('does not toggle when disabled', async () => {
      const { container } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions(), disabled: true },
      });
      const trigger = getTrigger(container);

      await userEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('honours an external [(open)] write', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        { inputs: { actions: actions() } },
      );
      componentInstance.open.set(true);
      fixture.detectChanges();
      expect(getTrigger(container).getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('actions', () => {
    it('running an action fires its command, emits actionSelect, and closes', async () => {
      editSpy.mockClear();
      const selectSpy = vi.fn();
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        { inputs: { actions: actions() } },
      );
      componentInstance.actionSelect.subscribe(selectSpy);

      await userEvent.click(getTrigger(container));
      fixture.detectChanges();
      await userEvent.click(
        getActionButtons(container).find(
          (b) => b.getAttribute('aria-label') === 'Edit',
        ) as HTMLButtonElement,
      );
      fixture.detectChanges();

      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(selectSpy).toHaveBeenCalledTimes(1);
      expect(getTrigger(container).getAttribute('aria-expanded')).toBe('false');
    });

    it('a disabled action does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      await userEvent.click(getTrigger(container));
      fixture.detectChanges();

      const del = getActionButtons(container).find(
        (b) => b.getAttribute('aria-label') === 'Delete',
      ) as HTMLButtonElement;
      expect(del.disabled).toBe(true);
    });
  });

  describe('layout', () => {
    it('applies a non-identity transform to each open action, and collapses them when closed', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        { inputs: { actions: actions(), type: 'linear', direction: 'up' } },
      );
      const buttons = getActionButtons(container);

      expect(buttons[0]?.style.transform).toContain('scale(0)');

      componentInstance.open.set(true);
      fixture.detectChanges();
      expect(buttons[0]?.style.transform).toContain('scale(1)');
      expect(buttons[0]?.style.transform).toContain('-56px');
    });
  });

  describe('keyboard', () => {
    it('ArrowUp/ArrowDown on the trigger open the dial and move focus across actions', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      const trigger = getTrigger(container);
      trigger.focus();

      await userEvent.keyboard('{ArrowUp}');
      fixture.detectChanges();
      const buttons = getActionButtons(container);
      expect(document.activeElement).toBe(buttons[0]); // Edit

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(buttons[1]); // Share

      await userEvent.keyboard('{ArrowDown}'); // skips disabled Delete, wraps
      expect(document.activeElement).toBe(buttons[0]);

      await userEvent.keyboard('{End}'); // last *enabled* action
      expect(document.activeElement).toBe(buttons[1]);

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('Escape closes and returns focus to the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      const trigger = getTrigger(container);
      trigger.focus();
      await userEvent.keyboard('{ArrowUp}');
      fixture.detectChanges();

      await userEvent.keyboard('{Escape}');
      fixture.detectChanges();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(trigger);
    });

    it('Enter on the trigger opens it and focuses the first enabled action', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      const trigger = getTrigger(container);
      trigger.focus();

      await userEvent.keyboard('{Enter}');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(getActionButtons(container)[0]);
    });

    it('Tab from an action closes the dial', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      const trigger = getTrigger(container);
      trigger.focus();
      await userEvent.keyboard('{ArrowUp}');
      fixture.detectChanges();

      await userEvent.keyboard('{Tab}');
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('openOnHover', () => {
    it('opens on trigger hover and closes shortly after the pointer leaves', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions(), openOnHover: true },
      });
      const trigger = getTrigger(container);

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 160));
      fixture.detectChanges();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('a move from the trigger onto the action list keeps it open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions(), openOnHover: true },
      });
      const trigger = getTrigger(container);
      const list = container.querySelector('ul[role="menu"]') as HTMLElement;

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      list.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 160));
      fixture.detectChanges();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('arc layout', () => {
    it('positions actions on an arc for the circular types', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        {
          inputs: {
            actions: actions(),
            type: 'circle',
            direction: 'right',
            radius: 100,
          },
        },
      );
      componentInstance.open.set(true);
      fixture.detectChanges();

      const first = getActionButtons(container)[0] as HTMLButtonElement;
      // direction "right" → first action sits straight right of the trigger.
      expect(first.style.transform).toContain('100px');
      expect(first.style.transform).toContain('scale(1)');
    });
  });

  describe('click outside', () => {
    it('closes when a click lands outside the widget', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      await userEvent.click(getTrigger(container));
      fixture.detectChanges();
      expect(getTrigger(container).getAttribute('aria-expanded')).toBe('true');

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      expect(getTrigger(container).getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('harness', () => {
    it('toggles, reads action labels, and clicks an action', async () => {
      editSpy.mockClear();
      const { fixture } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoSpeedDialHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.toggle();
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getActionLabels()).toEqual([
        'Edit',
        'Share',
        'Delete',
      ]);

      await harness.clickAction('Edit');
      expect(editSpy).toHaveBeenCalledTimes(1);
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoSpeedDial, {
        inputs: { actions: actions() },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoSpeedDial,
        { inputs: { actions: actions() } },
      );
      componentInstance.open.set(true);
      fixture.detectChanges();
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
