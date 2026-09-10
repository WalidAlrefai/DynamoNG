import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoDock } from './dock';
import { DynamoDockHarness } from './dock.harness';
import type { DynamoDockItem } from './dock.types';

const finderSpy = vi.fn();

function items(): DynamoDockItem[] {
  return [
    { label: 'Finder', icon: '🔍', command: finderSpy },
    { label: 'Mail', icon: '✉' },
    { label: 'Trash', icon: '🗑', disabled: true },
    { label: 'Settings', icon: '⚙' },
  ];
}

function tiles(container: HTMLElement): HTMLElement[] {
  return within(container).getAllByRole('menuitem');
}

describe('DynamoDock', () => {
  describe('creation', () => {
    it('renders one role="menuitem" per item, in order', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), ariaLabel: 'Apps' },
      });

      expect(within(container).getByRole('menu', { name: 'Apps' })).toBeTruthy();
      expect(tiles(container).map((t) => t.getAttribute('aria-label'))).toEqual([
        'Finder',
        'Mail',
        'Trash',
        'Settings',
      ]);
    });
  });

  describe('activation', () => {
    it('click runs the item command', async () => {
      finderSpy.mockClear();
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });

      await userEvent.click(tiles(container)[0] as HTMLElement);
      expect(finderSpy).toHaveBeenCalledTimes(1);
    });

    it('a disabled item is inert', async () => {
      const spy = vi.fn();
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: {
          items: [{ label: 'X', disabled: true, command: spy }],
        },
      });

      await userEvent.click(tiles(container)[0] as HTMLElement);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('ArrowRight/ArrowLeft rove focus, skipping disabled, and wrap', async () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      const els = tiles(container);
      (els[0] as HTMLElement).focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(els[1]); // Mail

      await userEvent.keyboard('{ArrowRight}'); // skips disabled Trash → Settings
      expect(document.activeElement).toBe(els[3]);

      await userEvent.keyboard('{ArrowRight}'); // wraps → Finder
      expect(document.activeElement).toBe(els[0]);

      await userEvent.keyboard('{ArrowLeft}'); // wraps back → Settings
      expect(document.activeElement).toBe(els[3]);
    });

    it('Home/End jump to the first/last enabled item; Enter runs it', async () => {
      finderSpy.mockClear();
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      const els = tiles(container);
      (els[3] as HTMLElement).focus();

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(els[0]);

      await userEvent.keyboard('{Enter}');
      expect(finderSpy).toHaveBeenCalledTimes(1);

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(els[3]);
    });

    it('vertical position uses ArrowDown/ArrowUp', async () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), position: 'left' },
      });
      const els = tiles(container);
      (els[0] as HTMLElement).focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(els[1]);
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(els[0]);
    });
  });

  describe('magnification', () => {
    it('scales a tile toward the pointer and resets on mouse-leave', () => {
      const { container, fixture } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      const list = within(container).getByRole('menu');
      const first = tiles(container)[0] as HTMLElement;

      // jsdom rects are all-zero, so a pointer at x=0 sits exactly on every
      // tile's centre → proximity 1 → scale === magnificationScale default.
      list.dispatchEvent(
        new MouseEvent('mousemove', { bubbles: true, clientX: 0 }),
      );
      fixture.detectChanges();
      expect(first.style.transform).toBe('scale(1.600)');

      list.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      fixture.detectChanges();
      expect(first.style.transform).toBe('scale(1)');
    });

    it('magnification=false keeps every tile at scale(1) on pointer move', () => {
      const { container, fixture } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), magnification: false },
      });
      within(container)
        .getByRole('menu')
        .dispatchEvent(
          new MouseEvent('mousemove', { bubbles: true, clientX: 0 }),
        );
      fixture.detectChanges();
      expect(
        tiles(container).every((t) => t.style.transform === 'scale(1)'),
      ).toBe(true);
    });
  });

  describe('harness', () => {
    it('reads labels, clicks, and reports disabled state', async () => {
      finderSpy.mockClear();
      const { fixture } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoDockHarness,
      );

      expect(await harness.getItemLabels()).toEqual([
        'Finder',
        'Mail',
        'Trash',
        'Settings',
      ]);
      expect(await harness.isDisabled('Trash')).toBe(true);

      await harness.clickItem('Finder');
      expect(finderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations (bottom)', async () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), ariaLabel: 'Apps' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations (left/vertical)', async () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), ariaLabel: 'Apps', position: 'left' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
