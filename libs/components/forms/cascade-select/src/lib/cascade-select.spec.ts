import { Component, model } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import type { DynamoTreeNode } from '@dynamong/tree';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoCascadeSelect } from './cascade-select';
import { DynamoCascadeSelectHarness } from './cascade-select.harness';

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
      const { container } = renderDynamoComponent(CascadeSelectTestHostComponent);

      expect(within(container).getByRole('combobox')).toBeTruthy();
    });

    it('does not render any panel until opened', () => {
      renderDynamoComponent(CascadeSelectTestHostComponent);

      expect(getListboxes()).toHaveLength(0);
    });
  });

  describe('default behavior', () => {
    it('shows the placeholder when nothing is selected', () => {
      const { container } = renderDynamoComponent(CascadeSelectTestHostComponent);

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
      const level1Labels = getRowsIn(getListboxes()[1]!).map((r) => r.textContent?.trim());
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
    it('hovering a sibling branch collapses the previous branch\'s deeper flyout', async () => {
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
      const level2Labels = getRowsIn(getListboxes()[2]!).map((r) => r.textContent?.trim());
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
      const { container, fixture, componentInstance } = renderDynamoComponent(
        NgModelHostComponent,
      );

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
});
