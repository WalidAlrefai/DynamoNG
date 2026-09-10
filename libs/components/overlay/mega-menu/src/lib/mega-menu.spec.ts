import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoMegaMenu } from './mega-menu';
import { DynamoMegaMenuHarness } from './mega-menu.harness';
import type { DynamoMegaMenuItem } from './mega-menu.types';

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
      { header: 'Support', items: [{ label: 'Warranty' }, { label: 'Repair' }] },
    ],
  },
  { label: 'About', command: leafSpy },
];

function getPanel(): HTMLElement | null {
  return document.body.querySelector('[data-testid="DynamoMegaMenu-panel"]');
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

      expect(within(container).getByRole('menubar', { name: 'Main' })).toBeTruthy();
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
      const trigger = within(container).getAllByRole('menuitem')[0] as HTMLElement;

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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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

      (within(container).getByText('Services')).dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
  });

  describe('orientation & disabled', () => {
    it('vertical orientation: ArrowDown/ArrowUp rove the bar, ArrowRight opens', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMegaMenu, {
        inputs: { items: ITEMS, orientation: 'vertical' },
      });
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
      first.focus();

      await userEvent.keyboard('a');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(first);
    });

    it('hovering a disabled sibling while open leaves the current panel', async () => {
      const items: DynamoMegaMenuItem[] = [
        { label: 'Alpha', columns: [{ items: [{ label: 'a1' }] }] },
        { label: 'Beta', disabled: true, columns: [{ items: [{ label: 'b1' }] }] },
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
      const first = within(container).getAllByRole('menuitem')[0] as HTMLElement;
      first.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      await userEvent.keyboard('{ArrowRight}'); // onto "Leaf" (no columns)
      await settle(fixture);
      expect(getPanel()).toBeNull();
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
});
