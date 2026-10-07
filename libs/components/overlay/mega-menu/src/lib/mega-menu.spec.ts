import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import type { Routes } from '@angular/router';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamoMegaMenu } from './mega-menu';
import { DynamoMegaMenuHarness } from './mega-menu.harness';
import type {
  DynamoMegaMenuItem,
  DynamoMegaMenuLinkEntry,
} from './mega-menu.types';

const openSpy = vi.fn();
const leafSpy = vi.fn();

const ITEMS: DynamoMegaMenuItem[] = [
  {
    label: 'Products',
    columns: [
      {
        header: 'Laptops',
        items: [
          { label: 'MacBook Air', command: openSpy },
          { label: 'MacBook Pro' },
          { label: 'Discontinued', disabled: true },
        ],
      },
      {
        header: 'Phones',
        items: [{ label: 'iPhone' }, { label: 'Android' }],
      },
    ],
  },
  {
    label: 'Services',
    columns: [
      {
        header: 'Support',
        items: [{ label: 'Warranty' }, { label: 'Repair' }],
      },
    ],
  },
  { label: 'About', command: leafSpy },
];

function getPanel(): HTMLElement | null {
  return document.body.querySelector('[data-testid="DynamoMegaMenu-panel"]');
}

function getDrawer(): HTMLElement | null {
  return document.body.querySelector('[data-testid="DynamoMegaMenu-drawer"]');
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

describe('DynamoMegaMenu', () => {
  describe('creation', () => {
    it('renders one bar button per item and no panel initially', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, ariaLabel: 'Main' },
      });

      expect(
        within(container).getByRole('menubar', { name: 'Main' }),
      ).toBeTruthy();
      expect(within(container).getAllByRole('menuitem')).toHaveLength(3);
      expect(getPanel()).toBeNull();
    });
  });

  describe('opening', () => {
    it('opens the matching multi-column panel on click', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });

      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      const panel = getPanel();
      expect(panel).not.toBeNull();
      expect(panel?.textContent).toContain('Laptops');
      expect(panel?.textContent).toContain('Phones');
      expect(panel?.textContent).toContain('MacBook Air');
    });

    it('a leaf item (no columns) fires its command and never opens a panel', async () => {
      leafSpy.mockClear();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });

      await userEvent.click(
        within(container).getAllByRole('menuitem')[2] as HTMLElement,
      );
      await settle(fixture);

      expect(leafSpy).toHaveBeenCalledTimes(1);
      expect(getPanel()).toBeNull();
    });

    it('clicking the open item again closes the panel', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const trigger = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;

      await userEvent.click(trigger);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('ArrowRight/ArrowLeft rove across the bar when closed', async () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement?.textContent).toContain('Services');

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement?.textContent).toContain('Products');
    });

    it('ArrowDown opens the panel, ArrowDown/ArrowUp move the active link, Enter fires it', async () => {
      openSpy.mockClear();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('{ArrowDown}'); // opens
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const combobox = within(container).getByRole('combobox');
      const activeId = () => combobox.getAttribute('aria-activedescendant');
      const firstActive = activeId();
      expect(firstActive).toBeTruthy();

      await userEvent.keyboard('{ArrowDown}');
      expect(activeId()).not.toBe(firstActive);

      await userEvent.keyboard('{ArrowUp}');
      expect(activeId()).toBe(firstActive);

      await userEvent.keyboard('{Enter}'); // fires "MacBook Air"
      await settle(fixture);
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(getPanel()).toBeNull();
    });

    it('Escape closes and returns focus to the bar item', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement?.textContent).toContain('Products');
    });

    it('ArrowRight while open switches to the next bar item and re-anchors the panel', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Warranty');
      expect(getPanel()?.textContent).not.toContain('Laptops');
    });
  });

  describe('hover', () => {
    it('hovering a sibling bar item while open switches the panel', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const items = within(container).getAllByRole('menuitem');
      await userEvent.click(items[0] as HTMLElement);
      await settle(fixture);

      within(container)
        .getByText('Services')
        .dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('Support');
    });

    it('hovering a link sets it as the active descendant; clicking it fires its command', async () => {
      openSpy.mockClear();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      const macAir = Array.from(
        getPanel()?.querySelectorAll('[role="menuitem"]') ?? [],
      ).find((el) => el.textContent?.trim() === 'MacBook Air') as HTMLElement;
      macAir.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-activedescendant'),
      ).toBe(macAir.id);

      await userEvent.click(macAir);
      await settle(fixture);
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(getPanel()).toBeNull();
    });
  });

  describe('more keyboard', () => {
    it('Home/End jump the active link to the first/last enabled link', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      const combobox = within(container).getByRole('combobox');
      const links = Array.from(
        getPanel()?.querySelectorAll('[role="menuitem"]') ?? [],
      );

      await userEvent.keyboard('{End}');
      expect(combobox.getAttribute('aria-activedescendant')).toBe(
        (links[links.length - 1] as HTMLElement).id,
      );

      await userEvent.keyboard('{Home}');
      expect(combobox.getAttribute('aria-activedescendant')).toBe(
        (links[0] as HTMLElement).id,
      );
    });

    it('ArrowDown skips a disabled link', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = MacBook Air
      await settle(fixture);
      const combobox = within(container).getByRole('combobox');

      await userEvent.keyboard('{ArrowDown}'); // MacBook Pro
      await userEvent.keyboard('{ArrowDown}'); // skips "Discontinued" → iPhone
      const activeText = getPanel()?.querySelector(
        `#${combobox.getAttribute('aria-activedescendant')}`,
      )?.textContent;
      expect(activeText?.trim()).toBe('iPhone');
    });

    it('Tab closes the panel without moving focus back to the item', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{Tab}');
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('honours an external [(openIndex)] write', async () => {
      const { fixture, componentInstance } = renderDynamoComponent(
        DynamoMegaMenu,
        { inputs: { items: ITEMS } },
      );

      componentInstance.openIndex.set(1);
      await settle(fixture);
      expect(getPanel()?.textContent).toContain('Support');

      componentInstance.openIndex.set(null);
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });
  });

  describe('harness', () => {
    it('reports labels, opens, reads columns/links, and closes', async () => {
      const { fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMegaMenuHarness,
      );

      expect(await harness.getRootItemLabels()).toEqual([
        'Products',
        'Services',
        'About',
      ]);
      expect(await harness.isOpen()).toBe(false);

      await harness.open('Products');
      await settle(fixture);
      expect(await harness.isOpen()).toBe(true);
      expect(await harness.getColumnHeaders()).toEqual(['Laptops', 'Phones']);
      expect(await harness.getLinkLabels()).toContain('iPhone');

      await harness.close();
      await settle(fixture);
      expect(await harness.isOpen()).toBe(false);
    });

    it('reports collapsed state and opens the drawer', async () => {
      // jsdom never fires a real ResizeObserver — stub it the same way the
      // 'collapse / drawer' describe block below does, inline here since
      // this is the only harness-specific test that needs it.
      function stubResizeObserver(): { trigger: (width: number) => void } {
        let callback: ((entries: ResizeObserverEntry[]) => void) | null = null;
        class FakeResizeObserver {
          constructor(cb: (entries: ResizeObserverEntry[]) => void) {
            callback = cb;
          }
          observe(): void {
            /* no-op */
          }
          unobserve(): void {
            /* no-op */
          }
          disconnect(): void {
            /* no-op */
          }
        }
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        return {
          trigger: (width: number) =>
            callback?.([{ contentRect: { width } } as ResizeObserverEntry]),
        };
      }
      const resizeObserver = stubResizeObserver();

      const { fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoMegaMenuHarness,
      );

      expect(await harness.isCollapsed()).toBe(false);
      resizeObserver.trigger(300);
      await settle(fixture);
      expect(await harness.isCollapsed()).toBe(true);

      await harness.openDrawer();
      await settle(fixture);
      expect(getDrawer()).not.toBeNull();

      vi.unstubAllGlobals();
    });
  });

  describe('orientation & disabled', () => {
    it('vertical orientation: ArrowDown/ArrowUp rove the bar, ArrowRight opens', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, orientation: 'vertical' },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement?.textContent).toContain('Services');
      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement?.textContent).toContain('Products');

      await userEvent.keyboard('{ArrowRight}'); // opens in vertical mode
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
    });

    it('skips a disabled bar item when roving, and ignores a click on it', async () => {
      leafSpy.mockClear();
      const items: DynamoMegaMenuItem[] = [
        { label: 'One', command: leafSpy },
        { label: 'Two (disabled)', disabled: true, command: leafSpy },
        { label: 'Three', columns: [{ items: [{ label: 'x' }] }] },
      ];
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items },
      });
      const buttons = within(container).getAllByRole('menuitem');
      (buttons[0] as HTMLElement).focus();

      await userEvent.keyboard('{ArrowRight}'); // skips "Two", lands on "Three"
      expect(document.activeElement?.textContent).toContain('Three');

      await userEvent.click(buttons[1] as HTMLElement); // disabled → no-op
      expect(leafSpy).not.toHaveBeenCalled();
    });

    it('clicking a disabled link is a no-op and leaves the panel open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      const disabled = Array.from(
        getPanel()?.querySelectorAll('[role="menuitem"]') ?? [],
      ).find((el) => el.textContent?.trim() === 'Discontinued') as HTMLElement;
      await userEvent.click(disabled);
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('ArrowUp at the first link is clamped (stays on the first link)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      const combobox = within(container).getByRole('combobox');
      const firstLinkId = (
        getPanel()?.querySelector('[role="menuitem"]') as HTMLElement
      ).id;

      await userEvent.keyboard('{ArrowUp}');
      expect(combobox.getAttribute('aria-activedescendant')).toBe(firstLinkId);
    });

    it('an unrelated key on the bar does nothing', async () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('a');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(first);
    });

    it('hovering a disabled sibling while open leaves the current panel', async () => {
      const items: DynamoMegaMenuItem[] = [
        { label: 'Alpha', columns: [{ items: [{ label: 'a1' }] }] },
        {
          label: 'Beta',
          disabled: true,
          columns: [{ items: [{ label: 'b1' }] }],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      within(container)
        .getByText('Beta')
        .dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(getPanel()?.textContent).toContain('a1');
    });

    it('switching (via ArrowRight) onto a leaf sibling closes the panel', async () => {
      const items: DynamoMegaMenuItem[] = [
        { label: 'Menu', columns: [{ items: [{ label: 'a' }] }] },
        { label: 'Leaf', command: leafSpy },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{ArrowRight}'); // onto "Leaf" (no columns)
      await settle(fixture);
      expect(getPanel()).toBeNull();
    });

    it('vertical+open: ArrowDown/ArrowUp switch to the sibling bar item (the orientation fix)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, orientation: 'vertical' },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('{ArrowRight}'); // opens Products' panel
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{ArrowDown}'); // switches to Services — matches what ArrowDown already meant while closed
      await settle(fixture);
      expect(document.activeElement?.textContent).toContain('Services');
      expect(getPanel()?.textContent).toContain('Warranty');

      await userEvent.keyboard('{ArrowUp}'); // switches back to Products
      await settle(fixture);
      expect(document.activeElement?.textContent).toContain('Products');
    });

    it('vertical+open: ArrowLeft/ArrowRight navigate panel content without switching or closing', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, orientation: 'vertical' },
      });
      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('{ArrowRight}'); // opens Products' panel
      await settle(fixture);
      const combobox = within(container).getByRole('combobox');
      const firstLinkId = (
        getPanel()?.querySelector('[role="menuitem"]') as HTMLElement
      ).id;
      expect(combobox.getAttribute('aria-activedescendant')).toBe(firstLinkId);

      await userEvent.keyboard('{ArrowRight}'); // moves within the panel, does not switch/close
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
      expect(document.activeElement?.textContent).toContain('Products');
      expect(combobox.getAttribute('aria-activedescendant')).not.toBe(
        firstLinkId,
      );

      await userEvent.keyboard('{ArrowLeft}'); // moves back
      await settle(fixture);
      expect(combobox.getAttribute('aria-activedescendant')).toBe(firstLinkId);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, ariaLabel: 'Main' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, ariaLabel: 'Main' },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('icon', () => {
    // A dedicated fixture, never reused by the exact `.textContent?.trim() ===
    // 'MacBook Air'`-style matches elsewhere in this file — an icon glyph
    // injected into an existing fixture item/link would break those.
    const ICON_ITEMS: DynamoMegaMenuItem[] = [
      {
        label: 'Iconed Bar Item',
        icon: '🛒',
        columns: [
          {
            items: [
              { label: 'Iconed Link', icon: '⭐' },
              { label: 'Plain Link' },
            ],
          },
        ],
      },
      {
        label: 'Plain Bar Item',
        columns: [{ items: [{ label: 'Only Link' }] }],
      },
    ];

    function findMenuitem(
      scope: ParentNode,
      textFragment: string,
    ): HTMLElement {
      const el = Array.from(scope.querySelectorAll('[role="menuitem"]')).find(
        (candidate) => candidate.textContent?.includes(textFragment),
      );
      if (!el)
        throw new Error(`No menuitem containing "${textFragment}" found`);
      return el as HTMLElement;
    }

    it('renders no icon span on a bar item or link with no icon (regression)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ICON_ITEMS },
      });
      const plainBarItem = findMenuitem(container, 'Plain Bar Item');
      expect(plainBarItem.querySelector('span[aria-hidden="true"]')).toBeNull();

      await userEvent.click(plainBarItem);
      await settle(fixture);
      const onlyLink = findMenuitem(getPanel() as HTMLElement, 'Only Link');
      expect(onlyLink.querySelector('span[aria-hidden="true"]')).toBeNull();
    });

    it("renders a bar item's icon glyph before its label", () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ICON_ITEMS },
      });

      const barItem = findMenuitem(container, 'Iconed Bar Item');
      expect(barItem.textContent).toContain('🛒');
      expect(barItem.textContent).toContain('Iconed Bar Item');
      expect(
        barItem.querySelector('span[aria-hidden="true"]')?.textContent,
      ).toBe('🛒');
    });

    it("renders a panel link's icon glyph before its label, without disturbing its own rendered text", async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ICON_ITEMS },
      });
      await userEvent.click(findMenuitem(container, 'Iconed Bar Item'));
      await settle(fixture);

      const iconedLink = findMenuitem(getPanel() as HTMLElement, 'Iconed Link');
      expect(iconedLink.textContent).toContain('⭐');
      expect(iconedLink.textContent).toContain('Iconed Link');
      expect(
        iconedLink.querySelector('span[aria-hidden="true"]')?.textContent,
      ).toBe('⭐');
    });

    it('has no axe violations with icons present', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ICON_ITEMS },
      });
      await userEvent.click(findMenuitem(container, 'Iconed Bar Item'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('separator', () => {
    const SEPARATOR_ITEMS: DynamoMegaMenuItem[] = [
      {
        label: 'Products',
        columns: [
          {
            items: [
              { label: 'New' } satisfies DynamoMegaMenuLinkEntry,
              { label: 'Open' } satisfies DynamoMegaMenuLinkEntry,
              { separator: true } satisfies DynamoMegaMenuLinkEntry,
              { label: 'Exit' } satisfies DynamoMegaMenuLinkEntry,
            ],
          },
        ],
      },
    ];

    it('renders a separator with role="separator", not role="menuitem"', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: SEPARATOR_ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      const panel = getPanel();
      expect(panel?.querySelectorAll('[role="separator"]')).toHaveLength(1);
      // 3 real links (New, Open, Exit) inside the panel — the separator
      // isn't counted among role="menuitem" rows. The bar's own "Products"
      // button is also role="menuitem"/"combobox", so scope to the panel.
      expect(panel?.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
    });

    it('keyboard nav skips the separator in both directions', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: SEPARATOR_ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;
      const combobox = within(container).getByRole('combobox');

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      const exitId = Array.from(
        panel.querySelectorAll('[role="menuitem"]'),
      ).find((el) => el.textContent?.trim() === 'Exit')?.id;
      expect(combobox.getAttribute('aria-activedescendant')).toBe(exitId);

      await userEvent.keyboard('{ArrowUp}');
      await settle(fixture);
      const openId = Array.from(
        panel.querySelectorAll('[role="menuitem"]'),
      ).find((el) => el.textContent?.trim() === 'Open')?.id;
      expect(combobox.getAttribute('aria-activedescendant')).toBe(openId);
    });

    it('clicking a separator is a no-op', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: SEPARATOR_ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const separator = getPanel()?.querySelector(
        '[role="separator"]',
      ) as HTMLElement;

      await userEvent.click(separator);
      await settle(fixture);

      // Still open — clicking a separator didn't commit/close anything.
      expect(getPanel()).not.toBeNull();
    });

    it('has no axe violations with a separator present', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: SEPARATOR_ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('pt passthrough', () => {
    it('merges pt class onto root/bar/start/end/item', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: {
          items: ITEMS,
          pt: {
            root: { class: 'pt-root' },
            bar: { class: 'pt-bar' },
            start: { class: 'pt-start' },
            end: { class: 'pt-end' },
            item: { class: 'pt-item' },
          },
        },
      });

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(container.querySelector('.pt-bar')).not.toBeNull();
      expect(container.querySelector('.pt-start')).not.toBeNull();
      expect(container.querySelector('.pt-end')).not.toBeNull();
      expect(container.querySelectorAll('.pt-item').length).toBeGreaterThan(1);
    });

    it('merges pt class onto panel/column/columnHeader/link once a panel is open', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: {
          items: ITEMS,
          pt: {
            panel: { class: 'pt-panel' },
            column: { class: 'pt-column' },
            columnHeader: { class: 'pt-column-header' },
            link: { class: 'pt-link' },
          },
        },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);

      const panel = getPanel();
      expect(panel?.classList.contains('pt-panel')).toBe(true);
      expect(panel?.querySelectorAll('.pt-column').length).toBeGreaterThan(1);
      expect(panel?.querySelector('.pt-column-header')).not.toBeNull();
      expect(panel?.querySelectorAll('.pt-link').length).toBeGreaterThan(1);
    });

    it('merges a non-class pt attribute onto the bar', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: {
          items: ITEMS,
          pt: { bar: { 'data-testid': 'bar-el' } },
        },
      });

      expect(container.querySelector('[data-testid="bar-el"]')).not.toBeNull();
    });
  });

  describe('ariaDescribedby / fluid', () => {
    it('is absent by default', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });

      expect(
        within(container).getByRole('menubar').getAttribute('aria-describedby'),
      ).toBeNull();
    });

    it('is forwarded to the bar when set', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, ariaDescribedby: 'hint-id' },
      });

      expect(
        within(container).getByRole('menubar').getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });

    it('defaults fluid to true (w-full) in horizontal orientation', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });

      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('switches to no width class when fluid is false (horizontal)', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, fluid: false },
      });

      const rootClass = container.querySelector('div')?.className ?? '';
      expect(rootClass).not.toContain('w-full');
    });

    it('vertical orientation keeps its own intrinsic width regardless of fluid', () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, orientation: 'vertical', fluid: false },
      });

      expect(container.querySelector('div')?.className).toContain('w-56');
    });

    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: {
          items: ITEMS,
          ariaLabel: 'Main',
          ariaDescribedby: 'hint-id',
          fluid: false,
          pt: { root: { class: 'pt-root' } },
        },
      });

      await expectNoA11yViolations(container);
    });
  });

  describe('visible / shortcut / badge', () => {
    it('hides a visible:false bar item and excludes it from keyboard roving', async () => {
      const VISIBLE_ITEMS: DynamoMegaMenuItem[] = [
        { label: 'One' },
        { label: 'Hidden', visible: false },
        { label: 'Three' },
      ];
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: VISIBLE_ITEMS },
      });

      // Hidden via [hidden] (display:none) — not exposed to the a11y tree,
      // so getAllByRole naturally excludes it.
      expect(within(container).getAllByRole('menuitem')).toHaveLength(2);

      const first = within(container).getAllByRole(
        'menuitem',
      )[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement?.textContent).toContain('Three');
    });

    it('omits a visible:false link from render AND keyboard nav', async () => {
      const ITEMS_WITH_HIDDEN_LINK: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                { label: 'New' } satisfies DynamoMegaMenuLinkEntry,
                {
                  label: 'Hidden',
                  visible: false,
                } satisfies DynamoMegaMenuLinkEntry,
                { label: 'Exit' } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS_WITH_HIDDEN_LINK },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      // No DOM node at all for the hidden link — true omission.
      expect(panel.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
      expect(
        Array.from(panel.querySelectorAll('[role="menuitem"]')).some(
          (el) => el.textContent?.trim() === 'Hidden',
        ),
      ).toBe(false);

      // ArrowDown from the seeded "New" skips straight to "Exit".
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      const combobox = within(container).getByRole('combobox');
      const exitId = Array.from(
        panel.querySelectorAll('[role="menuitem"]'),
      ).find((el) => el.textContent?.trim() === 'Exit')?.id;
      expect(combobox.getAttribute('aria-activedescendant')).toBe(exitId);
    });

    it('renders a shortcut as aria-hidden trailing text', async () => {
      const ITEMS_WITH_SHORTCUT: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                {
                  label: 'Save',
                  shortcut: '⌘S',
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS_WITH_SHORTCUT },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      const shortcutEl = Array.from(panel.querySelectorAll('span')).find(
        (el) => el.textContent?.trim() === '⌘S' && el.children.length === 0,
      );
      expect(shortcutEl).toBeTruthy();
      expect(shortcutEl?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders a badge via dg-badge for both string and number values', async () => {
      const ITEMS_WITH_BADGE: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                { label: 'Inbox', badge: 3 } satisfies DynamoMegaMenuLinkEntry,
                {
                  label: 'Drafts',
                  badge: 'New',
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS_WITH_BADGE },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;
      const badges = Array.from(panel.querySelectorAll('dg-badge')).map((el) =>
        el.textContent?.trim(),
      );

      expect(badges).toEqual(['3', 'New']);
    });

    it('has no axe violations with visible/shortcut/badge set', async () => {
      const ITEMS_WITH_ALL: DynamoMegaMenuItem[] = [
        { label: 'One' },
        { label: 'Hidden', visible: false },
        {
          label: 'Products',
          columns: [
            {
              items: [
                {
                  label: 'Save',
                  shortcut: '⌘S',
                  badge: 2,
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS_WITH_ALL },
      });

      // Closed-bar state first — validates the visible:false bar item.
      await expectNoA11yViolations(container);

      const productsButton = Array.from(
        within(container).getAllByRole('menuitem'),
      ).find((el) => el.textContent?.trim() === 'Products') as HTMLElement;
      await userEvent.click(productsButton);
      await settle(fixture);

      // Scoped to the overlay panel, not `container` — same precedent as
      // the 'separator' describe block's own axe test: while a panel is
      // open, the bar item that owns it has role="combobox" (not a
      // menuitem-family role), which is a known, pre-existing,
      // already-accepted aria-required-children false positive on the bar
      // itself, unrelated to this round's visible/shortcut/badge fields.
      await expectNoA11yViolations(
        document.body.querySelector('.cdk-overlay-container') as HTMLElement,
      );
    });
  });

  describe('custom item/link template', () => {
    const TEMPLATE_ITEMS: DynamoMegaMenuItem[] = [
      {
        label: 'Products',
        columns: [{ items: [{ label: 'MacBook Air' }] }],
      },
      { label: 'Pricing' },
    ];

    @Component({
      selector: 'dg-mega-menu-template-host',
      standalone: true,
      imports: [DynamoMegaMenu],
      template: `
        <dg-mega-menu [items]="items" ariaLabel="Main">
          <ng-template #itemTemplate let-item>
            <span data-testid="custom-item">{{ item.label }} (custom)</span>
          </ng-template>
          <ng-template #linkTemplate let-link>
            <span data-testid="custom-link">{{ link.label }} (custom)</span>
          </ng-template>
        </dg-mega-menu>
      `,
    })
    class MegaMenuTemplateHostComponent {
      readonly items = TEMPLATE_ITEMS;
    }

    it('renders the custom item template on the bar instead of the plain label', () => {
      const { container } = renderDynamoComponent(
        MegaMenuTemplateHostComponent,
      );

      const customItems = within(container).getAllByTestId('custom-item');
      expect(customItems.map((el) => el.textContent?.trim())).toEqual([
        'Products (custom)',
        'Pricing (custom)',
      ]);
    });

    it('renders the custom link template inside an open panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        MegaMenuTemplateHostComponent,
      );
      await userEvent.click(within(container).getByText('Products (custom)'));
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      expect(within(panel).getByTestId('custom-link').textContent?.trim()).toBe(
        'MacBook Air (custom)',
      );
    });

    it('falls back to the plain label when no template is projected', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: TEMPLATE_ITEMS },
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      expect(within(panel).getByText('MacBook Air')).toBeTruthy();
      expect(container.querySelector('[data-testid="custom-item"]')).toBeNull();
      expect(panel.querySelector('[data-testid="custom-link"]')).toBeNull();
    });
  });

  describe('routerLink', () => {
    const commandSpy = vi.fn();
    // A wildcard catch-all route so Router.navigateByUrl() (triggered by
    // RouterLink's own click handling) resolves instead of rejecting with
    // "Cannot match any routes" — we only care about the generated href and
    // our own side effects, never about what the route actually renders.
    @Component({ selector: 'dg-blank-test', template: '', standalone: true })
    class BlankRouteComponent {}
    const TEST_ROUTES: Routes = [
      { path: '**', component: BlankRouteComponent },
    ];

    it('renders a leaf bar item with routerLink as a real <a> with the router-generated href', () => {
      const ROUTER_ITEMS: DynamoMegaMenuItem[] = [
        { label: 'Docs', routerLink: '/components/badge' },
      ];
      const { container } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ROUTER_ITEMS },
        providers: [provideRouter(TEST_ROUTES)],
      });

      const link = container.querySelector(
        '[role="menubar"] a[role="menuitem"]',
      );
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/components/badge');
    });

    it('renders a leaf link with routerLink as a real <a> with the router-generated href', async () => {
      const ROUTER_ITEMS: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                {
                  label: 'Docs',
                  routerLink: '/components/badge',
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ROUTER_ITEMS },
        providers: [provideRouter(TEST_ROUTES)],
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      const link = panel.querySelector('a[role="menuitem"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBe('/components/badge');
    });

    it('fires both linkSelect/command and closes on link click, alongside navigation', async () => {
      commandSpy.mockClear();
      const ROUTER_ITEMS: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                {
                  label: 'Docs',
                  routerLink: '/components/badge',
                  command: commandSpy,
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ROUTER_ITEMS },
        providers: [provideRouter(TEST_ROUTES)],
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const link = getPanel()?.querySelector(
        'a[role="menuitem"]',
      ) as HTMLElement;

      await userEvent.click(link);
      await settle(fixture);

      expect(commandSpy).toHaveBeenCalledOnce();
      expect(getPanel()).toBeNull();
    });

    it('renders a disabled routerLink link with no href (inert)', async () => {
      const ROUTER_ITEMS: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          columns: [
            {
              items: [
                {
                  label: 'Docs',
                  routerLink: '/components/badge',
                  disabled: true,
                } satisfies DynamoMegaMenuLinkEntry,
              ],
            },
          ],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ROUTER_ITEMS },
        providers: [provideRouter(TEST_ROUTES)],
      });
      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;

      const link = panel.querySelector('a[role="menuitem"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute('href')).toBeNull();
    });

    it('a bar item with columns and routerLink both set still opens its panel as a <button>, never an <a>', async () => {
      const ROUTER_ITEMS: DynamoMegaMenuItem[] = [
        {
          label: 'Products',
          routerLink: '/components/badge',
          columns: [{ items: [{ label: 'MacBook Air' }] }],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ROUTER_ITEMS },
        providers: [provideRouter(TEST_ROUTES)],
      });

      const barItem = container.querySelector('[role="menubar"] > *');
      expect(barItem?.tagName).toBe('BUTTON');

      await userEvent.click(barItem as HTMLElement);
      await settle(fixture);
      expect(getPanel()).not.toBeNull();
    });

    it('an item/link with only command (no routerLink) is unaffected, still plain elements', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });

      expect(
        within(container).getByText('About').closest('[role="menuitem"]')
          ?.tagName,
      ).toBe('BUTTON');

      await userEvent.click(
        within(container).getAllByRole('menuitem')[0] as HTMLElement,
      );
      await settle(fixture);
      const panel = getPanel() as HTMLElement;
      expect(
        within(panel).getByText('MacBook Air').closest('[role="menuitem"]')
          ?.tagName,
      ).toBe('DIV');
    });
  });

  describe('collapse / drawer', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    // jsdom never fires a real ResizeObserver, so this stubs the global
    // class, captures its constructor callback, and exposes a trigger(width)
    // that invokes it with a fake entries array — same technique as
    // Menubar's own collapse/drawer tests, adapted to pass the width through
    // the `entries[0].contentRect.width` argument the way mega-menu.ts's own
    // callback actually reads it.
    function stubResizeObserver(): { trigger: (width: number) => void } {
      let callback: ((entries: ResizeObserverEntry[]) => void) | null = null;
      class FakeResizeObserver {
        constructor(cb: (entries: ResizeObserverEntry[]) => void) {
          callback = cb;
        }
        observe(): void {
          /* no-op */
        }
        unobserve(): void {
          /* no-op */
        }
        disconnect(): void {
          /* no-op */
        }
      }
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);
      return {
        trigger: (width: number) =>
          callback?.([{ contentRect: { width } } as ResizeObserverEntry]),
      };
    }

    // Not a role-based query — the hamburger's own role swaps between
    // "menuitem"/"combobox" (same pattern as every bar item), never the
    // implicit "button" role.
    function getHamburger(container: HTMLElement): HTMLElement {
      const el = container.querySelector('[role="menubar"] > button');
      if (!el) throw new Error('No hamburger trigger found');
      return el as HTMLElement;
    }

    it('collapses below the breakpoint, rendering the hamburger instead of bar items', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      expect(getHamburger(container)).toBeTruthy();
      expect(
        container.querySelectorAll('[role="menubar"] > button'),
      ).toHaveLength(1);
    });

    it('stays expanded at or above the breakpoint', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(500);
      await settle(fixture);

      expect(within(container).getByText('Products')).toBeTruthy();
      expect(
        container.querySelectorAll('[role="menubar"] > button'),
      ).toHaveLength(3);
    });

    it('never collapses when collapseBreakpoint is unset (null), regardless of width', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS },
      });
      await settle(fixture);
      resizeObserver.trigger(50);
      await settle(fixture);

      expect(
        container.querySelectorAll('[role="menubar"] > button'),
      ).toHaveLength(3);
    });

    it('opens the drawer via the hamburger and shows the full item list', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      await userEvent.click(getHamburger(container));
      await settle(fixture);
      const drawer = getDrawer() as HTMLElement;

      expect(within(drawer).getByText('Products')).toBeTruthy();
      expect(within(drawer).getByText('Services')).toBeTruthy();
      expect(within(drawer).getByText('About')).toBeTruthy();
    });

    it("opens a branch item's own mega panel from within the drawer", async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      await userEvent.click(getHamburger(container));
      await settle(fixture);
      const drawer = getDrawer() as HTMLElement;
      await userEvent.click(within(drawer).getByText('Products'));
      await settle(fixture);

      const panel = getPanel();
      expect(panel).not.toBeNull();
      expect(
        within(panel as HTMLElement).getByText('MacBook Air'),
      ).toBeTruthy();
      // The drawer itself stays open behind the panel.
      expect(getDrawer()).not.toBeNull();
    });

    it('commits a leaf row inside the drawer, closing it and refocusing the hamburger', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      const hamburger = getHamburger(container);
      await userEvent.click(hamburger);
      await settle(fixture);
      const drawer = getDrawer() as HTMLElement;

      leafSpy.mockClear();
      await userEvent.click(within(drawer).getByText('About'));
      await settle(fixture);

      expect(leafSpy).toHaveBeenCalledOnce();
      expect(getDrawer()).toBeNull();
      expect(document.activeElement).toBe(hamburger);
    });

    it('Escape closes the drawer (and any open panel) and refocuses the hamburger', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      const hamburger = getHamburger(container);
      await userEvent.click(hamburger);
      await settle(fixture);
      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getDrawer()).toBeNull();
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(hamburger);
    });

    it('ArrowDown/ArrowRight navigate and open a branch within the drawer via keyboard', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      const hamburger = getHamburger(container);
      await userEvent.click(hamburger);
      await settle(fixture);
      // Seeded active is "Products" (first enabled drawer item).
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      const panel = getPanel();
      expect(panel).not.toBeNull();
      expect(
        within(panel as HTMLElement).getByText('MacBook Air'),
      ).toBeTruthy();
    });

    it('End jumps to the last enabled drawer item, skipping none here (no disabled top-level items)', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      const hamburger = getHamburger(container);
      await userEvent.click(hamburger);
      await settle(fixture);
      await userEvent.keyboard('{End}');
      await settle(fixture);

      const drawer = getDrawer() as HTMLElement;
      const aboutId = within(drawer)
        .getByText('About')
        .closest('[role="menuitem"]')?.id;
      expect(hamburger.getAttribute('aria-activedescendant')).toBe(aboutId);

      await userEvent.keyboard('{Home}');
      await settle(fixture);
      const productsId = within(drawer)
        .getByText('Products')
        .closest('[role="menuitem"]')?.id;
      expect(hamburger.getAttribute('aria-activedescendant')).toBe(productsId);
    });

    it('closes the drawer when clicking the backdrop', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      await userEvent.click(getHamburger(container));
      await settle(fixture);
      expect(getDrawer()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getDrawer()).toBeNull();
    });

    it('skips a disabled top-level item when navigating the drawer', async () => {
      const resizeObserver = stubResizeObserver();
      const ITEMS_WITH_DISABLED: DynamoMegaMenuItem[] = [
        { label: 'Products', columns: [{ items: [{ label: 'x' }] }] },
        { label: 'Disabled', disabled: true },
        { label: 'About' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS_WITH_DISABLED, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      const hamburger = getHamburger(container);
      await userEvent.click(hamburger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      const drawer = getDrawer() as HTMLElement;
      const aboutId = within(drawer)
        .getByText('About')
        .closest('[role="menuitem"]')?.id;
      expect(hamburger.getAttribute('aria-activedescendant')).toBe(aboutId);
    });

    it('has no axe violations when collapsed, both closed and with the drawer open', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, collapseBreakpoint: 400 },
      });
      await settle(fixture);
      resizeObserver.trigger(300);
      await settle(fixture);

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();

      await userEvent.click(getHamburger(container));
      await settle(fixture);

      // Scoped to the overlay container once the drawer is open — same
      // precedent as every other open-state axe test in this file: the
      // hamburger's role temporarily becomes "combobox" while its own
      // drawer is open, a known, pre-existing, already-accepted
      // aria-required-children false positive (no sibling "menuitem"-role
      // child left to satisfy the rule once the bar's one and only child
      // becomes "combobox").
      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
