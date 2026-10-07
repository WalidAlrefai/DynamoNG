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
import { DynamoCascadeSelect } from './cascade-select';
import { DynamoCascadeSelectHarness } from './cascade-select.harness';

// jsdom has no real `Element.scrollTo`. When `virtualScroll` is enabled,
// DynamoCascadeSelect's explicit keyboard-nav `scrollActiveIntoView()`
// calls reach the virtual-scroll viewport's `scrollToIndex()` (CDK's
// viewport calls `scrollTo` internally). A minimal stub lets these tests
// exercise the real keyboard-nav-while-virtualized behavior.
if (typeof Element !== 'undefined' && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function (): void {
    /* jsdom gap — see comment above */
  };
}

const MANY_CASCADE_NODES: DynamoTreeNode<string>[] = Array.from(
  { length: 50 },
  (_, i) => ({
    id: `c${i + 1}`,
    label: `Category ${i + 1}`,
    children: [
      { id: `c${i + 1}-a`, label: `Item ${i + 1}A`, value: `c${i + 1}-a` },
      { id: `c${i + 1}-b`, label: `Item ${i + 1}B`, value: `c${i + 1}-b` },
    ],
  }),
);

// USA -> California -> Los Angeles -> Downtown/Uptown is 4 levels deep
// (root=0, state=1, city=2, neighborhood=3) — deliberately deeper than a
// hardcoded 2-3 level special case would need, to prove genuine recursion.
// Also carries a disabled branch (Ontario) and a disabled leaf (Dallas).
const NODES: DynamoTreeNode<string>[] = [
  {
    id: 'usa',
    label: 'USA',
    children: [
      {
        id: 'california',
        label: 'California',
        children: [
          {
            id: 'la',
            label: 'Los Angeles',
            children: [
              { id: 'downtown', label: 'Downtown', value: 'downtown' },
              { id: 'uptown', label: 'Uptown', value: 'uptown' },
            ],
          },
          { id: 'sf', label: 'San Francisco', value: 'sf' },
        ],
      },
      {
        id: 'texas',
        label: 'Texas',
        children: [
          { id: 'austin', label: 'Austin', value: 'austin' },
          { id: 'dallas', label: 'Dallas', value: 'dallas', disabled: true },
        ],
      },
    ],
  },
  {
    id: 'canada',
    label: 'Canada',
    children: [
      {
        id: 'ontario',
        label: 'Ontario',
        disabled: true,
        children: [{ id: 'toronto', label: 'Toronto', value: 'toronto' }],
      },
    ],
  },
  { id: 'mexico', label: 'Mexico', value: 'mexico' },
];

// Every open level (root + every flyout) is portaled into its own
// `.cdk-overlay-container` entry appended near document.body — same
// reasoning as DynamoTreeSelect's/DynamoSelect's specs, just with N
// simultaneously-open panels instead of one.
function getListboxes(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll('[role="listbox"]'));
}

function getRowsIn(listbox: HTMLElement): HTMLElement[] {
  return Array.from(listbox.querySelectorAll('[role="option"]'));
}

function getRowByText(listbox: HTMLElement, text: string): HTMLElement {
  const row = getRowsIn(listbox).find((el) => el.textContent?.trim() === text);
  if (!row) throw new Error(`No row with text "${text}" found in listbox`);
  return row;
}

// The open()-driven overlay attach/detach effect (and this component's own
// flyout-resync effect) run via Angular's zoneless effect scheduler, not
// synchronously with the signal write that triggered them — same technique
// as DynamoTreeSelect's/DynamoSelect's specs.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

// The restore-drilled-path poll (Phase 1) advances one `requestAnimationFrame`
// per level — flush enough frames for even a several-levels-deep restore to
// fully resolve before asserting on it.
async function flushFrames(
  fixture: ComponentFixture<unknown>,
  frames = 25,
): Promise<void> {
  for (let i = 0; i < frames; i++) {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    fixture.detectChanges();
  }
}

@Component({
  selector: 'dg-cascade-select-test-host',
  standalone: true,
  imports: [DynamoCascadeSelect],
  template: `<dg-cascade-select
    [nodes]="nodes"
    [(value)]="value"
    ariaLabel="Choose a location"
  />`,
})
class CascadeSelectTestHostComponent {
  readonly nodes = NODES;
  readonly value = model<string | null>(null);
}

@Component({
  selector: 'dg-cascade-select-reactive-form-host',
  standalone: true,
  imports: [DynamoCascadeSelect, ReactiveFormsModule],
  template: `<dg-cascade-select
    [nodes]="nodes"
    [formControl]="control"
    ariaLabel="Choose a location"
  />`,
})
class ReactiveFormHostComponent {
  readonly nodes = NODES;
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'dg-cascade-select-ng-model-host',
  standalone: true,
  imports: [DynamoCascadeSelect, FormsModule],
  template: `<dg-cascade-select
    [nodes]="nodes"
    [(ngModel)]="value"
    ariaLabel="Choose a location"
  />`,
})
class NgModelHostComponent {
  readonly nodes = NODES;
  value: string | null = null;
}

describe('DynamoCascadeSelect', () => {
  describe('creation', () => {
    it('renders a combobox trigger', () => {
      const { container } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render any panel until opened', () => {
      renderDynamoComponent(CascadeSelectTestHostComponent);

      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder when nothing is selected', () => {
      const { container } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Select...',
      );
    });
  });

  describe('single-level selection', () => {
    it('clicking a root-level leaf commits the value and closes the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.value()).toBe('mexico');
      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('clearable', () => {
    it('defaults to false, rendering no clear button even with a value selected', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, value: 'mexico' } },
      );

      expect(componentInstance.clearable()).toBe(false);
      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });

    it('clears the value and closes the panel when the clear button is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, value: 'mexico', clearable: true } },
      );

      await userEvent.click(
        within(container).getByRole('button', { name: 'Clear selection' }),
      );

      expect(componentInstance.value()).toBeNull();
      expect(getListboxes()).toHaveLength(0);
    });

    it('does not render a clear button when nothing is selected, even if clearable', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: { nodes: NODES, clearable: true },
      });

      expect(
        within(container).queryByRole('button', { name: 'Clear selection' }),
      ).toBeNull();
    });
  });

  describe('multi-level drill-down', () => {
    it('hovering a branch opens a second panel showing its children', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
      const level1Labels = getRowsIn(getListboxes()[1]!).map((r) =>
        r.textContent?.trim(),
      );
      expect(level1Labels).toEqual(['California', 'Texas']);
    });

    it('drills 4 levels deep (root -> state -> city -> neighborhood) and commits the deep leaf', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'California').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[2]!, 'Los Angeles').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(4);
      getRowByText(getListboxes()[3]!, 'Downtown').click();
      await settle(fixture);

      expect(componentInstance.value()).toBe('downtown');
      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('sibling-switch truncation', () => {
    it("hovering a sibling branch collapses the previous branch's deeper flyout", async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'California').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(getListboxes()).toHaveLength(3);

      getRowByText(getListboxes()[1]!, 'Texas').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(3);
      const level2Labels = getRowsIn(getListboxes()[2]!).map((r) =>
        r.textContent?.trim(),
      );
      expect(level2Labels).toEqual(['Austin', 'Dallas']);
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowDown opens the closed panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      trigger.focus();
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(getListboxes()).toHaveLength(1);
      expect(componentInstance.value()).toBeNull();
    });

    it('ArrowDown/Up move within the current level', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('mexico');
    });

    it('ArrowUp moves backward within the current level', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger); // active is USA (index 0)
      await settle(fixture);
      await userEvent.keyboard('{End}'); // Mexico (index 2)
      await settle(fixture);
      await userEvent.keyboard('{ArrowUp}'); // Canada (index 1)
      await settle(fixture);
      await userEvent.keyboard('{ArrowUp}'); // back to USA (index 0)
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // USA is a branch, drills in
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
    });

    it('Home/End jump to the first/last enabled row within the current level', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger); // opens on USA (index 0)
      await settle(fixture);
      await userEvent.keyboard('{End}');
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);
      expect(componentInstance.value()).toBe('mexico'); // End -> last root (Mexico)

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{End}');
      await settle(fixture);
      await userEvent.keyboard('{Home}');
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // Enter on USA (a branch) drills in, doesn't select
      await settle(fixture);
      expect(getListboxes()).toHaveLength(2);
    });

    it('Enter on a branch drills in rather than committing a value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.keyboard('{Enter}'); // active is USA (a branch)
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getListboxes()).toHaveLength(2);
    });

    it('ArrowRight drills into a branch, ArrowLeft backs out one level', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger); // opens on USA (first enabled root)
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // drill into USA's children
      await settle(fixture);
      expect(getListboxes()).toHaveLength(2);

      await userEvent.keyboard('{ArrowLeft}'); // back out to root
      await settle(fixture);
      expect(getListboxes()).toHaveLength(1);
    });

    it('Enter on a leaf commits the value; Escape closes everything', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // USA -> California/Texas
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // California -> LA/SF
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}'); // SF
      await settle(fixture);
      await userEvent.keyboard('{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('sf');
      expect(getListboxes()).toHaveLength(0);
    });

    it('Escape closes every open level at once', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger);
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}');
      await settle(fixture);
      expect(getListboxes()).toHaveLength(3);

      await userEvent.keyboard('{Escape}');
      await settle(fixture);

      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('disabled nodes', () => {
    it('a disabled branch does not open its children on hover or ArrowRight', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Canada').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
      getRowByText(getListboxes()[1]!, 'Ontario').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2); // Ontario's children never open
    });

    it('a disabled leaf cannot be selected by click or Enter', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'Texas').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      getRowByText(getListboxes()[2]!, 'Dallas').click();
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
      expect(getListboxes()).toHaveLength(3);
    });
  });

  describe('user interactions', () => {
    it('opens and closes through the DynamoCascadeSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(CascadeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCascadeSelectHarness,
      );

      expect(await harness.isOpen()).toBe(false);
      await harness.open();
      expect(await harness.isOpen()).toBe(true);
      await harness.close();
      expect(await harness.isOpen()).toBe(false);
    });

    it('supports drilling and selecting through the DynamoCascadeSelectHarness', async () => {
      const { fixture } = renderDynamoComponent(CascadeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCascadeSelectHarness,
      );

      await harness.selectPath('USA', 'California', 'San Francisco');

      expect(await harness.getSelectedLabel()).toBe('San Francisco');
      expect(await harness.isOpen()).toBe(false);
    });

    it('reports the visible labels at a given level through the harness', async () => {
      const { fixture } = renderDynamoComponent(CascadeSelectTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCascadeSelectHarness,
      );

      await harness.drillInto('USA');

      expect(await harness.getVisibleLabelsAtLevel(0)).toEqual([
        'USA',
        'Canada',
        'Mexico',
      ]);
      expect(await harness.getVisibleLabelsAtLevel(1)).toEqual([
        'California',
        'Texas',
      ]);
    });

    it('filters, reports, and selects a filtered result through the harness', async () => {
      const { fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoCascadeSelectHarness,
      );

      await harness.filter('austin');

      expect(await harness.getFilteredResults()).toEqual([
        'Austin — USA / Texas',
      ]);

      await harness.clickFilteredResult('Austin');

      expect(componentInstance.value()).toBe('austin');
      expect(await harness.isOpen()).toBe(false);
    });
  });

  describe('output events', () => {
    it('propagates the committed value to a bound reactive FormControl', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.control.value).toBe('mexico');
    });

    it('propagates the committed value to an [(ngModel)] binding', async () => {
      const { container, fixture, componentInstance } =
        renderDynamoComponent(NgModelHostComponent);

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.value).toBe('mexico');
    });
  });

  describe('backdrop', () => {
    it('clicking the backdrop while several levels deep closes everything', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(getListboxes()).toHaveLength(2);

      (
        document.body.querySelector('.cdk-overlay-backdrop') as HTMLElement
      ).click();
      await settle(fixture);

      expect(getListboxes()).toHaveLength(0);
    });

    it('renders exactly one backdrop regardless of how many levels are open', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'California').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(
        document.body.querySelectorAll('.cdk-overlay-backdrop'),
      ).toHaveLength(1);
    });
  });

  describe('loading', () => {
    it('renders a spinner in the trigger only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, loading: false, ariaLabel: 'Location' } },
      );
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('sets aria-busy="true" on the trigger while loading', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: { nodes: NODES, loading: true, ariaLabel: 'Location' },
      });

      expect(
        within(container).getByRole('combobox').getAttribute('aria-busy'),
      ).toBe('true');
    });

    it('disables the trigger and does not open the panel while loading', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, loading: true, ariaLabel: 'Location' } },
      );
      const trigger = within(container).getByRole(
        'combobox',
      ) as HTMLButtonElement;
      expect(trigger.disabled).toBe(true);

      await userEvent.click(trigger);
      await settle(fixture);

      expect(getListboxes()).toHaveLength(0);
    });

    it('re-enables the trigger when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, loading: true, ariaLabel: 'Location' } },
      );
      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(true);

      setInputs({ loading: false });

      expect(
        (within(container).getByRole('combobox') as HTMLButtonElement).disabled,
      ).toBe(false);
    });
  });

  describe('itemSelect', () => {
    it('emits the full leaf node object when clicked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Location' },
      });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(emitted).toEqual([
        { id: 'mexico', label: 'Mexico', value: 'mexico' },
      ]);
    });

    it('emits the same leaf node on keyboard Enter as on click', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Location' },
      });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      const trigger = within(container).getByRole('combobox');
      trigger.focus();

      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');

      expect(emitted).toEqual([
        { id: 'mexico', label: 'Mexico', value: 'mexico' },
      ]);
    });

    it('does not emit while drilling into a branch', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Location' },
      });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(emitted).toHaveLength(0);
    });

    it('does not emit for a disabled leaf', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Location' },
      });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'Texas').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[2]!, 'Dallas').click();
      await settle(fixture);

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

    it('jumps to and opens the panel on the first matching root node while closed', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(getListboxes()).toHaveLength(1);
      expect(componentInstance['levels']()[0]?.activeIndex).toBe(2);
    });

    it('cycles through nodes sharing the same starting letter on repeated presses', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['levels']()[0]?.activeIndex).toBe(1);

      dispatchKey(trigger, 'a');
      fixture.detectChanges();
      expect(componentInstance['levels']()[0]?.activeIndex).toBe(0);
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container, fixture, componentInstance } = renderDynamoComponent<
          DynamoCascadeSelect<string>
        >(DynamoCascadeSelect, {
          inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
        });
        const trigger = within(container).getByRole('combobox') as HTMLElement;

        dispatchKey(trigger, 'a');
        fixture.detectChanges();
        expect(componentInstance['levels']()[0]?.activeIndex).toBe(0);

        vi.advanceTimersByTime(600);

        dispatchKey(trigger, 'b');
        fixture.detectChanges();
        expect(componentInstance['levels']()[0]?.activeIndex).toBe(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('clears the buffer on a level switch (ArrowRight/ArrowLeft)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Location' },
      });
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'u'); // buffers "u" against root — matches USA
      fixture.detectChanges();
      // Drill into USA, which should clear the "u" buffer so it doesn't
      // leak into matching against USA's own children.
      dispatchKey(trigger, 'ArrowRight');
      fixture.detectChanges();

      dispatchKey(trigger, 't'); // matches "Texas" among USA's children
      fixture.detectChanges();

      expect(componentInstance['levels']()[1]?.activeIndex).toBe(1);
    });

    it('does not emit itemSelect while jumping between root nodes via typeahead', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: TYPEAHEAD_NODES, ariaLabel: 'Fruit' },
      });
      const emitted: DynamoTreeNode<string>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      dispatchKey(trigger, 'b');
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with the root panel open', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      await expect(
        expectNoA11yViolations(getListboxes()[0]!),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with several levels open', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      for (const listbox of getListboxes()) {
        await expect(expectNoA11yViolations(listbox)).resolves.toBeUndefined();
      }
    });
  });

  describe('state changes', () => {
    it('reflects an externally-set FormControl value (writeValue)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.setValue('sf');
      fixture.detectChanges();

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'San Francisco',
      );
    });

    it('blocks opening when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      within(container).getByRole('combobox').click();
      fixture.detectChanges();

      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('filter', () => {
    // The filter box wraps the root listbox as a sibling, not a descendant
    // (see cascade-select.html: it lives outside the `role="listbox"` div,
    // matching @dynamong/select's own filter-box/listbox structure, so the
    // listbox's only ARIA children are its own option rows). It only ever
    // renders once (root panel, `!levelIndex`), so a document-wide query is
    // unambiguous.
    function getFilterInput(): HTMLInputElement {
      return document.body.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
    }

    it('renders no filter box by default', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        getListboxes()[0]!.querySelector('input[type="search"]'),
      ).toBeNull();
    });

    it('renders a filter box only in the root panel when filterable is enabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
      expect(getFilterInput()).not.toBeNull();
      expect(
        getListboxes()[1]!.querySelector('input[type="search"]'),
      ).toBeNull();
    });

    it('narrows to leaves whose own label matches', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'austin');
      await settle(fixture);

      const labels = getRowsIn(getListboxes()[0]!).map((r) =>
        r.textContent?.trim(),
      );
      expect(labels).toEqual(['Austin — USA / Texas']);
    });

    it('surfaces every leaf descendant when an ancestor label matches', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'california');
      await settle(fixture);

      const labels = getRowsIn(getListboxes()[0]!).map((r) =>
        r.textContent?.trim(),
      );
      expect(labels).toEqual([
        'Downtown — USA / California / Los Angeles',
        'Uptown — USA / California / Los Angeles',
        'San Francisco — USA / California',
      ]);
    });

    it('excludes a leaf under a disabled ancestor even when directly matched', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'toronto');
      await settle(fixture);

      // No-results state isn't `role="listbox"` (see cascade-select.html),
      // so it no longer shows up via getListboxes() — query the overlay
      // container directly instead.
      const overlay = document.body.querySelector(
        '.cdk-overlay-container',
      ) as HTMLElement;
      expect(overlay.querySelectorAll('[role="option"]')).toHaveLength(0);
      expect(overlay.textContent).toContain('No matching options');
    });

    it('still shows a disabled leaf with enabled ancestors, marked aria-disabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'dallas');
      await settle(fixture);

      const row = getRowByText(getListboxes()[0]!, 'Dallas — USA / Texas');
      expect(row.getAttribute('aria-disabled')).toBe('true');
    });

    it('clicking a filtered result commits the value and closes the panel', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect<string>,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'austin');
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Austin — USA / Texas').click();
      await settle(fixture);

      expect(componentInstance.value()).toBe('austin');
      expect(getListboxes()).toHaveLength(0);
    });

    it('Enter commits the active filtered result', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect<string>,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'austin');
      await settle(fixture);
      await userEvent.type(getFilterInput(), '{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('austin');
      expect(getListboxes()).toHaveLength(0);
    });

    it('ArrowDown/ArrowUp move the active filtered row', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect<string>,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'california');
      await settle(fixture);
      await userEvent.type(getFilterInput(), '{ArrowDown}{ArrowDown}{Enter}');
      await settle(fixture);

      expect(componentInstance.value()).toBe('sf');
    });

    it('typing while a child flyout is open closes it', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(getListboxes()).toHaveLength(2);

      await userEvent.type(getFilterInput(), 'a');
      await settle(fixture);

      expect(getListboxes()).toHaveLength(1);
    });

    it('the first Escape clears the filter and restores normal browsing', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), 'austin');
      await settle(fixture);

      await userEvent.type(getFilterInput(), '{Escape}');
      await settle(fixture);

      expect(getListboxes()).toHaveLength(1);
      expect(getFilterInput().value).toBe('');
      const labels = getRowsIn(getListboxes()[0]!).map((r) =>
        r.textContent?.trim(),
      );
      expect(labels).toEqual(['USA', 'Canada', 'Mexico']);
    });

    it('a second Escape (or Escape while already blank) closes the panel', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.type(getFilterInput(), '{Escape}');
      await settle(fixture);

      expect(getListboxes()).toHaveLength(0);
    });

    it('does not react to typeahead letter keys while filterable', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoCascadeSelect<string>
      >(DynamoCascadeSelect, {
        inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' },
      });
      const trigger = within(container).getByRole('combobox') as HTMLElement;

      trigger.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'm',
          bubbles: true,
          cancelable: true,
        }),
      );
      fixture.detectChanges();

      expect(getListboxes()).toHaveLength(0);
      expect(componentInstance.value()).toBeNull();
    });

    describe('with virtual scroll', () => {
      it('renders the filtered list through dg-virtual-scroll and selects correctly', async () => {
        const { container, fixture, componentInstance } = renderDynamoComponent(
          DynamoCascadeSelect,
          {
            inputs: {
              nodes: MANY_CASCADE_NODES,
              filterable: true,
              virtualScroll: true,
              ariaLabel: 'Many',
            },
          },
        );

        await userEvent.click(within(container).getByRole('combobox'));
        await settle(fixture);
        const filterInput = getFilterInput();
        await userEvent.type(filterInput, 'Item 5A');
        await settle(fixture);

        expect(
          getListboxes()[0]!.querySelector('dg-virtual-scroll'),
        ).toBeTruthy();
        getRowByText(getListboxes()[0]!, 'Item 5A — Category 5').click();
        await settle(fixture);

        expect(componentInstance.value()).toBe('c5-a');
      });
    });

    describe('accessibility', () => {
      it('has no axe violations with the filter box shown', async () => {
        const { container, fixture } = renderDynamoComponent(
          DynamoCascadeSelect,
          { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
        );

        await userEvent.click(within(container).getByRole('combobox'));
        await settle(fixture);

        await expect(
          expectNoA11yViolations(getListboxes()[0]!),
        ).resolves.toBeUndefined();
      });

      it('has no axe violations in the no-results state', async () => {
        const { container, fixture } = renderDynamoComponent(
          DynamoCascadeSelect,
          { inputs: { nodes: NODES, filterable: true, ariaLabel: 'Location' } },
        );

        await userEvent.click(within(container).getByRole('combobox'));
        await settle(fixture);
        await userEvent.type(getFilterInput(), 'zzz-no-match');
        await settle(fixture);

        // The no-results container isn't role="listbox" (see cascade-select.html),
        // so it no longer matches getListboxes() — check the whole overlay instead.
        await expect(
          expectNoA11yViolations(
            document.body.querySelector(
              '.cdk-overlay-container',
            ) as HTMLElement,
          ),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('virtual scroll', () => {
    it('renders the root level through dg-virtual-scroll when enabled', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        getListboxes()[0]?.querySelector('dg-virtual-scroll'),
      ).toBeTruthy();
    });

    it('hovering a branch row still opens its flyout, also virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Category 1').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
      expect(
        getListboxes()[1]?.querySelector('dg-virtual-scroll'),
      ).toBeTruthy();
    });

    it('selecting a leaf through a virtualized flyout still sets the value', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Category 1').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      await userEvent.click(getRowByText(getListboxes()[1]!, 'Item 1A'));
      await settle(fixture);

      expect(componentInstance.value()).toBe('c1-a');
    });

    it('keyboard ArrowDown still moves the active row of the current level while virtualized', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      await userEvent.keyboard('{ArrowDown}');
      await settle(fixture);

      expect(componentInstance['levels']()[0]?.activeIndex).toBe(1);
    });

    // Regression test for the same bug fixed in DynamoSelect: hovering a row
    // must not call the viewport's absolute `scrollToIndex`; keyboard nav
    // must.
    it('does not scroll a level when hovering its rows, only on keyboard navigation', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const rootViewport = fixture.debugElement.queryAll(
        (node) => node.componentInstance instanceof DynamoVirtualScroll,
      )[0]!.componentInstance as DynamoVirtualScroll<unknown>;
      const scrollSpy = vi.spyOn(rootViewport, 'scrollToIndex');

      getRowByText(getListboxes()[0]!, 'Category 3').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      expect(scrollSpy).not.toHaveBeenCalled();

      await userEvent.keyboard('{ArrowDown}');
      expect(scrollSpy).toHaveBeenCalled();
    });

    it('does not virtualize when virtualScroll is left at its default (false)', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: { nodes: MANY_CASCADE_NODES, ariaLabel: 'Many' },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getListboxes()[0]?.querySelector('dg-virtual-scroll')).toBeNull();
      expect(getRowsIn(getListboxes()[0]!)).toHaveLength(50);
    });

    it('has no axe violations when open and virtualized', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

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

describe('DynamoCascadeSelect — baseline parity (Phase 0)', () => {
  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/trigger/chevron/clear/panel/row/caret/filterInput/no-results', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            value: 'mexico',
            clearable: true,
            filterable: true,
            ariaLabel: 'Choose a location',
            pt: {
              root: { class: 'pt-root' },
              trigger: { class: 'pt-trigger' },
              chevron: { class: 'pt-chevron' },
              clear: { class: 'pt-clear' },
              panel: { class: 'pt-panel' },
              row: { class: 'pt-row' },
              caret: { class: 'pt-caret' },
              filterInput: { class: 'pt-filter-input' },
              'no-results': { class: 'pt-no-results' },
            },
          },
        },
      );

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(container.querySelector('.pt-trigger')).not.toBeNull();
      expect(container.querySelector('.pt-chevron')).not.toBeNull();
      expect(container.querySelector('.pt-clear')).not.toBeNull();

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(document.querySelector('.pt-panel')).not.toBeNull();
      expect(document.querySelectorAll('.pt-row').length).toBeGreaterThan(0);
      expect(document.querySelector('.pt-caret')).not.toBeNull();
      expect(document.querySelector('.pt-filter-input')).not.toBeNull();
    });

    it('merges pt class onto the no-results row while filtering', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            filterable: true,
            ariaLabel: 'Choose a location',
            filterText: 'zzz-no-match',
            pt: { 'no-results': { class: 'pt-no-results' } },
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(document.querySelector('.pt-no-results')).not.toBeNull();
    });
  });

  describe('ariaDescribedby / fluid', () => {
    it('defaults fluid to true', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Choose a location' },
      });
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('drops w-full when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: { nodes: NODES, ariaLabel: 'Choose a location', fluid: false },
      });
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('forwards ariaDescribedby to the trigger', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: {
          nodes: NODES,
          ariaLabel: 'Choose a location',
          ariaDescribedby: 'help-text',
        },
      });
      expect(
        within(container)
          .getByRole('combobox')
          .getAttribute('aria-describedby'),
      ).toBe('help-text');
    });
  });

  describe('readOnly', () => {
    it('sets aria-readonly on the trigger', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: {
          nodes: NODES,
          ariaLabel: 'Choose a location',
          readOnly: true,
        },
      });
      expect(
        within(container).getByRole('combobox').getAttribute('aria-readonly'),
      ).toBe('true');
    });

    it('blocks committing a leaf while still allowing the panel to open and drill', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            readOnly: true,
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      expect(getListboxes()).toHaveLength(1);

      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.value()).toBeNull();
    });

    it('blocks clearValue', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: {
          nodes: NODES,
          ariaLabel: 'Choose a location',
          value: 'mexico',
          clearable: true,
          readOnly: true,
        },
      });

      const clearButton = within(container).getByRole('button', {
        name: 'Clear selection',
      });
      clearButton.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );

      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Mexico',
      );
    });
  });

  describe('aria-controls', () => {
    it('points at the deepest open level, not always level 0', async () => {
      const { container, fixture } = renderDynamoComponent(
        CascadeSelectTestHostComponent,
      );
      const trigger = within(container).getByRole('combobox');

      await userEvent.click(trigger); // opens on USA (first enabled root)
      await settle(fixture);
      expect(trigger.getAttribute('aria-controls')).toBe(getListboxes()[0]?.id);

      await userEvent.keyboard('{ArrowRight}'); // USA -> California/Texas
      await settle(fixture);
      await userEvent.keyboard('{ArrowRight}'); // California -> LA/SF
      await settle(fixture);

      expect(getListboxes()).toHaveLength(3);
      expect(trigger.getAttribute('aria-controls')).toBe(getListboxes()[2]?.id);
    });
  });

  describe('branch row aria-haspopup / aria-owns', () => {
    it('sets aria-haspopup on branch rows, not leaf rows', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose a location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      const branchRow = getRowByText(getListboxes()[0]!, 'USA');
      const leafRow = getRowByText(getListboxes()[0]!, 'Mexico');
      expect(branchRow.getAttribute('aria-haspopup')).toBe('listbox');
      expect(leafRow.hasAttribute('aria-haspopup')).toBe(false);
    });

    it('sets aria-owns on a branch row only once its flyout is open', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose a location' } },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const branchRow = getRowByText(getListboxes()[0]!, 'USA');
      expect(branchRow.hasAttribute('aria-owns')).toBe(false);

      branchRow.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await settle(fixture);

      expect(branchRow.getAttribute('aria-owns')).toBe(getListboxes()[1]?.id);
    });
  });

  describe('filter box genuinely disables', () => {
    it('disables the native input and does not update filterText when disabled() is set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            filterable: true,
            disabled: true,
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      // disabled() also makes the trigger itself non-interactive via
      // isDisabled() — but the click handler guard lives in toggle(), so
      // confirm the panel never actually opened as the precondition here.
      expect(getListboxes()).toHaveLength(0);
      expect(componentInstance.filterText()).toBe('');
    });

    it('disables the native input and does not update filterText when readOnly() is set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            filterable: true,
            readOnly: true,
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const input = document.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      expect(input.disabled).toBe(true);

      input.value = 'a';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(componentInstance.filterText()).toBe('');
    });

    it('stays enabled and updates filterText when neither disabled() nor readOnly() is set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            filterable: true,
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      const input = document.querySelector(
        'input[type="search"]',
      ) as HTMLInputElement;
      expect(input.disabled).toBe(false);

      input.value = 'Mexico';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(componentInstance.filterText()).toBe('Mexico');
    });
  });

  describe('hover-anchor fix (virtualized)', () => {
    it('every rapid hover across virtualized rows actually opens its flyout', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: MANY_CASCADE_NODES,
            virtualScroll: true,
            ariaLabel: 'Many',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      // Hovering a different sibling in the same level truncates the
      // previous one's flyout and opens the new one (the component's own
      // "sibling-switch truncation" behavior) — so each iteration below
      // independently proves that label's own flyout actually opened,
      // without needing to manually tear anything down between hovers.
      for (const label of ['Category 1', 'Category 2', 'Category 3']) {
        getRowByText(getListboxes()[0]!, label).dispatchEvent(
          new MouseEvent('mouseenter', { bubbles: true }),
        );
        await settle(fixture);
        expect(getListboxes()).toHaveLength(2);
        expect(
          getRowsIn(getListboxes()[1]!).some((row) =>
            row.textContent?.includes(
              `Item ${label.replace('Category ', '')}A`,
            ),
          ),
        ).toBe(true);
      }
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with pt/ariaDescribedby/fluid/readOnly set', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            ariaDescribedby: 'help-text',
          },
        },
      );

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

describe('DynamoCascadeSelect — restore drilled path on reopen (Phase 1)', () => {
  it('restores a 3-level drilled path (USA -> Texas -> Austin) on reopen', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      CascadeSelectTestHostComponent,
    );
    componentInstance.value.set('austin');
    fixture.detectChanges();

    await userEvent.click(within(container).getByRole('combobox'));
    await flushFrames(fixture);

    expect(getListboxes()).toHaveLength(3);
    expect(
      getRowsIn(getListboxes()[0]!).some(
        (r) => r.textContent?.trim() === 'USA',
      ),
    ).toBe(true);
    expect(
      getRowsIn(getListboxes()[1]!).some(
        (r) => r.textContent?.trim() === 'Texas',
      ),
    ).toBe(true);
    expect(
      getRowsIn(getListboxes()[2]!).some(
        (r) => r.textContent?.trim() === 'Austin',
      ),
    ).toBe(true);
  });

  it('restores a 4-level drilled path (USA -> California -> Los Angeles -> Uptown) on reopen', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      CascadeSelectTestHostComponent,
    );
    componentInstance.value.set('uptown');
    fixture.detectChanges();

    await userEvent.click(within(container).getByRole('combobox'));
    await flushFrames(fixture);

    expect(getListboxes()).toHaveLength(4);
    expect(
      getRowsIn(getListboxes()[3]!).some(
        (r) => r.textContent?.trim() === 'Uptown',
      ),
    ).toBe(true);
  });

  it('keyboard ArrowUp/Down immediately operates on the deepest restored level, no extra ArrowRight needed', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      CascadeSelectTestHostComponent,
    );
    componentInstance.value.set('uptown');
    fixture.detectChanges();

    await userEvent.click(within(container).getByRole('combobox'));
    await flushFrames(fixture);

    const trigger = within(container).getByRole('combobox');
    const beforeId = trigger.getAttribute('aria-activedescendant');
    await userEvent.keyboard('{ArrowUp}'); // Uptown -> Downtown, within the deepest level
    await settle(fixture);
    const afterId = trigger.getAttribute('aria-activedescendant');

    expect(afterId).not.toBe(beforeId);
    expect(afterId).toContain(getListboxes()[3]?.id ?? '__none__');
  });

  it('a value with no match anywhere falls back to root-only, exactly like before this phase', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      CascadeSelectTestHostComponent,
    );
    componentInstance.value.set('does-not-exist' as unknown as string);
    fixture.detectChanges();

    await userEvent.click(within(container).getByRole('combobox'));
    await flushFrames(fixture);

    expect(getListboxes()).toHaveLength(1);
  });

  it('restores a virtualized level by scrolling it into view before drilling further', async () => {
    // jsdom's CDK virtual-scroll layout simulation is incomplete (no real
    // viewport measurement), so this can't reliably assert the full
    // DOM-mount-and-open outcome under virtualization the way the
    // non-virtualized restoration tests above do — same limitation already
    // documented for TreeTable's/Tree's own virtual-scroll focus-landing
    // tests. Assert the one thing that IS reliably verifiable here: the
    // root level's virtual-scroll viewport gets scrolled to the right
    // index as part of the restore walk. The full mounted-and-opened
    // outcome is confirmed live in the browser instead (see the plan's own
    // Phase 1 status notes).
    const { container, fixture } = renderDynamoComponent(DynamoCascadeSelect, {
      inputs: {
        nodes: MANY_CASCADE_NODES,
        virtualScroll: true,
        ariaLabel: 'Many',
        value: 'c30-a',
      },
    });

    // click + a single settle() (setTimeout(0), no requestAnimationFrame)
    // lets the root level's overlay attach and its virtual-scroll viewport
    // mount, without yet running any of the restore poll's own rAF-gated
    // frames — so the spy below is attached before the scroll it's meant
    // to observe.
    await userEvent.click(within(container).getByRole('combobox'));
    await settle(fixture);
    const rootViewport = fixture.debugElement.queryAll(
      (node) => node.componentInstance instanceof DynamoVirtualScroll,
    )[0]!.componentInstance as DynamoVirtualScroll<unknown>;
    const scrollSpy = vi.spyOn(rootViewport, 'scrollToIndex');

    await flushFrames(fixture);

    expect(scrollSpy).toHaveBeenCalledWith(29); // Category 30, 0-indexed
  });

  it('a rapid close-then-reopen with a different value does not let a stale poll corrupt the new opens levels', async () => {
    const { container, fixture, componentInstance } = renderDynamoComponent(
      DynamoCascadeSelect,
      {
        inputs: {
          nodes: NODES,
          ariaLabel: 'Choose a location',
          value: 'uptown', // deep value, several poll frames to restore
        },
      },
    );

    await userEvent.click(within(container).getByRole('combobox'));
    // Let the restore poll get partway, then close and reopen on a
    // different, shallower value before it has a chance to finish.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    componentInstance.close();
    componentInstance.value.set('mexico');
    fixture.detectChanges();
    await userEvent.click(within(container).getByRole('combobox'));
    await flushFrames(fixture);

    // mexico is a root-level leaf — the new open should settle at exactly
    // one listbox, with no stale USA/California/... levels bleeding in from
    // the aborted previous open's poll.
    expect(getListboxes()).toHaveLength(1);
  });
});

describe('DynamoCascadeSelect — selectionMode (Phase 2)', () => {
  describe('"single" (default) — baseline regression', () => {
    it('replaces the value and closes the panel on pick, explicitly set', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'single',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.value()).toBe('mexico');
      expect(getListboxes()).toHaveLength(0);
    });

    it('sets aria-multiselectable to false on the listbox', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose a location' } },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getListboxes()[0]?.getAttribute('aria-multiselectable')).toBe(
        'false',
      );
    });

    it('renders no checkbox indicators', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose a location' } },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(
        getListboxes()[0]?.querySelector('[aria-hidden="true"].rounded-sm'),
      ).toBeNull();
    });
  });

  describe('"multiple" — plain non-cascading toggle', () => {
    it('toggles plain membership without cascading, keeps the panel open', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'multiple',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual(['mexico']);
      expect(getListboxes()).toHaveLength(1); // still open

      getRowByText(getListboxes()[0]!, 'USA').click(); // a branch — toggles only itself, no cascade
      await settle(fixture);
      expect((componentInstance.value() as string[]).sort()).toEqual([
        'mexico',
        'usa',
      ]);

      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);
      expect(componentInstance.value()).toEqual(['usa']);
    });

    it('hover/ArrowRight still drill, independent of click-to-toggle', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'multiple',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);

      expect(getListboxes()).toHaveLength(2);
      expect(
        getRowsIn(getListboxes()[1]!).some(
          (r) => r.textContent?.trim() === 'California',
        ),
      ).toBe(true);
    });

    it('sets aria-multiselectable to true on the listbox', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'multiple',
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getListboxes()[0]?.getAttribute('aria-multiselectable')).toBe(
        'true',
      );
    });

    it('renders a comma-joined trigger label, in tree order rather than value-array order', () => {
      const { container } = renderDynamoComponent(DynamoCascadeSelect, {
        inputs: {
          nodes: NODES,
          ariaLabel: 'Choose a location',
          selectionMode: 'multiple',
          value: ['mexico', 'austin'], // mexico listed first, but...
        },
      });

      // ...Austin (USA -> Texas -> Austin) legitimately comes before the
      // root-level Mexico leaf in tree order, which is what the label
      // reflects — not the order values appear in the array.
      expect(within(container).getByRole('combobox').textContent?.trim()).toBe(
        'Austin, Mexico',
      );
    });
  });

  describe('"checkbox" — tri-state cascade', () => {
    it('checking a branch cascades to its enabled descendants', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      getRowByText(getListboxes()[1]!, 'California').click();
      await settle(fixture);

      expect((componentInstance.value() as string[]).sort()).toEqual(
        ['california', 'downtown', 'la', 'sf', 'uptown'].sort(),
      );
      expect(getListboxes().length).toBeGreaterThan(0); // still open
    });

    it('unchecking a fully-checked branch reverses the cascade', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      const california = getRowByText(getListboxes()[1]!, 'California');
      california.click();
      await settle(fixture);
      california.click();
      await settle(fixture);

      expect(componentInstance.value()).toEqual([]);
    });

    it('skips disabled descendants when cascading and leaves the branch indeterminate', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      const texas = getRowByText(getListboxes()[1]!, 'Texas');
      texas.click();
      await settle(fixture);

      // Austin (enabled) is cascaded in; Dallas (disabled) is excluded — the
      // branch itself can never read as fully "checked" as a result.
      expect((componentInstance.value() as string[]).sort()).toEqual(
        ['austin', 'texas'].sort(),
      );
      expect(texas.getAttribute('aria-checked')).toBe('mixed');
    });

    it('sets aria-multiselectable to true on the listbox', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getListboxes()[0]?.getAttribute('aria-multiselectable')).toBe(
        'true',
      );
    });

    it('merges pt class onto the checkbox indicator', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
            pt: { checkbox: { class: 'pt-checkbox' } },
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);

      expect(getListboxes()[0]?.querySelector('.pt-checkbox')).not.toBeNull();
    });

    it('has no axe violations', async () => {
      const { container, fixture } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );
      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').click();
      await settle(fixture);

      await expect(
        expectNoA11yViolations(
          document.body.querySelector('.cdk-overlay-container') as HTMLElement,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('itemSelect cardinality', () => {
    it('fires once per direct interaction in "single" mode', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        { inputs: { nodes: NODES, ariaLabel: 'Choose a location' } },
      );
      const emits: unknown[] = [];
      componentInstance.itemSelect.subscribe((n) => emits.push(n));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'Mexico').click();
      await settle(fixture);

      expect(emits).toHaveLength(1);
    });

    it('fires once per click in "checkbox" mode, never once-per-cascaded-descendant', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'checkbox',
          },
        },
      );
      const emits: unknown[] = [];
      componentInstance.itemSelect.subscribe((n) => emits.push(n));

      await userEvent.click(within(container).getByRole('combobox'));
      await settle(fixture);
      getRowByText(getListboxes()[0]!, 'USA').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settle(fixture);
      // California cascades to 5 values (itself + 4 descendants), but this
      // is ONE user interaction — itemSelect must fire once, not 5 times.
      getRowByText(getListboxes()[1]!, 'California').click();
      await settle(fixture);

      expect(emits).toHaveLength(1);
    });
  });

  describe('value as a reactive-forms CVA round-trip', () => {
    it('writeValue/registerOnChange both work with an array value', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoCascadeSelect,
        {
          inputs: {
            nodes: NODES,
            ariaLabel: 'Choose a location',
            selectionMode: 'multiple',
          },
        },
      );
      void container;
      void fixture;

      let emitted: unknown;
      componentInstance.registerOnChange((v) => {
        emitted = v;
      });
      componentInstance.writeValue(['mexico', 'austin']);

      expect(componentInstance.value()).toEqual(['mexico', 'austin']);

      (
        componentInstance as unknown as {
          toggleMultiple: (node: { id: string; value?: string }) => void;
        }
      ).toggleMultiple({ id: 'mx2', value: 'mexico' });

      expect(emitted).toEqual(['austin']);
    });
  });
});
