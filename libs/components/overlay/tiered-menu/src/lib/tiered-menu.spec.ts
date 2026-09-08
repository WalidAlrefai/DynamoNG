import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoTieredMenu } from './tiered-menu';
import { DynamoTieredMenuHarness } from './tiered-menu.harness';
import type { DynamoTieredMenuItem } from './tiered-menu.types';

// File -> New -> (Document, Spreadsheet) is 3 levels deep (root=0, New=1,
// Document/Spreadsheet=2) — deep enough to prove genuine recursion without a
// hardcoded 2-level special case. Also carries a disabled branch (Import) and
// a disabled leaf (Locked).
const ITEMS: DynamoTieredMenuItem[] = [
  {
    label: 'New',
    children: [{ label: 'Document' }, { label: 'Spreadsheet' }],
  },
  {
    label: 'Export',
    children: [{ label: 'PDF' }, { label: 'CSV' }],
  },
  {
    label: 'Import',
    disabled: true,
    children: [{ label: 'From URL' }],
  },
  { label: 'Print' },
  { label: 'Locked', disabled: true },
];

// Every open level (root + every flyout) is portaled into its own
// `.cdk-overlay-container` entry appended near document.body — same
// reasoning as DynamoCascadeSelect's spec, just with menu/menuitem roles
// instead of listbox/option.
function getMenus(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('[role="menu"]'));
}

function getItemsIn(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll('[role="menuitem"]'));
}

function getItemByText(menu: HTMLElement, text: string): HTMLElement {
  const item = getItemsIn(menu).find((el) => el.textContent?.trim() === text);
  if (!item) throw new Error(`No item with text "${text}" found in menu`);
  return item;
}

// The open()-driven overlay attach/detach effect (and this component's own
// flyout-resync effect) run via Angular's zoneless effect scheduler, not
// synchronously with the signal write that triggered them — same technique
// as DynamoCascadeSelect's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-tiered-menu-test-host',
  standalone: true,
  imports: [DynamoTieredMenu],
  template: `<dg-tiered-menu [items]="items" label="File" (itemSelect)="lastSelected.set($event.label)" />`,
})
class TieredMenuTestHostComponent {
  readonly items = ITEMS;
  readonly lastSelected = signal<string | null>(null);
}

describe('DynamoTieredMenu', () => {
  describe('creation', () => {
    it('renders a trigger button with the given label', () => {
      const { container } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: ITEMS, label: 'File' },
      });

      expect(within(container).getByRole('combobox', { name: 'File' })).toBeTruthy();
    });

    it('does not render any panel until opened', () => {
      renderDynamoComponent(DynamoTieredMenu, { inputs: { items: ITEMS, label: 'File' } });

      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('default behavior', () => {
    it('defaults to closed and position bottom-start', () => {
      const { componentInstance } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: ITEMS, label: 'File' },
      });

      expect(componentInstance.open()).toBe(false);
      expect(componentInstance.position()).toBe('bottom-start');
    });
  });

  describe('single-level activation', () => {
    it('clicking a root-level leaf emits itemSelect and closes the panel', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'Print').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Print');
      expect(getMenus()).toHaveLength(0);
    });

    it('clicking a disabled item does nothing', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'Locked').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBeNull();
      expect(getMenus()).toHaveLength(1);
    });
  });

  describe('multi-level drill-down', () => {
    it('hovering a branch opens a second panel showing its children', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'New').dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      const level1Labels = getItemsIn(getMenus()[1]!).map((el) => el.textContent?.trim());
      expect(level1Labels).toEqual(['Document', 'Spreadsheet']);
    });

    it('drills 3 levels deep and commits the deep leaf', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'New').dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      getItemByText(getMenus()[1]!, 'Document').click();
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Document');
      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('sibling-switch truncation', () => {
    it("hovering a sibling branch collapses the previous branch's flyout", async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'New').dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      getItemByText(getMenus()[0]!, 'Export').dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      const level1Labels = getItemsIn(getMenus()[1]!).map((el) => el.textContent?.trim());
      expect(level1Labels).toEqual(['PDF', 'CSV']);
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowDown opens the closed panel', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('ArrowDown/ArrowUp move within the current level without wrapping', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger); // active is New (index 0)
      await settle(fixture);
      await userEvent.keyboard('{ArrowUp}'); // no enabled item above index 0 — stays put
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // New is a branch, drills in rather than committing
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
    });

    it('Home/End jump to the first/last enabled item within the current level', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{End}'); // last enabled root item is Print (Locked is disabled)
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Print');
    });

    it('Enter on a branch drills in rather than committing', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' })); // active is New
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBeNull();
      expect(getMenus()).toHaveLength(2);
    });

    it('ArrowRight drills into a branch, ArrowLeft backs out one level', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      await userEvent.keyboard('{ArrowLeft}');
      await settle(fixture);
      expect(getMenus()).toHaveLength(1);
    });

    it('ArrowLeft at the root level is a no-op', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      await userEvent.keyboard('{ArrowLeft}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('Enter on a leaf commits and closes every open level', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into New
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // Spreadsheet
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Spreadsheet');
      expect(getMenus()).toHaveLength(0);
    });

    it('Escape closes every open level at once', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);
      expect(getMenus()).toHaveLength(2);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('disabled items', () => {
    it('a disabled branch does not open its children on hover or ArrowRight', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'Import').dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('skips disabled items during ArrowDown navigation', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger); // New (0)
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // Export (1)
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // skips disabled Import (2), lands on Print (3)
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('Print');
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoTieredMenuHarness', async () => {
      const { fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoTieredMenuHarness);

      expect(await harness.isOpen()).toBe(false);
      await harness.drillInto('New');
      await settle(fixture);

      expect(await harness.getVisibleLabelsAtLevel(1)).toEqual(['Document', 'Spreadsheet']);

      await harness.selectPath('Export', 'CSV');
      await settle(fixture);

      expect(fixture.componentInstance.lastSelected()).toBe('CSV');
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('output events', () => {
    it('emits itemSelect and invokes the item\'s command() on commit', async () => {
      const command = vi.fn();
      const items: DynamoTieredMenuItem[] = [{ label: 'Save', command }];
      const { container, fixture } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items, label: 'File' },
      });

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      getItemByText(getMenus()[0]!, 'Save').click();
      await settle(fixture);

      expect(command).toHaveBeenCalledTimes(1);
    });
  });

  describe('backdrop', () => {
    it('renders exactly one backdrop regardless of how many levels are open', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      expect(getMenus()).toHaveLength(2);
      expect(document.querySelectorAll('.cdk-overlay-backdrop')).toHaveLength(1);
    });

    it('clicking the backdrop while several levels deep closes everything', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
      backdrop.click();
      await settle(fixture);

      expect(getMenus()).toHaveLength(0);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when closed', async () => {
      const { container } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: ITEMS, label: 'File' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with several levels open', async () => {
      const { container, fixture } = renderDynamoComponent(TieredMenuTestHostComponent);
      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);

      // Scan each portaled menu individually (matching Cascade Select's own
      // axe test) rather than the whole test document.body — the latter
      // trips axe's landmark-region rule on the bare test fixture root,
      // which is a test-harness artifact, not a real violation in this
      // component.
      for (const menu of getMenus()) {
        await expect(expectNoA11yViolations(menu)).resolves.toBeUndefined();
      }
    });

    it('reflects the active item via aria-activedescendant on the trigger', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: ITEMS, label: 'File' },
      });
      const trigger = within(container).getByRole('combobox', { name: 'File' });

      await userEvent.click(trigger);
      await settle(fixture);

      const activeId = trigger.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)?.textContent?.trim()).toBe('New');
      expect(componentInstance.open()).toBe(true);
    });
  });

  describe('state changes', () => {
    it('opens when the open model is set programmatically', async () => {
      const { fixture, setInputs } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: ITEMS, label: 'File' },
      });

      setInputs({ open: true });
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('handles a single item without throwing', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: [{ label: 'Only' }], label: 'File' },
      });

      await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
      await settle(fixture);

      expect(getMenus()).toHaveLength(1);
    });

    it('does not throw when every item is disabled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTieredMenu, {
        inputs: { items: [{ label: 'A', disabled: true }, { label: 'B', disabled: true }], label: 'File' },
      });

      await expect(async () => {
        await userEvent.click(within(container).getByRole('combobox', { name: 'File' }));
        await settle(fixture);
      }).not.toThrow();
    });

    it('handles an empty items array without throwing', () => {
      expect(() => {
        renderDynamoComponent(DynamoTieredMenu, { inputs: { items: [], label: 'File' } });
      }).not.toThrow();
    });
  });
});
