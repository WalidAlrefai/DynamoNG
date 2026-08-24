import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoTree } from './tree';
import { DynamoTreeHarness } from './tree.harness';
import type { DynamoTreeNode } from './tree.types';

// docs
//   ├─ resume
//   └─ cover (disabled)
// photos
//   ├─ vacation
//   │   ├─ beach
//   │   └─ mountain
//   └─ family
// notes (leaf)
function sampleItems(): DynamoTreeNode[] {
  return [
    {
      id: 'docs',
      label: 'Documents',
      children: [
        { id: 'resume', label: 'Resume.pdf' },
        { id: 'cover', label: 'Cover Letter.pdf', disabled: true },
      ],
    },
    {
      id: 'photos',
      label: 'Photos',
      children: [
        {
          id: 'vacation',
          label: 'Vacation',
          children: [
            { id: 'beach', label: 'Beach.jpg' },
            { id: 'mountain', label: 'Mountain.jpg' },
          ],
        },
        { id: 'family', label: 'Family.jpg' },
      ],
    },
    { id: 'notes', label: 'Notes.txt' },
  ];
}

@Component({
  selector: 'dg-tree-test-host',
  standalone: true,
  imports: [DynamoTree],
  template: `
    <dg-tree
      [items]="items()"
      [(expandedIds)]="expanded"
      [(selected)]="selected"
      ariaLabel="Files"
      (nodeActivate)="onActivate($event)"
    />
  `,
})
class TreeTestHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>([]);
  readonly selected = model<string[]>([]);
  readonly activated: DynamoTreeNode[] = [];

  onActivate(node: DynamoTreeNode): void {
    this.activated.push(node);
  }
}

function row(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector(`[data-node-id="${id}"]`);
  if (!el) {
    throw new Error(`row not found: ${id}`);
  }
  return el as HTMLElement;
}

function chevron(container: HTMLElement, id: string): HTMLElement {
  const el = row(container, id).querySelector('[data-testid="chevron"]');
  if (!el) {
    throw new Error(`chevron not found: ${id}`);
  }
  return el as HTMLElement;
}

function checkboxInput(container: HTMLElement, id: string): HTMLInputElement {
  const el = row(container, id).querySelector('input[type="checkbox"]');
  if (!el) {
    throw new Error(`checkbox not found: ${id}`);
  }
  return el as HTMLInputElement;
}

describe('DynamoTree', () => {
  describe('creation', () => {
    it('renders one treeitem per root-level node by default (children collapsed)', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);

      expect(within(container).getAllByRole('treeitem')).toHaveLength(3);
    });

    it('renders role="tree" on the root with the given aria-label', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);

      const tree = within(container).getByRole('tree');
      expect(tree.getAttribute('aria-label')).toBe('Files');
    });
  });

  describe('default behavior', () => {
    it('starts with nothing expanded and nothing selected', () => {
      const { componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );

      expect(componentInstance.expanded()).toEqual([]);
      expect(componentInstance.selected()).toEqual([]);
    });

    it('makes the first node the only roving tab stop by default', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);

      expect(row(container, 'docs').getAttribute('tabindex')).toBe('0');
      expect(row(container, 'photos').getAttribute('tabindex')).toBe('-1');
      expect(row(container, 'notes').getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('expand/collapse', () => {
    it('expands a node and renders its children when its chevron is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );

      await userEvent.click(chevron(container, 'docs'));

      expect(componentInstance.expanded()).toEqual(['docs']);
      expect(row(container, 'resume')).toBeTruthy();
      expect(row(container, 'cover')).toBeTruthy();
    });

    it('collapses an expanded node when its chevron is clicked again', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(chevron(container, 'docs'));

      expect(componentInstance.expanded()).toEqual([]);
      expect(container.querySelector('[data-node-id="resume"]')).toBeNull();
    });

    it('does not render aria-expanded on a leaf node', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);

      expect(row(container, 'notes').getAttribute('aria-expanded')).toBeNull();
    });

    it('expands with ArrowRight and moves into the first child on a second ArrowRight', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'docs').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(row(container, 'docs').getAttribute('aria-expanded')).toBe(
        'true',
      );
      expect(document.activeElement).toBe(row(container, 'docs'));

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(row(container, 'resume'));
    });

    it('collapses with ArrowLeft, and moves to the parent with a second ArrowLeft', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'docs').focus();
      await userEvent.keyboard('{ArrowRight}'); // expand
      await userEvent.keyboard('{ArrowRight}'); // move to resume

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(row(container, 'docs'));

      await userEvent.keyboard('{ArrowLeft}');
      expect(row(container, 'docs').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus with ArrowDown/ArrowUp across root-level nodes', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'docs').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'photos'));

      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(row(container, 'docs'));
    });

    it('descends into expanded children with ArrowDown, in document order (skipping disabled)', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      await userEvent.click(chevron(container, 'docs'));
      row(container, 'docs').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'resume'));

      // 'cover' is disabled and is skipped, straight to 'photos'.
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(row(container, 'photos'));
    });

    it('wraps ArrowDown from the last visible entry to the first', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'notes').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(row(container, 'docs'));
    });

    it('jumps to the first/last visible entry on Home/End', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'photos').focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(row(container, 'notes'));

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(row(container, 'docs'));
    });

    it('skips disabled nodes during Arrow navigation', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      await userEvent.click(chevron(container, 'docs'));
      row(container, 'resume').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(row(container, 'photos'));
    });

    it('fires nodeActivate on Enter for the focused node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      row(container, 'notes').focus();

      await userEvent.keyboard('{Enter}');

      expect(componentInstance.activated.map((n) => n.id)).toEqual(['notes']);
    });
  });

  describe('selection', () => {
    it('checks a leaf directly', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'resume'));

      expect(componentInstance.selected()).toEqual(['resume']);
      expect(row(container, 'resume').getAttribute('aria-checked')).toBe(
        'true',
      );
    });

    it('cascades a parent check to all enabled descendants, skipping disabled ones', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'docs'));

      expect(componentInstance.selected().sort()).toEqual(['docs', 'resume']);
      expect(row(container, 'resume').getAttribute('aria-checked')).toBe(
        'true',
      );
      expect(row(container, 'cover').getAttribute('aria-checked')).toBe(
        'false',
      );
    });

    it('cascades an uncheck back through all enabled descendants', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));
      await userEvent.click(checkboxInput(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'docs'));

      expect(componentInstance.selected()).toEqual([]);
    });

    it('shows indeterminate on an ancestor when only some descendants are checked', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      await userEvent.click(chevron(container, 'photos'));
      await userEvent.click(chevron(container, 'vacation'));

      await userEvent.click(checkboxInput(container, 'beach'));

      expect(row(container, 'vacation').getAttribute('aria-checked')).toBe(
        'mixed',
      );
      expect(row(container, 'photos').getAttribute('aria-checked')).toBe(
        'mixed',
      );
    });

    it('propagates indeterminate through 3+ ancestor levels', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      await userEvent.click(chevron(container, 'photos'));
      await userEvent.click(chevron(container, 'vacation'));
      await userEvent.click(checkboxInput(container, 'beach'));
      await userEvent.click(checkboxInput(container, 'mountain'));

      // vacation is now fully checked (both its children checked), but
      // photos still has an unchecked sibling (family) -> indeterminate.
      expect(row(container, 'vacation').getAttribute('aria-checked')).toBe(
        'true',
      );
      expect(row(container, 'photos').getAttribute('aria-checked')).toBe(
        'mixed',
      );

      await userEvent.click(checkboxInput(container, 'family'));

      expect(row(container, 'photos').getAttribute('aria-checked')).toBe(
        'true',
      );
    });

    it('does not toggle a disabled node when its checkbox is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'cover'));

      expect(componentInstance.selected()).toEqual([]);
    });

    it('supports interaction through the DynamoTreeHarness', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeHarness,
      );

      expect(await harness.getVisibleNodeCount()).toBe(3);
      await harness.clickNode('docs');
      await userEvent.click(chevron(container, 'docs'));
      expect(await harness.isNodeExpanded('docs')).toBe(true);
      expect(await harness.getNodeCheckState('resume')).toBe('false');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with a multi-level expanded tree', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'photos'));
      await userEvent.click(chevron(container, 'vacation'));
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('sets aria-level/aria-posinset/aria-setsize correctly', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      await userEvent.click(chevron(container, 'photos'));

      const vacation = row(container, 'vacation');
      expect(vacation.getAttribute('aria-level')).toBe('2');
      expect(vacation.getAttribute('aria-posinset')).toBe('1');
      expect(vacation.getAttribute('aria-setsize')).toBe('2');
    });

    it('reflects aria-activedescendant-equivalent focus via a single roving tab stop', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      row(container, 'docs').focus();
      await userEvent.keyboard('{ArrowDown}');

      expect(row(container, 'docs').getAttribute('tabindex')).toBe('-1');
      expect(row(container, 'photos').getAttribute('tabindex')).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('renders no treeitems for an empty items array', () => {
      @Component({
        selector: 'dg-tree-empty-host',
        standalone: true,
        imports: [DynamoTree],
        template: `<dg-tree [items]="[]" />`,
      })
      class TreeEmptyHostComponent {}

      const { container } = renderDynamoComponent(TreeEmptyHostComponent);

      expect(within(container).queryAllByRole('treeitem')).toHaveLength(0);
    });

    it('treats a node with an empty children array as expandable, not a leaf', () => {
      @Component({
        selector: 'dg-tree-empty-children-host',
        standalone: true,
        imports: [DynamoTree],
        template: `<dg-tree [items]="items" />`,
      })
      class TreeEmptyChildrenHostComponent {
        readonly items: DynamoTreeNode[] = [
          { id: 'folder', label: 'Empty folder', children: [] },
        ];
      }

      const { container } = renderDynamoComponent(
        TreeEmptyChildrenHostComponent,
      );

      expect(
        row(container, 'folder').getAttribute('aria-expanded'),
      ).toBeNull();
      expect(
        container.querySelector('[data-node-id="folder"] [data-testid="chevron"]'),
      ).toBeNull();
    });

    it('renders deeply nested trees (5+ levels) without throwing', () => {
      const deep: DynamoTreeNode = { id: 'l0', label: 'L0' };
      let current = deep;
      for (let i = 1; i <= 6; i++) {
        const child: DynamoTreeNode = { id: `l${i}`, label: `L${i}` };
        current.children = [child];
        current = child;
      }

      @Component({
        selector: 'dg-tree-deep-host',
        standalone: true,
        imports: [DynamoTree],
        template: `<dg-tree [items]="[deep]" [(expandedIds)]="expanded" />`,
      })
      class TreeDeepHostComponent {
        readonly deep = deep;
        readonly expanded = model<string[]>([
          'l0',
          'l1',
          'l2',
          'l3',
          'l4',
          'l5',
        ]);
      }

      expect(() =>
        renderDynamoComponent(TreeDeepHostComponent),
      ).not.toThrow();
    });
  });
});
