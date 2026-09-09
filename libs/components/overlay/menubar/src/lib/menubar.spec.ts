import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoMenubar } from './menubar';
import { DynamoMenubarHarness } from './menubar.harness';
import type { DynamoMenubarItem } from './menubar.types';

// File (branch, 3 levels deep via New) / Edit (branch, 1 level) / Settings
// (disabled branch, at the bar level) / Help (leaf, no children — commits
// directly from the bar) covers every shape a top-level item can take.
const ITEMS: DynamoMenubarItem[] = [
  {
    label: 'File',
    children: [
      { label: 'New', children: [{ label: 'Document' }, { label: 'Spreadsheet' }] },
      { label: 'Export', children: [{ label: 'PDF' }, { label: 'CSV' }] },
      { label: 'Import', disabled: true, children: [{ label: 'From URL' }] },
      { label: 'Print' },
      { label: 'Locked', disabled: true },
    ],
  },
  {
    label: 'Edit',
    children: [{ label: 'Undo' }, { label: 'Redo' }],
  },
  {
    label: 'Settings',
    disabled: true,
    children: [{ label: 'Preferences' }],
  },
  { label: 'Help' },
];

function getBarItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="menubar"] > button'));
}

function getBarItemByText(container: HTMLElement, text: string): HTMLElement {
  const item = getBarItems(container).find((el) => el.textContent?.trim() === text);
  if (!item) throw new Error(`No bar item with text "${text}" found`);
  return item;
}

// Every open dropdown/flyout is portaled into its own `.cdk-overlay-container`
// entry appended near document.body — same reasoning as Tiered Menu's spec.
function getMenus(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('[role="menu"]'));
}

function getRowsIn(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll('[role="menuitem"]'));
}

function getRowByText(menu: HTMLElement, text: string): HTMLElement {
  const row = getRowsIn(menu).find((el) => el.textContent?.trim() === text);
  if (!row) throw new Error(`No row with text "${text}" found in menu`);
  return row;
}

function fireHover(el: HTMLElement): void {
  el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
}

// The openIndex()-driven overlay attach/detach/re-anchor effect (and the
// flyout-resync effect) run via Angular's zoneless effect scheduler, not
// synchronously with the signal write that triggered them — same technique
// as Tiered Menu's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-menubar-test-host',
  standalone: true,
  imports: [DynamoMenubar],
  template: `<dg-menubar [items]="items" ariaLabel="Main menu" (itemSelect)="lastSelected.set($event.label)" />`,
})
class MenubarTestHostComponent {
  readonly items = ITEMS;
  readonly lastSelected = signal<string | null>(null);
}

@Component({
  selector: 'dg-menubar-projection-test-host',
  standalone: true,
  imports: [DynamoMenubar],
  template: `
    <dg-menubar [items]="items" ariaLabel="Main menu">
      <img start src="logo.png" alt="Acme" />
      <input end type="search" aria-label="Search" />
    </dg-menubar>
  `,
})
class MenubarProjectionTestHostComponent {
  readonly items = ITEMS;
}

describe('DynamoMenubar', () => {
  describe('creation', () => {
    it('renders a menubar with one button per top-level item', () => {
      const { container } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      expect(getBarItems(container)).toHaveLength(4);
      expect(getBarItems(container).map((el) => el.textContent?.trim())).toEqual([
        'File',
        'Edit',
        'Settings',
        'Help',
      ]);
    });

    it('does not render any panel until a dropdown opens', () => {
      renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('content projection', () => {
    it('renders projected [start] and [end] content', () => {
      const { container } = renderDynamoComponent(MenubarProjectionTestHostComponent);

      expect(container.querySelector('[data-testid="DynamoMenubar-start"] img[alt="Acme"]')).toBeTruthy();
      expect(
        container.querySelector('[data-testid="DynamoMenubar-end"] input[aria-label="Search"]'),
      ).toBeTruthy();
    });

    it('never places projected content inside the role="menubar" element', () => {
      const { container } = renderDynamoComponent(MenubarProjectionTestHostComponent);

      const children = Array.from(container.querySelectorAll('[role="menubar"] > *'));
      expect(children.every((el) => el.tagName === 'BUTTON')).toBe(true);
    });

    it('has no axe violations with content projected into both slots', async () => {
      const { container } = renderDynamoComponent(MenubarProjectionTestHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('typing into a projected [end] input does not trigger the menubar keydown handler', async () => {
      const { container } = renderDynamoComponent(MenubarProjectionTestHostComponent);
      const search = container.querySelector<HTMLInputElement>(
        '[data-testid="DynamoMenubar-end"] input',
      )!;

      await userEvent.type(search, 'abc');

      expect(search.value).toBe('abc');
      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('default behavior', () => {
    it('defaults to no open dropdown and position bottom-start', () => {
      const { componentInstance } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      expect(componentInstance.openIndex()).toBeNull();
      expect(componentInstance.position()).toBe('bottom-start');
    });

    it('only the first bar item is in the tab sequence', () => {
      const { container } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      const items = getBarItems(container);

      expect(items[0]?.tabIndex).toBe(0);
      expect(items.slice(1).every((el) => el.tabIndex === -1)).toBe(true);
    });

    it('no bar item carries aria-activedescendant while the bar is closed', () => {
      const { container } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      expect(getBarItems(container).every((el) => el.getAttribute('aria-activedescendant') === null)).toBe(
        true,
      );
    });

    it('applies just styleClass when unstyled is set', () => {
      const { container } = renderDynamoComponent(DynamoMenubar, {
        inputs: { items: ITEMS, unstyled: true, styleClass: 'my-bar' },
      });

      expect(container.querySelector('[data-testid="DynamoMenubar"]')?.className).toBe('my-bar');
    });
  });

  describe('roving tabindex (closed bar)', () => {
    it('ArrowRight moves the roving tabindex to the next item, wrapping past the end', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      const items = getBarItems(container);

      items[0]?.focus();
      await userEvent.keyboard('{ArrowRight}'); // File -> Edit
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // Edit -> Settings is disabled, skips to Help
      await settle(fixture);

      expect(document.activeElement?.textContent?.trim()).toBe('Help');
      await userEvent.keyboard('{ArrowRight}'); // Help -> wraps to File
      await settle(fixture);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('ArrowLeft from the first item wraps to the last enabled item', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      getBarItems(container)[0]?.focus();

      await userEvent.keyboard('{ArrowLeft}');
      await settle(fixture);

      expect(document.activeElement?.textContent?.trim()).toBe('Help');
    });

    it('Home/End jump to the first/last enabled item', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      getBarItems(container)[1]?.focus();

      await userEvent.keyboard('{End}');
      await settle(fixture);
      expect(document.activeElement?.textContent?.trim()).toBe('Help');

      await userEvent.keyboard('{Home}');
      await settle(fixture);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('a disabled top-level item is never focused', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      getBarItems(container)[1]?.focus(); // Edit

      await userEvent.keyboard('{ArrowRight}'); // Settings is disabled — skip to Help
      await settle(fixture);

      expect(document.activeElement?.textContent?.trim()).toBe('Help');
    });
  });

  describe('single-level activation', () => {
    it('clicking a leaf top-level item invokes command directly, with no panel', async () => {
      const command = vi.fn();
      const items: DynamoMenubarItem[] = [{ label: 'Help', command }];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });

      await userEvent.click(getBarItemByText(container, 'Help'));
      await settle(fixture);

      expect(command).toHaveBeenCalledTimes(1);
      expect(getMenus()).toHaveLength(0);
    });

    it('clicking a branch item opens its dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'Edit'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toEqual(['Undo', 'Redo']);
    });

    it('clicking a branch item again closes its dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      const editItem = getBarItemByText(container, 'Edit');

      await userEvent.click(editItem);
      await settle(fixture);
      await userEvent.click(editItem);
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });

    it('clicking a leaf row emits itemSelect and closes the dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'Edit'));
      await settle(fixture);
      getRowByText(getMenus()[0]!, 'Undo').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Undo');
      expect(getMenus()).toHaveLength(0);
    });

    it('clicking a disabled top-level item does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'Settings'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('multi-level drill-down', () => {
    it('hovering a branch row opens a nested flyout showing its children', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getRowByText(getMenus()[0]!, 'New'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(getRowsIn(getMenus()[1]!).map((el) => el.textContent?.trim())).toEqual([
        'Document',
        'Spreadsheet',
      ]);
    });

    it('drills 3 levels deep and commits the deep leaf', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getRowByText(getMenus()[0]!, 'New'));
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      getRowByText(getMenus()[1]!, 'Document').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Document');
      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('sibling-switch', () => {
    it("hovering a sibling branch row (within a level) collapses the previous flyout", async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getRowByText(getMenus()[0]!, 'New'));
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      fireHover(getRowByText(getMenus()[0]!, 'Export'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(getRowsIn(getMenus()[1]!).map((el) => el.textContent?.trim())).toEqual(['PDF', 'CSV']);
    });

    it('hovering a sibling top-level item while one dropdown is open switches directly to it', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getBarItemByText(container, 'Edit'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toEqual(['Undo', 'Redo']);
      expect(document.activeElement?.textContent?.trim()).toBe('Edit');
    });

    it('ArrowRight at level 0 on a leaf row jumps to and opens the next top-level dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{End}'); // last enabled root row is Print
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // Print is a leaf — nothing to drill into, jump sideways

      await settle(fixture);
      expect(getMenus()).toHaveLength(1);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toEqual(['Undo', 'Redo']);
      expect(document.activeElement?.textContent?.trim()).toBe('Edit');
    });

    it('ArrowLeft at level 0 always jumps to the previous top-level dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'Edit'));
      await settle(fixture); // active row is Undo (a leaf)
      await userEvent.keyboard('{ArrowLeft}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('sibling-switching wraps across the bar and skips disabled top-level items', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'Help')); // Help is a leaf — but let's open File instead
      await settle(fixture);
      // Help has no children so nothing opened; open File explicitly.
      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowLeft}'); // File is first — wraps to Help, a leaf, so it just focuses
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
      expect(document.activeElement?.textContent?.trim()).toBe('Help');
    });

    it('sibling-switching is a no-op when there is only one top-level item', async () => {
      const items: DynamoMenubarItem[] = [{ label: 'Solo', children: [{ label: 'X' }] }];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });

      await userEvent.click(getBarItemByText(container, 'Solo')); // active row X is a leaf
      await settle(fixture);
      await userEvent.keyboard('{ArrowLeft}'); // wraps straight back to itself — nothing to switch to
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toEqual(['X']);
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowDown opens a branch item\'s dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      getBarItemByText(container, 'File').focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('ArrowDown on a leaf top-level item is a no-op', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      getBarItemByText(container, 'Help').focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });

    it('ArrowUp/ArrowDown move within the open level without wrapping', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File')); // active is New (index 0)
      await settle(fixture);
      await userEvent.keyboard('{ArrowUp}'); // no enabled row above index 0 — stays put
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // New is a branch, drills in rather than committing
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
    });

    it('Enter on a branch row drills in rather than committing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File')); // active is New
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBeNull();
      expect(getMenus()).toHaveLength(2);
    });

    it('ArrowRight drills into a branch row, ArrowLeft backs out one level', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into New
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      await userEvent.keyboard('{ArrowLeft}'); // back out to level 0
      await settle(fixture);
      expect(getMenus()).toHaveLength(1);
    });

    it('Enter on a leaf commits, closes everything, and refocuses the same top-level item', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into New
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // Spreadsheet
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Spreadsheet');
      expect(getMenus()).toHaveLength(0);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('Escape closes every open level and refocuses the same top-level item, never a sibling', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into New
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('Tab closes the open dropdown without trapping focus', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      expect(getMenus()).toHaveLength(1);

      getBarItemByText(container, 'File').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      );
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });

    it('Home/End jump to the first/last enabled row within an open level', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File')); // active is New (0)
      await settle(fixture);
      await userEvent.keyboard('{End}'); // last enabled root row is Print (Locked is disabled)
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);
      expect(fixture.componentInstance.lastSelected()).toBe('Print');

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{End}');
      await settle(fixture);
      await userEvent.keyboard('{Home}'); // back to New
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // New is a branch, drills in rather than committing
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
    });

    it('Enter on a closed branch item opens its dropdown', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      getBarItemByText(container, 'File').focus();

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('Enter on a closed leaf item invokes its command directly', async () => {
      const command = vi.fn();
      const items: DynamoMenubarItem[] = [{ label: 'Help', command }];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });
      getBarItemByText(container, 'Help').focus();

      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(command).toHaveBeenCalledTimes(1);
      expect(getMenus()).toHaveLength(0);
    });

    it('an unhandled key on the closed bar does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      getBarItemByText(container, 'File').focus();

      await userEvent.keyboard('z');
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });

    it('an unhandled key while a dropdown is open does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('z');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('ArrowRight on a leaf row below level 0 is a no-op (no sibling concept beneath the root dropdown)', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into New (level 1, active = Document, a leaf)
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      await userEvent.keyboard('{ArrowRight}'); // Document has no children — no-op
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(getRowsIn(getMenus()[1]!).map((el) => el.textContent?.trim())).toEqual([
        'Document',
        'Spreadsheet',
      ]);
    });
  });

  describe('disabled items', () => {
    it('a disabled branch row does not open its children on hover or ArrowRight', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getRowByText(getMenus()[0]!, 'Import'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('skips disabled rows during ArrowDown navigation within a level', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File')); // New (0)
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // Export (1)
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // skips disabled Import (2), lands on Print (3)
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Print');
    });

    it('clicking a disabled row directly does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      getRowByText(getMenus()[0]!, 'Locked').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBeNull();
      expect(getMenus()).toHaveLength(1);
    });

    it('hovering a disabled sibling top-level item does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getBarItemByText(container, 'Settings'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(document.activeElement?.textContent?.trim()).toBe('File');
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoMenubarHarness', async () => {
      const { fixture } = renderDynamoComponent(MenubarTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoMenubarHarness);

      expect(await harness.getTopLevelLabels()).toEqual(['File', 'Edit', 'Settings', 'Help']);
      expect(await harness.isOpen()).toBe(false);

      await harness.drillInto('File', 'New');
      await settle(fixture);
      expect(await harness.getVisibleLabelsAtLevel(1)).toEqual(['Document', 'Spreadsheet']);

      await harness.selectPath('File', 'Export', 'CSV');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('CSV');
      expect(await harness.isOpen()).toBe(false);
    });

    it('commits a single-label leaf top-level item directly through the harness', async () => {
      const { fixture } = renderDynamoComponent(MenubarTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoMenubarHarness);

      await harness.selectPath('Help');
      await settle(fixture);

      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('output events', () => {
    it("emits itemSelect and invokes the item's command() on commit", async () => {
      const command = vi.fn();
      const items: DynamoMenubarItem[] = [{ label: 'File', children: [{ label: 'Save', command }] }];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      getRowByText(getMenus()[0]!, 'Save').click();
      await settle(fixture);

      expect(command).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop', () => {
    it('renders exactly one backdrop regardless of how many levels are open', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(document.querySelectorAll('.cdk-overlay-backdrop')).toHaveLength(1);
    });

    it('clicking the backdrop while several levels deep closes everything', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
      backdrop.click();
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });

    it('switching to a sibling top-level item keeps exactly one backdrop', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);

      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      fireHover(getBarItemByText(container, 'Edit'));
      await settle(fixture);

      expect(document.querySelectorAll('.cdk-overlay-backdrop')).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a dropdown and a nested flyout open', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      await userEvent.click(getBarItemByText(container, 'File'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      // Scan each portaled menu individually (matching Tiered Menu's own axe
      // test) rather than the whole test document.body — the latter trips
      // axe's landmark-region rule on the bare test fixture root, a
      // test-harness artifact, not a real violation in this component.
      for (const menu of getMenus()) {
        await expect(expectNoA11yViolations(menu)).resolves.toBeUndefined();
      }
    });

    it('binds role="combobox" and aria-activedescendant only on the currently-open bar item', async () => {
      const { container, fixture } = renderDynamoComponent(MenubarTestHostComponent);
      const fileItem = getBarItemByText(container, 'File');
      const editItem = getBarItemByText(container, 'Edit');

      await userEvent.click(fileItem);
      await settle(fixture);

      expect(fileItem.getAttribute('role')).toBe('combobox');
      expect(editItem.getAttribute('role')).toBe('menuitem');
      const activeId = fileItem.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)?.textContent?.trim()).toBe('New');

      await userEvent.click(fileItem); // close
      await settle(fixture);

      expect(fileItem.getAttribute('role')).toBe('menuitem');
      expect(fileItem.getAttribute('aria-activedescendant')).toBeNull();
    });
  });

  describe('state changes', () => {
    it('opens the given dropdown when openIndex is set programmatically', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      setInputs({ openIndex: 0 });
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('re-anchors the dropdown when openIndex switches to a different top-level item', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      setInputs({ openIndex: 0 });
      await settle(fixture);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toContain('Print');

      setInputs({ openIndex: 1 });
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
      expect(getRowsIn(getMenus()[0]!).map((el) => el.textContent?.trim())).toEqual(['Undo', 'Redo']);
    });

    it('an out-of-range openIndex seeds an empty level and attaches no overlay, without throwing', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoMenubar, { inputs: { items: ITEMS } });

      await expect(async () => {
        setInputs({ openIndex: 99 });
        await settle(fixture);
      }).not.toThrow();

      expect(getMenus()).toHaveLength(0);
    });

    it('aria-activedescendant clears when the active level has no enabled row', async () => {
      const items: DynamoMenubarItem[] = [
        {
          label: 'Menu',
          children: [{ label: 'Sub', children: [{ label: 'A', disabled: true }, { label: 'B', disabled: true }] }],
        },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });
      const menuItem = getBarItemByText(container, 'Menu');

      await userEvent.click(menuItem);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into Sub — both children disabled
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(menuItem.getAttribute('aria-activedescendant')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles a single top-level item without throwing', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, {
        inputs: { items: [{ label: 'Only', children: [{ label: 'Child' }] }] },
      });

      await userEvent.click(getBarItemByText(container, 'Only'));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('does not throw when every top-level item is disabled', async () => {
      const items: DynamoMenubarItem[] = [
        { label: 'A', disabled: true },
        { label: 'B', disabled: true },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoMenubar, { inputs: { items } });

      await expect(async () => {
        getBarItems(container)[0]?.focus();
        await userEvent.keyboard('{ArrowRight}');
        await settle(fixture);
      }).not.toThrow();
    });

    it('handles an empty items array without throwing', () => {
      expect(() => {
        renderDynamoComponent(DynamoMenubar, { inputs: { items: [] } });
      }).not.toThrow();
    });
  });
});
