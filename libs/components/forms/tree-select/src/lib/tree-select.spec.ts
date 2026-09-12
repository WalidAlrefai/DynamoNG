import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoTreeSelect } from './tree-select';
import { DynamoTreeSelectHarness } from './tree-select.harness';

// jsdom has no real `Element.scrollTo`. When `virtualScroll` is enabled,
// DynamoTreeSelect's explicit keyboard-nav `scrollActiveIntoView()` calls
// reach the virtual-scroll viewport's `scrollToIndex()` (CDK's viewport
// calls `scrollTo` internally). A minimal stub lets these tests exercise
// the real keyboard-nav-while-virtualized behavior instead of throwing.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

const MANY_NODES: DynamoTreeNode<string>[] = Array.from(
  { length: 50 },
  (_, i) => ({ id: `n${i + 1}`, label: `Node ${i + 1}`, value: `n${i + 1}` }),
);

const NODES: DynamoTreeNode<string>[] = [
  {
    id: 'fruits',
    label: 'Fruits',
    children: [
      { id: 'apple', label: 'Apple', value: 'apple' },
      { id: 'banana', label: 'Banana', value: 'banana' },
    ],
  },
  {
    id: 'veggies',
    label: 'Vegetables',
    children: [
      { id: 'carrot', label: 'Carrot', value: 'carrot', disabled: true },
      { id: 'pea', label: 'Pea', value: 'pea' },
    ],
  },
  { id: 'grain', label: 'Grain', value: 'grain' },
];

// The CDK overlay portals `role="tree"` content into a
// `.cdk-overlay-container` appended near document.body — same reasoning as
// DynamoSelect's/DynamoMenu's specs.
function getPanel(): HTMLElement | null {
  return document.body.querySelector('[role="tree"]');
}

function getRows(): HTMLElement[] {
  return Array.from(getPanel()?.querySelectorAll('[role="treeitem"]') ?? []);
}

function getRowByText(text: string): HTMLElement {
  const row = getRows().find((el) => el.textContent?.trim().startsWith(text));
  if (!row) throw new Error(`No row with text "${text}" found`);
  return row;
}

// The open()-driven overlay attach/detach effect runs via Angular's
// zoneless effect scheduler, not synchronously with the signal write that
// triggered it — same technique as DynamoSelect's spec.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

@Component({
  selector: 'dg-tree-select-test-host',
  standalone: true,
  imports: [DynamoTreeSelect],
  template: `<dg-tree-select
    [nodes]="nodes"
    [(value)]="value"
    ariaLabel="Choose an item"
  />`,
})
class TreeSelectTestHostComponent {
  readonly nodes = NODES;
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'dg-tree-select-reactive-form-host',
  standalone: true,
  imports: [DynamoTreeSelect, ReactiveFormsModule],
  template: `<dg-tree-select
    [nodes]="nodes"
    [formControl]="control"
    ariaLabel="Choose an item"
  />`,
})
class ReactiveFormHostComponent {
  readonly nodes = NODES;
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'dg-tree-select-ng-model-host',
  standalone: true,
  imports: [DynamoTreeSelect, FormsModule],
  template: `<dg-tree-select
    [nodes]="nodes"
    [(ngModel)]="value"
    ariaLabel="Choose an item"
  />`,
})
class NgModelHostComponent {
  readonly nodes = NODES;
  value: string | null = null;
}

describe('DynamoTreeSelect', () => {
  describe('creation', () => {
    it('renders a combobox trigger', () => {
      const { container } = renderDynamoComponent(TreeSelectTestHostComponent);

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render the tree panel until opened', () => {
      renderDynamoComponent(TreeSelectTestHostComponent);

      expect(getPanel()).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder when nothing is selected', () => {
      const { container } = renderDynamoComponent(TreeSelectTestHostComponent);

      expect(
        within(container).getByRole('combobox').textContent?.trim(),
      ).toBe('Select...');
    });

    it('defaults to closed and not disabled', () => {
      const { componentInstance } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Choose an item' },
      });

      expect(componentInstance['isOpen']()).toBe(false);
      expect(componentInstance.disabled()).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('shows only root-level nodes when first opened', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const labels = getRows().map((row) => row.textContent?.trim());
      expect(labels).toEqual(['Fruits', 'Vegetables', 'Grain']);
    });

    it("expanding a branch's expand button reveals its children without closing or selecting", async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const expandButton = within(getRowByText('Fruits')).getByRole('button');
      await userEvent.click(expandButton);
      await settle(fixture);

      const labels = getRows().map((row) => row.textContent?.trim());
      expect(labels).toEqual(['Fruits', 'Apple', 'Banana', 'Vegetables', 'Grain']);
      expect(getPanel()).not.toBeNull();
      expect(componentInstance.value()).toBeNull();
    });

    it('selects a leaf node, closing the panel and updating the trigger label', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getRowByText('Grain'));
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(componentInstance.value()).toBe('grain');
      expect(
        within(container).getByRole('combobox').textContent?.trim(),
      ).toBe('Grain');
    });

    it('selects a branch node directly (not leaves-only)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getRowByText('Fruits'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('fruits');
      expect(getPanel()).toBeNull();
    });

    it('does not select a disabled node via click', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(
        within(getRowByText('Vegetables')).getByRole('button'),
      );
      await settle(fixture);

      await userEvent.click(getRowByText('Carrot'));
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getPanel()).not.toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      expect(getPanel()).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      await userEvent.click(backdrop);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('supports interaction through the DynamoTreeSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(TreeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeSelectHarness,
      );

      await harness.expandNode('Fruits');
      expect(await harness.getVisibleLabels()).toEqual([
        'Fruits',
        'Apple',
        'Banana',
        'Vegetables',
        'Grain',
      ]);

      await harness.selectByLabel('Banana');
      expect(await harness.isOpen()).toBe(false);
      expect((await harness.getSelectedLabel()).trim()).toBe('Banana');
    });

    it('harness.close() is a no-op when already closed', async () => {
      const { fixture } = renderDynamoComponent(TreeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeSelectHarness,
      );

      await expect(harness.close()).resolves.not.toThrow();
      expect(await harness.isOpen()).toBe(false);
    });

    it('harness.expandNode throws for a leaf with no expand button', async () => {
      const { fixture } = renderDynamoComponent(TreeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeSelectHarness,
      );

      await expect(harness.expandNode('Grain')).rejects.toThrow(
        'Row "Grain" has no children to expand',
      );
    });

    it('harness.expandNode/selectByLabel throw for an unknown label', async () => {
      const { fixture } = renderDynamoComponent(TreeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeSelectHarness,
      );

      await expect(harness.expandNode('Nope')).rejects.toThrow(
        'No row with label "Nope" found',
      );
      await expect(harness.selectByLabel('Nope')).rejects.toThrow(
        'No row with label "Nope" found',
      );
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowDown from the closed trigger opens the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getPanel()).not.toBeNull();
    });

    it('ArrowRight expands a collapsed branch, then moves into its first child on a second press', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = Fruits
      await settle(fixture);

      await userEvent.keyboard('{ArrowRight}'); // expand Fruits
      await settle(fixture);
      expect(getRows().map((r) => r.textContent?.trim())).toEqual([
        'Fruits',
        'Apple',
        'Banana',
        'Vegetables',
        'Grain',
      ]);

      await userEvent.keyboard('{ArrowRight}'); // move into Apple
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('ArrowDown/ArrowUp move the active row among root-level entries', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = Fruits
      await settle(fixture);

      await userEvent.keyboard('{ArrowDown}'); // Vegetables
      await userEvent.keyboard('{Enter}');
      await settle(fixture);
      expect(componentInstance.value()).toBe('veggies');

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      // Reopening seeds the active row to the currently-selected one
      // (Vegetables) — one ArrowUp reaches Fruits directly.
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{Enter}');
      await settle(fixture);
      expect(componentInstance.value()).toBe('fruits');
    });

    it('ArrowLeft collapses an already-expanded branch without moving off it', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = Fruits
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // expand Fruits
      await settle(fixture);
      expect(getRows().map((r) => r.textContent?.trim())).toContain('Apple');

      await userEvent.keyboard('{ArrowLeft}'); // collapse Fruits back
      await settle(fixture);

      expect(getRows().map((r) => r.textContent?.trim())).toEqual([
        'Fruits',
        'Vegetables',
        'Grain',
      ]);
      expect(getPanel()).not.toBeNull();
    });

    it('ArrowLeft collapses an expanded branch, then moves to the parent on a second press', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // expand Fruits
      await userEvent.keyboard('{ArrowRight}'); // move to Apple
      await settle(fixture);

      await userEvent.keyboard('{ArrowLeft}'); // Apple has no children -> move to parent (Fruits)
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('Home/End jump to the first/last visible row', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{End}');
      await userEvent.keyboard('{Enter}');
      await settle(fixture);
      expect(componentInstance.value()).toBe('grain');
    });

    it('Escape closes the panel and refocuses the trigger', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('output events', () => {
    it('propagates a selected value to a bound reactive FormControl', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getRowByText('Grain'));
      await settle(fixture);

      expect(componentInstance.control.value).toBe('grain');
    });

    it('propagates a selected value to an [(ngModel)] binding', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        NgModelHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getRowByText('Grain'));
      await settle(fixture);

      expect(componentInstance.value).toBe('grain');
    });
  });

  describe('state changes', () => {
    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('pea');
      fixture.detectChanges();

      expect(
        within(container).getByRole('combobox').textContent?.trim(),
      ).toBe('Pea');
    });

    it('blocks opening entirely when disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoTreeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose an item', disabled: true } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });
  });

  describe('loading', () => {
    it('renders a spinner in the trigger only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoTreeSelect,
        { inputs: { nodes: NODES, loading: false, ariaLabel: 'Choose' } },
      );
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('sets aria-busy="true" on the trigger while loading', () => {
      const { container } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: NODES, loading: true, ariaLabel: 'Choose' },
      });

      expect(
        within(container).getByRole('combobox').getAttribute('aria-busy'),
      ).toBe('true');
    });

    it('disables the trigger and does not open the panel while loading', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoTreeSelect,
        { inputs: { nodes: NODES, loading: true, ariaLabel: 'Choose' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLButtonElement;
      expect(trigger.disabled).toBe(true);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getPanel()).toBeNull();
    });

    it('re-enables the trigger when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoTreeSelect,
        { inputs: { nodes: NODES, loading: true, ariaLabel: 'Choose' } },
      );
      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      setInputs({ loading: false });

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement)
          .disabled,
      ).toBe(false);
    });
  });

  describe('itemSelect', () => {
    it('emits the full node object when a leaf is clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, { inputs: { nodes: NODES, ariaLabel: 'Choose' } });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getRowByText('Grain'));

      expect(emitted).toEqual([
        { id: 'grain', label: 'Grain', value: 'grain' },
      ]);
    });

    it('emits the same node on keyboard Enter as on click', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, { inputs: { nodes: NODES, ariaLabel: 'Choose' } });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      const trigger = within(container).getByRole('combobox');
      trigger.focus();

      // First ArrowDown only opens the panel (mirrors Select's trigger
      // keydown pattern); two more move from Fruits -> Vegetables -> Grain.
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');

      expect(emitted).toEqual([
        { id: 'grain', label: 'Grain', value: 'grain' },
      ]);
    });

    it('does not emit when expanding a branch via its expand button', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, { inputs: { nodes: NODES, ariaLabel: 'Choose' } });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(
        within(getRowByText('Fruits')).getByRole('button'),
      );

      expect(emitted).toHaveLength(0);
    });

    it('does not emit for a disabled node', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, { inputs: { nodes: NODES, ariaLabel: 'Choose' } });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(
        within(getRowByText('Vegetables')).getByRole('button'),
      );
      await settle(fixture);
      await userEvent.click(getRowByText('Carrot'));

      expect(emitted).toHaveLength(0);
    });
  });

  describe('typeahead', () => {
    const TYPEAHEAD_NODES: DynamoTreeNode<string>[] = [
      { id: 'apple', label: 'Apple', value: 'apple' },
      { id: 'apricot', label: 'Apricot', value: 'apricot' },
      { id: 'banana', label: 'Banana', value: 'banana' },
    ];

    function dispatchKey(target: HTMLElement, key: string): void {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    it('jumps to and opens the panel on the first matching node while closed', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, {
        inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(componentInstance['activeIndex']()).toBe(2);
    });

    it('cycles through nodes sharing the same starting letter on repeated presses', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, {
        inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(1);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container, fixture, componentInstance } =
          renderDynamoComponent<DynamoTreeSelect<string>>(DynamoTreeSelect, {
            inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
          });
        const trigger = within(container).getByRole(
          'combobox',
        ) as HTMLElement;

        dispatchKey(trigger, 'a');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(0);

        vi.advanceTimersByTime(600);

        dispatchKey(trigger, 'b');
        fixture.detectChanges();
        expect(componentInstance['activeIndex']()).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled nodes', () => {
      const nodesWithDisabled: DynamoTreeNode<string>[] = [
        { id: 'apple', label: 'Apple', value: 'apple' },
        { id: 'apricot', label: 'Apricot', value: 'apricot', disabled: true },
      ];
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeSelect<string>
      >(DynamoTreeSelect, {
        inputs: { nodes: nodesWithDisabled, ariaLabel: 'Fruit' },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['activeIndex']()).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('sets aria-expanded on a branch row and none on a leaf row', async () => {
      const { container, fixture } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getRowByText('Fruits').getAttribute('aria-expanded')).toBe(
        'false',
      );
      expect(getRowByText('Grain').getAttribute('aria-expanded')).toBeNull();
    });

    it('has no axe violations', async () => {
      const { container } = renderDynamoComponent(TreeSelectTestHostComponent);
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('renders a flat list with no branches at all', async () => {
      const flatNodes: DynamoTreeNode<string>[] = [
        { id: 'a', label: 'A', value: 'a' },
        { id: 'b', label: 'B', value: 'b' },
      ];
      const { container, fixture } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: flatNodes, ariaLabel: 'Choose an item' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getRows().map((r) => r.textContent?.trim())).toEqual(['A', 'B']);
    });

    it("falls back to a node's id when its value is unset", async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TreeSelectTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await userEvent.click(getRowByText('Fruits'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('fruits');
    });
  });

  describe('virtual scroll', () => {
    it('renders the entry list through dg-virtual-scroll when enabled', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: MANY_NODES, virtualScroll: true, ariaLabel: 'Many' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeTruthy();
    });

    it('still selects a node by click and closes while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoTreeSelect,
        {
          inputs: { nodes: MANY_NODES, virtualScroll: true, ariaLabel: 'Many' },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.click(getRowByText('Node 1'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('n1');
      expect(getPanel()).toBeNull();
    });

    it('keyboard navigation still moves activeIndex while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoTreeSelect,
        {
          inputs: { nodes: MANY_NODES, virtualScroll: true, ariaLabel: 'Many' },
        },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = 0
      await settle(fixture);

      await userEvent.keyboard('{ArrowDown}');
      expect(componentInstance['activeIndex']()).toBe(1);
    });

    it('expand/collapse still updates the flat visible-entry set while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoTreeSelect,
        { inputs: { nodes: NODES, virtualScroll: true, ariaLabel: 'Tree' } },
      );
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      trigger.focus();
      await userEvent.keyboard('{ArrowDown}'); // open, active = Fruits
      await settle(fixture);
      const before = componentInstance['visibleEntries']().length;

      await userEvent.keyboard('{ArrowRight}'); // expand Fruits
      await settle(fixture);

      expect(componentInstance['visibleEntries']().length).toBeGreaterThan(
        before,
      );
    });

    // Regression test for the same bug fixed in DynamoSelect: CDK's
    // `scrollToIndex` is an unconditional absolute scroll — hover must not
    // trigger it, keyboard nav must.
    it('does not scroll the viewport when hovering a row, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: MANY_NODES, virtualScroll: true, ariaLabel: 'Many' },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;
      await userEvent.click(trigger);
      await settle(fixture);
      const viewport = fixture.debugElement.query(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      ).componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(viewport, 'scrollToIndex');

      getRowByText('Node 2').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: MANY_NODES, ariaLabel: 'Many' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getPanel()?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(getRows()).toHaveLength(50);
    });

    it('has no axe violations when open and virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoTreeSelect, {
        inputs: { nodes: MANY_NODES, virtualScroll: true, ariaLabel: 'Many' },
      });

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
