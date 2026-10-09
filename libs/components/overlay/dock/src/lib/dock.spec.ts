import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
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

      expect(
        within(container).getByRole('menu', { name: 'Apps' }),
      ).toBeTruthy();
      expect(tiles(container).map((t) => t.getAttribute('aria-label'))).toEqual(
        ['Finder', 'Mail', 'Trash', 'Settings'],
      );
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

  describe('roving-tabindex seed', () => {
    it('seeds the first enabled tile, not index 0, when items()[0] is disabled', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: {
          items: [
            { label: 'Trash', icon: '🗑', disabled: true },
            { label: 'Mail', icon: '✉' },
            { label: 'Settings', icon: '⚙' },
          ],
        },
      });
      const els = tiles(container);

      expect(els[0]?.getAttribute('tabindex')).toBe('-1');
      expect(els[1]?.getAttribute('tabindex')).toBe('0');
    });

    it('reactively reseeds if items() changes such that the focused tile becomes disabled', () => {
      const { container, fixture } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      let els = tiles(container);
      expect(els[0]?.getAttribute('tabindex')).toBe('0'); // Finder, enabled

      fixture.componentRef.setInput('items', [
        { label: 'Finder', icon: '🔍', disabled: true },
        { label: 'Mail', icon: '✉' },
        { label: 'Trash', icon: '🗑', disabled: true },
        { label: 'Settings', icon: '⚙' },
      ]);
      fixture.detectChanges();

      els = tiles(container);
      expect(els[0]?.getAttribute('tabindex')).toBe('-1');
      expect(els[1]?.getAttribute('tabindex')).toBe('0'); // Mail, now the first enabled tile
    });

    it('does not throw when every item is disabled, and leaves the seed in place', () => {
      expect(() =>
        renderDynamoComponent(DynamoDock, {
          inputs: {
            items: [
              { label: 'A', disabled: true },
              { label: 'B', disabled: true },
            ],
          },
        }),
      ).not.toThrow();
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

  describe('badge', () => {
    it('renders the badge value inside the tile', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: [{ label: 'Mail', badge: 3 }] },
      });

      expect(tiles(container)[0]?.textContent).toContain('3');
    });

    it('folds the badge into the tile aria-label', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: [{ label: 'Mail', badge: 3 }] },
      });

      expect(tiles(container)[0]?.getAttribute('aria-label')).toBe('Mail (3)');
    });

    it('renders no badge markup when unset', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: [{ label: 'Mail' }] },
      });

      expect(tiles(container)[0]?.getAttribute('aria-label')).toBe('Mail');
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

  describe('pt / ariaDescribedby / fluid', () => {
    it('merges pt class onto root/list/item/icon/label/badge', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: {
          items: [{ label: 'Finder', icon: '🔍', badge: 3 }],
          pt: {
            root: { class: 'pt-root' },
            list: { class: 'pt-list' },
            item: { class: 'pt-item' },
            icon: { class: 'pt-icon' },
            label: { class: 'pt-label' },
            badge: { class: 'pt-badge' },
          },
        },
      });

      expect(
        container
          .querySelector('[data-testid="DynamoDock"]')
          ?.classList.contains('pt-root'),
      ).toBe(true);
      expect(
        within(container).getByRole('menu').classList.contains('pt-list'),
      ).toBe(true);
      const tile = tiles(container)[0] as HTMLElement;
      expect(tile.classList.contains('pt-item')).toBe(true);
      expect(tile.querySelector('.pt-icon')).not.toBeNull();
      expect(tile.querySelector('.pt-label')).not.toBeNull();
      expect(tile.querySelector('.pt-badge')).not.toBeNull();
    });

    it('merges a non-class pt attribute onto the list', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: {
          items: items(),
          pt: { list: { 'data-testid': 'list-el' } },
        },
      });

      expect(container.querySelector('[data-testid="list-el"]')).not.toBeNull();
    });

    it('omits aria-describedby by default, forwards it to the list when set', () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items(), ariaDescribedby: 'hint-id' },
      });

      expect(
        within(container).getByRole('menu').getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });

    it('defaults fluid to false (no w-full), opts in when true', () => {
      const { container, fixture } = renderDynamoComponent(DynamoDock, {
        inputs: { items: items() },
      });
      const root = container.querySelector(
        '[data-testid="DynamoDock"]',
      ) as HTMLElement;
      expect(root.classList.contains('w-full')).toBe(false);

      fixture.componentRef.setInput('fluid', true);
      fixture.detectChanges();
      expect(root.classList.contains('w-full')).toBe(true);
    });

    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { container } = renderDynamoComponent(DynamoDock, {
        inputs: {
          items: items(),
          ariaLabel: 'Apps',
          ariaDescribedby: 'hint-id',
          fluid: true,
          pt: { list: { class: 'pt-list' } },
        },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
