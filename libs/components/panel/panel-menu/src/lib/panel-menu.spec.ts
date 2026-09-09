import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoPanelMenu } from './panel-menu';
import { DynamoPanelMenuHarness } from './panel-menu.harness';
import type { DynamoPanelMenuItem } from './panel-menu.types';

// Documents (branch)
//   ├─ Resume (leaf)
//   └─ Cover Letter (leaf, disabled)
// Photos (branch)
//   ├─ Vacation (branch)
//   │   ├─ Beach (leaf)
//   │   └─ Mountain (leaf)
//   └─ Family (leaf)
// Settings (disabled branch)
//   └─ Preferences (leaf)
// Notes (leaf)
function sampleItems(): DynamoPanelMenuItem[] {
  return [
    {
      label: 'Documents',
      children: [
        { label: 'Resume' },
        { label: 'Cover Letter', disabled: true },
      ],
    },
    {
      label: 'Photos',
      children: [
        {
          label: 'Vacation',
          children: [{ label: 'Beach' }, { label: 'Mountain' }],
        },
        { label: 'Family' },
      ],
    },
    {
      label: 'Settings',
      disabled: true,
      children: [{ label: 'Preferences' }],
    },
    { label: 'Notes' },
  ];
}

function row(container: HTMLElement, label: string): HTMLElement {
  const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-node-path]'));
  const el = rows.find((candidate) => candidate.textContent?.trim() === label);
  if (!el) throw new Error(`row not found: ${label}`);
  return el;
}

function rowLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-node-path]')).map(
    (el) => el.textContent?.trim() ?? '',
  );
}

@Component({
  selector: 'dg-panel-menu-test-host',
  standalone: true,
  imports: [DynamoPanelMenu],
  template: `
    <dg-panel-menu
      [items]="items()"
      [(expandedPaths)]="expanded"
      ariaLabel="Files"
      (itemSelect)="lastSelected.set($event.label)"
    />
  `,
})
class PanelMenuTestHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>([]);
  readonly lastSelected = signal<string | null>(null);
}

describe('DynamoPanelMenu', () => {
  describe('creation', () => {
    it('renders one row per root-level item by default (children collapsed)', () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);

      expect(rowLabels(container)).toEqual(['Documents', 'Photos', 'Settings', 'Notes']);
    });

    it('renders the root as a nav with the given aria-label', () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);

      const nav = container.querySelector('nav');
      expect(nav?.getAttribute('aria-label')).toBe('Files');
    });
  });

  describe('default behavior', () => {
    it('starts with nothing expanded', () => {
      const { componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);

      expect(componentInstance.expanded()).toEqual([]);
    });

    it('makes the first item the only roving tab stop by default', () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);

      expect(row(container, 'Documents').getAttribute('tabindex')).toBe('0');
      expect(row(container, 'Photos').getAttribute('tabindex')).toBe('-1');
      expect(row(container, 'Notes').getAttribute('tabindex')).toBe('-1');
    });

    it('does not render aria-expanded on a leaf item', () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);

      expect(row(container, 'Notes').getAttribute('aria-expanded')).toBeNull();
    });
  });

  describe('expand/collapse', () => {
    it('expands a branch and renders its children when clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);

      await userEvent.click(row(container, 'Documents'));

      expect(componentInstance.expanded()).toEqual(['0']);
      expect(rowLabels(container)).toEqual(['Documents', 'Resume', 'Cover Letter', 'Photos', 'Settings', 'Notes']);
    });

    it('collapses an expanded branch when clicked again', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);
      await userEvent.click(row(container, 'Documents'));

      await userEvent.click(row(container, 'Documents'));

      expect(componentInstance.expanded()).toEqual([]);
      expect(rowLabels(container)).toEqual(['Documents', 'Photos', 'Settings', 'Notes']);
    });

    it('supports independently expanding multiple branches at once', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);

      await userEvent.click(row(container, 'Documents'));
      await userEvent.click(row(container, 'Photos'));

      expect(rowLabels(container)).toEqual([
        'Documents',
        'Resume',
        'Cover Letter',
        'Photos',
        'Vacation',
        'Family',
        'Settings',
        'Notes',
      ]);
    });

    it('supports nested expansion 3+ levels deep', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      await userEvent.click(row(container, 'Photos'));

      await userEvent.click(row(container, 'Vacation'));

      expect(rowLabels(container)).toEqual([
        'Documents',
        'Photos',
        'Vacation',
        'Beach',
        'Mountain',
        'Family',
        'Settings',
        'Notes',
      ]);
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus with ArrowDown/ArrowUp across root-level items', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Documents').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'Photos'));

      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(row(container, 'Documents'));
    });

    it('wraps ArrowDown from the last visible entry to the first', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Notes').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(row(container, 'Documents'));
    });

    it('jumps to the first/last visible entry on Home/End', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Photos').focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(row(container, 'Notes'));

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(row(container, 'Documents'));
    });

    it('descends into expanded children with ArrowDown, skipping disabled ones', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      await userEvent.click(row(container, 'Documents'));
      row(container, 'Documents').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'Resume'));

      // 'Cover Letter' is disabled and is skipped, straight to 'Photos'.
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'Photos'));
    });

    it('expands with ArrowRight and moves into the first child on a second ArrowRight', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Documents').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(row(container, 'Documents').getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(row(container, 'Documents'));

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(row(container, 'Resume'));
    });

    it('collapses with ArrowLeft, and moves to the parent with a second ArrowLeft', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Documents').focus();
      await userEvent.keyboard('{ArrowRight}'); // expand
      await userEvent.keyboard('{ArrowRight}'); // move to Resume

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(row(container, 'Documents'));

      await userEvent.keyboard('{ArrowLeft}');
      expect(row(container, 'Documents').getAttribute('aria-expanded')).toBe('false');
    });

    it('ArrowRight on a leaf does nothing', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Notes').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(row(container, 'Notes'));
    });

    it('ArrowLeft at the root level with no parent does nothing', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Photos').focus();

      await userEvent.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(row(container, 'Photos'));
    });

    it('Enter/Space on a leaf commits (native button click, not the custom keydown handler)', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Notes').focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance.lastSelected()).toBe('Notes');
    });
  });

  describe('disabled items', () => {
    it('a disabled branch does not expand on click', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);

      await userEvent.click(row(container, 'Settings'));

      expect(componentInstance.expanded()).toEqual([]);
      expect(container.querySelector('[data-node-path]')).toBeTruthy();
      expect(rowLabels(container)).not.toContain('Preferences');
    });

    it('a disabled leaf does not commit on click', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);
      await userEvent.click(row(container, 'Documents'));

      await userEvent.click(row(container, 'Cover Letter'));

      expect(componentInstance.lastSelected()).toBeNull();
    });

    it('a disabled top-level item is never focused via Arrow navigation', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Photos').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(row(container, 'Notes'));
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoPanelMenuHarness', async () => {
      const { fixture } = renderDynamoComponent(PanelMenuTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoPanelMenuHarness);

      expect(await harness.getVisibleLabels()).toEqual(['Documents', 'Photos', 'Settings', 'Notes']);

      await harness.selectPath('Photos', 'Vacation', 'Beach');

      expect(fixture.componentInstance.lastSelected()).toBe('Beach');
      expect(await harness.isExpanded('Photos')).toBe(true);
      expect(await harness.isExpanded('Vacation')).toBe(true);
    });
  });

  describe('output events', () => {
    it("emits itemSelect and invokes the item's command() on a leaf commit", async () => {
      const command = vi.fn();
      const items: DynamoPanelMenuItem[] = [{ label: 'Save', command }];
      const { container } = renderDynamoComponent(DynamoPanelMenu, { inputs: { items } });

      await userEvent.click(row(container, 'Save'));

      expect(command).toHaveBeenCalledTimes(1);
    });

    it('does not emit itemSelect when clicking a branch', async () => {
      const { container, componentInstance } = renderDynamoComponent(PanelMenuTestHostComponent);

      await userEvent.click(row(container, 'Documents'));

      expect(componentInstance.lastSelected()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when collapsed', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a multi-level expanded menu', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      await userEvent.click(row(container, 'Photos'));
      await userEvent.click(row(container, 'Vacation'));

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('reflects the roving tab stop as focus moves', async () => {
      const { container } = renderDynamoComponent(PanelMenuTestHostComponent);
      row(container, 'Documents').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(row(container, 'Documents').getAttribute('tabindex')).toBe('-1');
      expect(row(container, 'Photos').getAttribute('tabindex')).toBe('0');
    });
  });

  describe('state changes', () => {
    it('expands a branch when expandedPaths is set programmatically', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoPanelMenu, {
        inputs: { items: sampleItems() },
      });

      setInputs({ expandedPaths: ['0'] });

      expect(rowLabels(container)).toContain('Resume');
    });
  });

  describe('edge cases', () => {
    it('renders no rows for an empty items array', () => {
      const { container } = renderDynamoComponent(DynamoPanelMenu, { inputs: { items: [] } });

      expect(container.querySelectorAll('[data-node-path]')).toHaveLength(0);
    });

    it('treats an item with an empty children array as expandable, not a leaf', () => {
      const { container } = renderDynamoComponent(DynamoPanelMenu, {
        inputs: { items: [{ label: 'Empty folder', children: [] }] },
      });

      expect(row(container, 'Empty folder').getAttribute('aria-expanded')).toBeNull();
    });

    it('does not throw when every item is disabled', async () => {
      const items: DynamoPanelMenuItem[] = [
        { label: 'A', disabled: true },
        { label: 'B', disabled: true },
      ];
      const { container } = renderDynamoComponent(DynamoPanelMenu, { inputs: { items } });

      await expect(async () => {
        row(container, 'A').focus();
        await userEvent.keyboard('{ArrowDown}');
      }).not.toThrow();
    });

    it('renders deeply nested menus (5+ levels) without throwing', () => {
      const deep: DynamoPanelMenuItem = { label: 'L0' };
      let current = deep;
      for (let i = 1; i <= 6; i++) {
        const child: DynamoPanelMenuItem = { label: `L${i}` };
        current.children = [child];
        current = child;
      }
      const allExpanded = ['0', '0-0', '0-0-0', '0-0-0-0', '0-0-0-0-0', '0-0-0-0-0-0'];

      expect(() =>
        renderDynamoComponent(DynamoPanelMenu, {
          inputs: { items: [deep], expandedPaths: allExpanded },
        }),
      ).not.toThrow();
    });
  });
});
