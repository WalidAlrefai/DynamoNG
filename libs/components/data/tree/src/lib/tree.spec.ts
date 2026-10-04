import {
  Component,
  TemplateRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoTree } from './tree';
import { DynamoTreeHarness } from './tree.harness';
import type { DynamoTreeNode, DynamoTreeNodeContext } from './tree.types';

// jsdom has no real `Element.scrollTo` implementation. `virtualScroll`'s
// focus-into-unmounted-row fix calls the virtual-scroll viewport's own
// `scrollToIndex()` (via CDK's viewport, which calls `scrollTo`
// internally) when a keyboard move targets a row outside the currently
// mounted range. A minimal stub (jsdom-only; this is a real,
// universally-supported browser API) lets these tests exercise the real
// keyboard-nav-while-virtualized behavior instead of crashing the run —
// same gap and fix already established in `select.spec.ts`/`tree-table.spec.ts`.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

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
      [loading]="loading()"
      (nodeActivate)="onActivate($event)"
    />
  `,
})
class TreeTestHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>([]);
  readonly selected = model<string[]>([]);
  readonly loading = input(false);
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

function chevronSpinner(
  container: HTMLElement,
  id: string,
): HTMLElement | null {
  return row(container, id).querySelector('[data-testid="chevron-spinner"]');
}

function checkboxInput(container: HTMLElement, id: string): HTMLInputElement {
  const el = row(container, id).querySelector('input[type="checkbox"]');
  if (!el) {
    throw new Error(`checkbox not found: ${id}`);
  }
  return el as HTMLInputElement;
}

function getFilterInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  );
  if (!input) throw new Error('No filter input found — is filterable set?');
  return input;
}

function setFilterValue(container: HTMLElement, value: string): void {
  const input = getFilterInput(container);
  input.value = value;
  input.dispatchEvent(new Event('input'));
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
      expect(row(container, 'docs').getAttribute('aria-expanded')).toBe('true');
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

  describe('empty state', () => {
    it('renders emptyMessage and no tree items when items is empty', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [] },
      });

      expect(within(container).queryAllByRole('treeitem')).toHaveLength(0);
      expect(container.textContent).toContain('No data');
    });

    it('honors a custom emptyMessage', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [], emptyMessage: 'Nothing to show' },
      });

      expect(container.textContent).toContain('Nothing to show');
    });

    it('has no axe violations while empty', async () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [], ariaLabel: 'Files' },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('loading', () => {
    it('shows a spinner and loadingMessage in the empty-state slot instead of emptyMessage', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [], loading: true },
      });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
      expect(container.textContent).toContain('Loading…');
      expect(container.textContent).not.toContain('No data');
    });

    it('honors a custom loadingMessage', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [], loading: true, loadingMessage: 'Fetching…' },
      });

      expect(container.textContent).toContain('Fetching…');
    });

    it('sets aria-busy="true" on the empty-state status region while loading with no items', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: [], loading: true },
      });

      expect(
        within(container).getByRole('status').getAttribute('aria-busy'),
      ).toBe('true');
    });

    it('sets aria-busy="true" on the tree root while loading with items present', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent, {
        inputs: { loading: true },
      });

      expect(
        within(container).getByRole('tree').getAttribute('aria-busy'),
      ).toBe('true');
    });

    it('does not expand, check, or activate a node while loading', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
        { inputs: { loading: true } },
      );

      await userEvent.click(chevron(container, 'docs'));
      expect(row(container, 'docs').getAttribute('aria-expanded')).toBe(
        'false',
      );
      expect(componentInstance.expanded()).toEqual([]);

      await userEvent.click(checkboxInput(container, 'notes'));
      expect(componentInstance.selected()).toEqual([]);

      row(container, 'docs').focus();
      await userEvent.keyboard('{Enter}');
      expect(componentInstance.activated).toEqual([]);
    });
  });

  describe('itemSelect', () => {
    it('emits the full node object on check and on uncheck', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: sampleItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(checkboxInput(container, 'notes'));
      await userEvent.click(checkboxInput(container, 'notes'));

      expect(emitted.map((n) => n.id)).toEqual(['notes', 'notes']);
    });

    it('emits once for a cascading parent check, not once per descendant', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: sampleItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'docs'));

      expect(emitted.map((n) => n.id)).toEqual(['docs']);
    });

    it('does not emit for a disabled node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: sampleItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      await userEvent.click(chevron(container, 'docs'));

      await userEvent.click(checkboxInput(container, 'cover'));

      expect(emitted).toHaveLength(0);
    });

    it('also fires alongside nodeActivate on Enter, since Enter both checks and activates an enabled leaf', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: sampleItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      const activated: DynamoTreeNode[] = [];
      componentInstance.nodeActivate.subscribe((node) => activated.push(node));

      row(container, 'notes').focus();
      await userEvent.keyboard('{Enter}');

      expect(emitted.map((n) => n.id)).toEqual(['notes']);
      expect(activated.map((n) => n.id)).toEqual(['notes']);
    });
  });

  describe('typeahead', () => {
    const TYPEAHEAD_ITEMS: DynamoTreeNode[] = [
      { id: 'apple', label: 'Apple' },
      { id: 'apricot', label: 'Apricot' },
      { id: 'banana', label: 'Banana' },
    ];

    function dispatchKey(target: HTMLElement, key: string): void {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    it('jumps focus to the first matching node', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: TYPEAHEAD_ITEMS },
      });

      dispatchKey(row(container, 'apple'), 'b');

      expect(document.activeElement).toBe(row(container, 'banana'));
    });

    it('cycles through nodes sharing the same starting letter on repeated presses', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: TYPEAHEAD_ITEMS },
      });

      dispatchKey(row(container, 'apple'), 'a');
      expect(document.activeElement).toBe(row(container, 'apricot'));

      dispatchKey(row(container, 'apricot'), 'a');
      expect(document.activeElement).toBe(row(container, 'apple'));
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container } = renderDynamoComponent(DynamoTree, {
          inputs: { items: TYPEAHEAD_ITEMS },
        });

        dispatchKey(row(container, 'apple'), 'a');
        expect(document.activeElement).toBe(row(container, 'apricot'));

        vi.advanceTimersByTime(600);

        dispatchKey(row(container, 'apricot'), 'b');
        expect(document.activeElement).toBe(row(container, 'banana'));
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled nodes', () => {
      const itemsWithDisabled: DynamoTreeNode[] = [
        { id: 'apple', label: 'Apple' },
        { id: 'apricot', label: 'Apricot', disabled: true },
      ];
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: itemsWithDisabled },
      });

      dispatchKey(row(container, 'apple'), 'a');

      expect(document.activeElement).toBe(row(container, 'apple'));
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

      expect(row(container, 'folder').getAttribute('aria-expanded')).toBeNull();
      expect(
        container.querySelector(
          '[data-node-id="folder"] [data-testid="chevron"]',
        ),
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

      expect(() => renderDynamoComponent(TreeDeepHostComponent)).not.toThrow();
    });
  });

  describe('filter', () => {
    it('renders no search input when filterable is unset (regression)', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems() },
      });

      expect(container.querySelector('input[type="search"]')).toBeNull();
    });

    it('keeps a deep match and its ancestor chain, pruning non-matching branches', () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems(), filterable: true },
      });

      setFilterValue(container, 'beach');
      fixture.detectChanges();

      // "photos" > "vacation" > "beach" survive; "family" (photos' other
      // child, no match) and "docs"/"notes" (no match at all) are pruned.
      expect(row(container, 'beach')).toBeTruthy();
      expect(row(container, 'vacation')).toBeTruthy();
      expect(row(container, 'photos')).toBeTruthy();
      expect(container.querySelector('[data-node-id="family"]')).toBeNull();
      expect(container.querySelector('[data-node-id="docs"]')).toBeNull();
      expect(container.querySelector('[data-node-id="notes"]')).toBeNull();
    });

    it('keeps a matching branch’s entire original subtree unpruned', () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems(), filterable: true },
      });

      setFilterValue(container, 'photos');
      fixture.detectChanges();

      expect(row(container, 'vacation')).toBeTruthy();
      expect(row(container, 'beach')).toBeTruthy();
      expect(row(container, 'mountain')).toBeTruthy();
      expect(row(container, 'family')).toBeTruthy();
    });

    it('force-expands matched branches through the real recursive render, regardless of expandedIds', () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems(), filterable: true, expandedIds: [] },
      });

      setFilterValue(container, 'beach');
      fixture.detectChanges();

      expect(row(container, 'beach')).toBeTruthy();
      expect(row(container, 'photos').getAttribute('aria-expanded')).toBe(
        'true',
      );
      expect(row(container, 'vacation').getAttribute('aria-expanded')).toBe(
        'true',
      );
    });

    it('restores prior collapsed state once the filter is cleared, without mutating expandedIds', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: sampleItems(), filterable: true, expandedIds: [] } },
      );

      setFilterValue(container, 'beach');
      fixture.detectChanges();
      expect(row(container, 'beach')).toBeTruthy();

      setFilterValue(container, '');
      fixture.detectChanges();

      expect(within(container).getAllByRole('treeitem')).toHaveLength(3);
      expect(row(container, 'photos').getAttribute('aria-expanded')).toBe(
        'false',
      );
      expect(componentInstance.expandedIds()).toEqual([]);
    });

    it('shows noMatchesMessage instead of emptyMessage when the filter matches nothing', () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: {
          items: sampleItems(),
          filterable: true,
          noMatchesMessage: 'Nothing found',
        },
      });

      setFilterValue(container, 'zzz-nonexistent');
      fixture.detectChanges();

      expect(within(container).getByRole('status').textContent?.trim()).toBe(
        'Nothing found',
      );
    });

    it('shows emptyMessage, not noMatchesMessage, when items itself is empty regardless of filterText', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: {
          items: [],
          filterable: true,
          filterText: 'anything',
        },
      });

      expect(within(container).getByRole('status').textContent?.trim()).toBe(
        'No data',
      );
    });

    it('moves focus into the first child on ArrowRight for a node force-expanded by filtering', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems(), filterable: true, expandedIds: [] },
      });
      setFilterValue(container, 'beach');
      fixture.detectChanges();
      row(container, 'photos').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(document.activeElement).toBe(row(container, 'vacation'));
    });

    it('has no axe violations while filtering', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: sampleItems(), filterable: true },
      });
      setFilterValue(container, 'beach');
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('lazy loading', () => {
    function lazyItems(): DynamoTreeNode[] {
      return [{ id: 'lazy', label: 'Lazy folder', leaf: false }];
    }

    it('renders a chevron for a leaf:false node with no children (unlike a plain childless node)', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: { items: lazyItems() },
      });

      expect(chevron(container, 'lazy')).toBeTruthy();
      expect(row(container, 'lazy').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });

    it('expanding it adds the id to expandedIds and emits nodeExpand with the full node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: lazyItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.nodeExpand.subscribe((node) => emitted.push(node));

      await userEvent.click(chevron(container, 'lazy'));

      expect(componentInstance.expandedIds()).toEqual(['lazy']);
      expect(emitted).toEqual([lazyItems()[0]]);
    });

    it('collapsing it again does not re-emit nodeExpand', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: lazyItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.nodeExpand.subscribe((node) => emitted.push(node));
      await userEvent.click(chevron(container, 'lazy'));

      await userEvent.click(chevron(container, 'lazy'));

      expect(componentInstance.expandedIds()).toEqual([]);
      expect(emitted).toHaveLength(1);
    });

    it('does not re-emit nodeExpand once the consumer has patched real children into the node', async () => {
      @Component({
        selector: 'dg-tree-lazy-host',
        standalone: true,
        imports: [DynamoTree],
        template: `
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            (nodeExpand)="onNodeExpand($event)"
          />
        `,
      })
      class TreeLazyHostComponent {
        readonly items = signal<DynamoTreeNode[]>(lazyItems());
        readonly expanded = model<string[]>([]);
        readonly expandEvents: DynamoTreeNode[] = [];

        onNodeExpand(node: DynamoTreeNode): void {
          this.expandEvents.push(node);
          this.items.set([
            { ...node, children: [{ id: 'fetched', label: 'Fetched.txt' }] },
          ]);
        }
      }

      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeLazyHostComponent,
      );
      await userEvent.click(chevron(container, 'lazy'));
      fixture.detectChanges();
      expect(row(container, 'fetched')).toBeTruthy();
      expect(componentInstance.expandEvents).toHaveLength(1);

      await userEvent.click(chevron(container, 'lazy')); // collapse
      await userEvent.click(chevron(container, 'lazy')); // expand again

      expect(componentInstance.expandEvents).toHaveLength(1);
    });

    it('shows a loading spinner instead of a chevron while node.loading is true', () => {
      const { container } = renderDynamoComponent(DynamoTree, {
        inputs: {
          items: [
            { id: 'lazy', label: 'Lazy folder', leaf: false, loading: true },
          ],
        },
      });

      expect(chevronSpinner(container, 'lazy')).toBeTruthy();
      expect(
        row(container, 'lazy').querySelector('[data-testid="chevron"]'),
      ).toBeNull();
    });

    it('ignores ArrowLeft on an expanded node while it is loading (no collapse, no re-emit)', async () => {
      @Component({
        selector: 'dg-tree-lazy-loading-host',
        standalone: true,
        imports: [DynamoTree],
        template: `
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            (nodeExpand)="onNodeExpand($event)"
          />
        `,
      })
      class TreeLazyLoadingHostComponent {
        readonly items = signal<DynamoTreeNode[]>(lazyItems());
        readonly expanded = model<string[]>([]);
        readonly expandEvents: DynamoTreeNode[] = [];

        onNodeExpand(node: DynamoTreeNode): void {
          this.expandEvents.push(node);
          this.items.set([{ ...node, loading: true }]);
        }
      }

      const { container, componentInstance } = renderDynamoComponent(
        TreeLazyLoadingHostComponent,
      );
      await userEvent.click(chevron(container, 'lazy')); // expand -> fires nodeExpand -> host sets loading: true
      row(container, 'lazy').focus();

      await userEvent.keyboard('{ArrowLeft}');

      expect(componentInstance.expanded()).toEqual(['lazy']);
      expect(componentInstance.expandEvents).toHaveLength(1);
    });

    it('expands and emits nodeExpand via ArrowRight, exactly like a chevron click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoTree,
        { inputs: { items: lazyItems() } },
      );
      const emitted: DynamoTreeNode[] = [];
      componentInstance.nodeExpand.subscribe((node) => emitted.push(node));
      row(container, 'lazy').focus();

      await userEvent.keyboard('{ArrowRight}');

      expect(componentInstance.expandedIds()).toEqual(['lazy']);
      expect(emitted).toHaveLength(1);
    });

    it('has no axe violations with a leaf:false node, collapsed and expanded-with-spinner', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTree, {
        inputs: { items: lazyItems(), ariaLabel: 'Files' },
      });
      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();

      await userEvent.click(chevron(container, 'lazy'));
      fixture.detectChanges();
      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('supports isNodeLoading through the DynamoTreeHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoTree, {
        inputs: {
          items: [
            { id: 'lazy', label: 'Lazy folder', leaf: false, loading: true },
          ],
        },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeHarness,
      );

      expect(await harness.isNodeLoading('lazy')).toBe(true);
    });
  });
});

describe('DynamoTree — baseline parity (Phase 0)', () => {
  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/filterWrapper/filterInput/emptyState/tree/row/chevronButton/chevron/checkbox/label/group', async () => {
      const { container, fixture } = renderDynamoComponent<DynamoTree>(
        DynamoTree,
        {
          inputs: {
            items: sampleItems(),
            filterable: true,
            expandedIds: ['photos'],
            pt: {
              root: { class: 'pt-root' },
              filterWrapper: { class: 'pt-filter-wrapper' },
              filterInput: { class: 'pt-filter-input' },
              tree: { class: 'pt-tree' },
              row: { class: 'pt-row' },
              chevronButton: { class: 'pt-chevron-button' },
              chevron: { class: 'pt-chevron' },
              checkbox: { class: 'pt-checkbox' },
              label: { class: 'pt-label' },
              group: { class: 'pt-group' },
            },
          },
        },
      );
      await fixture.whenStable();
      fixture.detectChanges();

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(container.querySelector('.pt-filter-wrapper')).not.toBeNull();
      expect(
        container.querySelector('input[type="search"].pt-filter-input'),
      ).not.toBeNull();
      expect(container.querySelector('[role="tree"].pt-tree')).not.toBeNull();
      expect(
        container.querySelector('[role="treeitem"].pt-row'),
      ).not.toBeNull();
      expect(
        container.querySelector('button.pt-chevron-button'),
      ).not.toBeNull();
      expect(container.querySelector('svg.pt-chevron')).not.toBeNull();
      // DynamoCheckbox's own `class` merge lands on its inner <label>, not
      // the <dg-checkbox> host — same pattern confirmed on Table/TreeTable.
      expect(container.querySelector('label.pt-checkbox')).not.toBeNull();
      expect(container.querySelector('span.pt-label')).not.toBeNull();
      expect(container.querySelector('[role="group"].pt-group')).not.toBeNull();
    });

    it('also merges pt class onto emptyState while items() is empty', () => {
      const { container } = renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: {
          items: [],
          pt: { emptyState: { class: 'pt-empty-state' } },
        },
      });
      expect(container.querySelector('.pt-empty-state')).not.toBeNull();
    });
  });

  describe('fluid / ariaDescribedby', () => {
    it('defaults fluid to true', () => {
      const { container } = renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: { items: sampleItems() },
      });
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: { items: sampleItems(), fluid: false },
      });
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('binds ariaDescribedby onto the role="tree" element', () => {
      const { container } = renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: { items: sampleItems(), ariaDescribedby: 'hint-id' },
      });
      expect(
        container
          .querySelector('[role="tree"]')
          ?.getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });

    it('omits aria-describedby when unset', () => {
      const { container } = renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: { items: sampleItems() },
      });
      expect(
        container
          .querySelector('[role="tree"]')
          ?.hasAttribute('aria-describedby'),
      ).toBe(false);
    });
  });

  describe('bug fix: chevron is a real accessible button', () => {
    it('renders the chevron as a real <button> with a non-empty accessible name, excluded from the Tab sequence', () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      const el = chevron(container, 'docs');
      expect(el.tagName).toBe('BUTTON');
      expect(el.getAttribute('aria-label')).toBeTruthy();
      expect(el.tabIndex).toBe(-1);
    });

    it('still toggles expandedIds when the chevron button is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      await userEvent.click(chevron(container, 'docs'));
      expect(componentInstance.expanded()).toEqual(['docs']);
    });

    it('chevron label reflects collapsed/expanded state', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      expect(chevron(container, 'docs').getAttribute('aria-label')).toBe(
        'Expand Documents',
      );
      await userEvent.click(chevron(container, 'docs'));
      expect(chevron(container, 'docs').getAttribute('aria-label')).toBe(
        'Collapse Documents',
      );
    });

    it('has no axe violations, including on the chevron button specifically', async () => {
      const { container } = renderDynamoComponent(TreeTestHostComponent);
      const el = chevron(container, 'docs');
      expect(el.getAttribute('aria-label')?.length).toBeGreaterThan(0);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});

@Component({
  selector: 'dg-tree-node-template-host',
  standalone: true,
  imports: [DynamoTree],
  template: `
    <ng-template #nodeIcon let-node let-depth="depth" let-expanded="expanded">
      <span
        data-testid="custom-node"
        [attr.data-node-label]="node.label"
        [attr.data-depth]="depth"
        [attr.data-expanded]="expanded"
        >★ {{ node.label }}</span
      >
    </ng-template>
    <dg-tree
      [items]="items()"
      [(expandedIds)]="expanded"
      ariaLabel="Files"
      [nodeTemplate]="nodeIconTpl()"
    />
  `,
})
class TreeNodeTemplateHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>(['docs']);
  readonly nodeIconTpl =
    viewChild.required<TemplateRef<DynamoTreeNodeContext>>('nodeIcon');
}

describe('DynamoTree — custom node templating (Phase 1)', () => {
  it('renders the default plain-label span when nodeTemplate is unset', () => {
    const { container } = renderDynamoComponent(TreeTestHostComponent);
    expect(row(container, 'docs').textContent).toContain('Documents');
    expect(
      row(container, 'docs').querySelector('[data-testid="custom-node"]'),
    ).toBeNull();
  });

  it('renders projected template content instead of the plain label when set', () => {
    const { container } = renderDynamoComponent(TreeNodeTemplateHostComponent);
    const custom = row(container, 'docs').querySelector(
      '[data-testid="custom-node"]',
    );
    expect(custom).not.toBeNull();
    expect(custom?.textContent).toContain('★ Documents');
    // The plain fallback span never renders alongside the template.
    expect(row(container, 'docs').querySelector('span.truncate')).toBeNull();
  });

  it('passes the correct context: node, depth, and expanded', () => {
    // The host's own `expanded` model defaults to `['docs']`, so "docs" is
    // already expanded on initial render — no interaction needed here.
    const { container } = renderDynamoComponent(TreeNodeTemplateHostComponent);

    const docsCustom = row(container, 'docs').querySelector(
      '[data-testid="custom-node"]',
    );
    expect(docsCustom?.getAttribute('data-depth')).toBe('0');
    expect(docsCustom?.getAttribute('data-expanded')).toBe('true');

    const resumeCustom = row(container, 'resume').querySelector(
      '[data-testid="custom-node"]',
    );
    expect(resumeCustom?.getAttribute('data-depth')).toBe('1');
    expect(resumeCustom?.getAttribute('data-node-label')).toBe('Resume.pdf');
  });

  it('forwards the template through recursion — a 2-level-deep child also renders via it', async () => {
    const { container, fixture } = renderDynamoComponent(
      TreeNodeTemplateHostComponent,
    );
    await userEvent.click(chevron(container, 'photos'));
    await userEvent.click(chevron(container, 'vacation'));
    fixture.detectChanges();

    const beachCustom = row(container, 'beach').querySelector(
      '[data-testid="custom-node"]',
    );
    expect(beachCustom).not.toBeNull();
    expect(beachCustom?.getAttribute('data-depth')).toBe('2');
  });
});

@Component({
  selector: 'dg-tree-selection-mode-host',
  standalone: true,
  imports: [DynamoTree],
  template: `
    <dg-tree
      [items]="items()"
      [(expandedIds)]="expanded"
      [(selected)]="selected"
      ariaLabel="Files"
      [selectionMode]="selectionMode()"
      (itemSelect)="onItemSelect($event)"
    />
  `,
})
class TreeSelectionModeHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>([]);
  readonly selected = model<string[]>([]);
  readonly selectionMode = input<'single' | 'multiple' | 'checkbox'>(
    'checkbox',
  );
  readonly itemSelects: DynamoTreeNode[] = [];

  onItemSelect(node: DynamoTreeNode): void {
    this.itemSelects.push(node);
  }
}

describe('DynamoTree — selectionMode (Phase 2)', () => {
  describe('"checkbox" (default) — baseline regression', () => {
    it('renders a checkbox on every row and cascades exactly as before', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTestHostComponent,
      );
      expect(checkboxInput(container, 'docs')).not.toBeNull();
      await userEvent.click(checkboxInput(container, 'docs'));
      expect(componentInstance.selected().sort()).toEqual(['docs', 'resume']);
    });
  });

  describe('"single"', () => {
    it('clicking a row replaces the selection with just that node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      await userEvent.click(row(container, 'docs'));
      expect(componentInstance.selected()).toEqual(['docs']);

      await userEvent.click(row(container, 'notes'));
      expect(componentInstance.selected()).toEqual(['notes']);
    });

    it('clicking the already-selected row leaves it selected (no toggle-off)', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      await userEvent.click(row(container, 'docs'));
      await userEvent.click(row(container, 'docs'));
      expect(componentInstance.selected()).toEqual(['docs']);
    });

    it('renders no checkbox at all', () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    });

    it('sets aria-selected and omits aria-checked', async () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      expect(row(container, 'docs').getAttribute('aria-selected')).toBe(
        'false',
      );
      expect(row(container, 'docs').hasAttribute('aria-checked')).toBe(false);

      await userEvent.click(row(container, 'docs'));
      expect(row(container, 'docs').getAttribute('aria-selected')).toBe('true');
    });

    it('sets aria-multiselectable to false on the root', () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      expect(
        container
          .querySelector('[role="tree"]')
          ?.getAttribute('aria-multiselectable'),
      ).toBe('false');
    });

    it('Enter/Space on the active row also selects it', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      row(container, 'docs').focus();
      await userEvent.keyboard('{Enter}');
      expect(componentInstance.selected()).toEqual(['docs']);
    });

    it('does not select a disabled node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      await userEvent.click(chevron(container, 'docs'));
      await userEvent.click(row(container, 'cover'));
      expect(componentInstance.selected()).toEqual([]);
    });
  });

  describe('"multiple"', () => {
    it('clicking toggles plain membership without cascading', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      await userEvent.click(row(container, 'docs'));
      expect(componentInstance.selected()).toEqual(['docs']);
      // Adds, doesn't replace — unlike "single".
      await userEvent.click(row(container, 'photos'));
      expect(componentInstance.selected().sort()).toEqual(['docs', 'photos']);
      // Clicking an already-selected node removes it.
      await userEvent.click(row(container, 'docs'));
      expect(componentInstance.selected()).toEqual(['photos']);
    });

    it('renders no checkbox at all', () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    });

    it('sets aria-multiselectable to true on the root', () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      expect(
        container
          .querySelector('[role="tree"]')
          ?.getAttribute('aria-multiselectable'),
      ).toBe('true');
    });

    it('sets aria-selected and omits aria-checked', async () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      await userEvent.click(row(container, 'docs'));
      expect(row(container, 'docs').getAttribute('aria-selected')).toBe('true');
      expect(row(container, 'docs').hasAttribute('aria-checked')).toBe(false);
    });

    it('does not select a disabled node', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      await userEvent.click(chevron(container, 'docs'));
      await userEvent.click(row(container, 'cover'));
      expect(componentInstance.selected()).toEqual([]);
    });
  });

  describe('itemSelect cardinality', () => {
    it('fires once per direct interaction in "checkbox" mode', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'checkbox' } },
      );
      await userEvent.click(checkboxInput(container, 'notes'));
      expect(componentInstance.itemSelects).toHaveLength(1);
    });

    it('fires once per direct interaction in "single" mode', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      await userEvent.click(row(container, 'notes'));
      expect(componentInstance.itemSelects).toHaveLength(1);
    });

    it('fires once per direct interaction in "multiple" mode', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      await userEvent.click(row(container, 'notes'));
      expect(componentInstance.itemSelects).toHaveLength(1);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in "single" mode', async () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'single' } },
      );
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in "multiple" mode', async () => {
      const { container } = renderDynamoComponent(
        TreeSelectionModeHostComponent,
        { inputs: { selectionMode: 'multiple' } },
      );
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});

@Component({
  selector: 'dg-tree-node-template-virtual-host',
  standalone: true,
  imports: [DynamoTree],
  template: `
    <ng-template #nodeIcon let-node let-depth="depth" let-expanded="expanded">
      <span
        data-testid="custom-node"
        [attr.data-node-label]="node.label"
        [attr.data-depth]="depth"
        [attr.data-expanded]="expanded"
        >★ {{ node.label }}</span
      >
    </ng-template>
    <dg-tree
      [items]="items()"
      [(expandedIds)]="expanded"
      ariaLabel="Files"
      [nodeTemplate]="nodeIconTpl()"
      [virtualScroll]="true"
    />
  `,
})
class TreeNodeTemplateVirtualHostComponent {
  readonly items = signal(sampleItems());
  readonly expanded = model<string[]>(['docs']);
  readonly nodeIconTpl =
    viewChild.required<TemplateRef<DynamoTreeNodeContext>>('nodeIcon');
}

describe('DynamoTree — virtual scroll (Phase 3)', () => {
  // CDK's viewport measures its own size asynchronously (an
  // `afterNextRender`-driven check, not synchronous with construction)
  // before deciding how many rows to render — same "flush before
  // asserting" idiom `@dynamong/virtual-scroll`'s own spec already uses.
  async function settle(fixture: { detectChanges(): void }): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  // 200 flat root nodes — deliberately not nested, since virtualization
  // itself only cares about the flattened visibleEntries() length.
  function manyNodes(count: number): DynamoTreeNode[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
    }));
  }

  // The virtualized path's rows live inside `<dg-virtual-scroll>`, not a
  // plain recursive layout — but they're still `[role="treeitem"]` with
  // `[data-node-id]`, so the module-level `row()`/`chevron()` helpers work
  // unchanged for both paths.

  it('renders role="tree" (not the recursive markup) with real row content through the virtualized path', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      { inputs: { items: manyNodes(200), virtualScroll: true } },
    );
    await settle(fixture);

    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    const rows = container.querySelectorAll('[role="treeitem"]');
    expect(rows.length).toBeGreaterThan(1);
    expect(row(container, 'item-0').textContent).toContain('Item 0');
  });

  it('expand/collapse works through the virtualized path', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      { inputs: { items: sampleItems(), virtualScroll: true } },
    );
    await settle(fixture);

    expect(container.querySelector('[data-node-id="resume"]')).toBeNull();
    await userEvent.click(chevron(container, 'docs'));
    await settle(fixture);

    expect(container.querySelector('[data-node-id="resume"]')).not.toBeNull();
  });

  it('"checkbox" selection works through the virtualized path', async () => {
    const { container, fixture, componentInstance } =
      renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: {
          items: sampleItems(),
          virtualScroll: true,
          selected: [],
        },
      });
    await settle(fixture);

    await userEvent.click(checkboxInput(container, 'notes'));
    fixture.detectChanges();
    expect(componentInstance.selected()).toEqual(['notes']);
  });

  it('"single"/"multiple" selection works through the virtualized path', async () => {
    const { container, fixture, componentInstance } =
      renderDynamoComponent<DynamoTree>(DynamoTree, {
        inputs: {
          items: sampleItems(),
          virtualScroll: true,
          selectionMode: 'multiple',
        },
      });
    await settle(fixture);

    await userEvent.click(row(container, 'notes'));
    fixture.detectChanges();
    expect(componentInstance.selected()).toEqual(['notes']);
  });

  it('nodeTemplate renders correctly through the virtualized path', async () => {
    const { container, fixture } = renderDynamoComponent(
      TreeNodeTemplateVirtualHostComponent,
    );
    await settle(fixture);

    const custom = row(container, 'docs').querySelector(
      '[data-testid="custom-node"]',
    );
    expect(custom).not.toBeNull();
    expect(custom?.textContent).toContain('★ Documents');
    expect(custom?.getAttribute('data-depth')).toBe('0');
  });

  it('exposes aria-level/aria-posinset/aria-setsize correctly through the virtualized path', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      { inputs: { items: sampleItems(), virtualScroll: true } },
    );
    await settle(fixture);
    await userEvent.click(chevron(container, 'photos'));
    await settle(fixture);

    const vacation = row(container, 'vacation');
    expect(vacation.getAttribute('aria-level')).toBe('2');
    expect(vacation.getAttribute('aria-posinset')).toBe('1');
    expect(vacation.getAttribute('aria-setsize')).toBe('2');
  });

  it('renders the empty-state message instead of the viewport when items is empty', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      { inputs: { items: [], virtualScroll: true } },
    );
    await settle(fixture);

    expect(container.querySelector('dg-virtual-scroll')).toBeNull();
    expect(within(container).getByRole('status').textContent?.trim()).toBe(
      'No data',
    );
  });

  it('does not virtualize when virtualScroll is left at its default (false)', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      { inputs: { items: sampleItems() } },
    );
    await settle(fixture);

    expect(container.querySelector('dg-virtual-scroll')).toBeNull();
    expect(row(container, 'docs')).not.toBeNull();
  });

  it('merges pt class onto tree/row/chevronButton/chevron/checkbox/label while virtualized', async () => {
    const { container, fixture } = renderDynamoComponent<DynamoTree>(
      DynamoTree,
      {
        inputs: {
          items: sampleItems(),
          virtualScroll: true,
          pt: {
            tree: { class: 'pt-tree' },
            row: { class: 'pt-row' },
            chevronButton: { class: 'pt-chevron-button' },
            chevron: { class: 'pt-chevron' },
            checkbox: { class: 'pt-checkbox' },
            label: { class: 'pt-label' },
          },
        },
      },
    );
    await settle(fixture);

    expect(container.querySelector('[role="tree"].pt-tree')).not.toBeNull();
    expect(container.querySelector('[role="treeitem"].pt-row')).not.toBeNull();
    expect(container.querySelector('button.pt-chevron-button')).not.toBeNull();
    expect(container.querySelector('svg.pt-chevron')).not.toBeNull();
    expect(container.querySelector('span.pt-label')).not.toBeNull();
  });

  describe('roving-tabindex focus into an unmounted row', () => {
    it("End scrolls the viewport to the last row's index when it is not currently mounted", async () => {
      const { container, fixture } = renderDynamoComponent<DynamoTree>(
        DynamoTree,
        { inputs: { items: manyNodes(200), virtualScroll: true } },
      );
      await settle(fixture);

      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const scrollSpy = vi.spyOn(
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>,
        'scrollToIndex',
      );

      const firstRow = row(container, 'item-0');
      firstRow.focus();
      fireEvent.keyDown(firstRow, { key: 'End' });
      await settle(fixture);

      expect(scrollSpy).toHaveBeenCalledWith(199);
    });

    it('does not call scrollToIndex when the target row is already mounted', async () => {
      const { container, fixture } = renderDynamoComponent<DynamoTree>(
        DynamoTree,
        { inputs: { items: sampleItems(), virtualScroll: true } },
      );
      await settle(fixture);

      const viewportDebugEl = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      );
      const scrollSpy = vi.spyOn(
        viewportDebugEl.componentInstance as DynamoVirtualScroll<unknown>,
        'scrollToIndex',
      );

      const firstRow = row(container, 'docs');
      firstRow.focus();
      fireEvent.keyDown(firstRow, { key: 'ArrowDown' });
      await settle(fixture);

      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });
});
