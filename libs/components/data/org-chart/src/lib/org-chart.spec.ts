import { Component, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoOrgChart } from './org-chart';
import { DynamoOrgChartHarness } from './org-chart.harness';
import { DynamoOrgChartState } from './org-chart-state';
import type { DynamoOrgChartNode } from './org-chart.types';

// ceo
//  ├─ cto
//  │   ├─ eng1
//  │   └─ eng2
//  └─ cfo
//      └─ fin1
const TREE: DynamoOrgChartNode[] = [
  {
    id: 'ceo',
    label: 'Ada — CEO',
    children: [
      {
        id: 'cto',
        label: 'Bhav — CTO',
        children: [
          { id: 'eng1', label: 'Chris — Eng' },
          { id: 'eng2', label: 'Dee — Eng' },
        ],
      },
      {
        id: 'cfo',
        label: 'Eshan — CFO',
        children: [{ id: 'fin1', label: 'Fen — Finance' }],
      },
    ],
  },
];

@Component({
  selector: 'dg-org-chart-test-host',
  standalone: true,
  imports: [DynamoOrgChart],
  template: `
    <dg-org-chart
      [value]="value()"
      [collapsible]="collapsible()"
      [(collapsedIds)]="collapsedIds"
      [selectable]="selectable()"
      [selectionMode]="selectionMode()"
      [(selection)]="selection"
      [ariaLabel]="ariaLabel()"
      (nodeSelect)="onNodeSelect($event)"
    >
      <ng-template let-node>
        <span [attr.data-testid]="'tpl-' + node.id">{{ node.label }}</span>
      </ng-template>
    </dg-org-chart>
  `,
})
class OrgChartTestHostComponent {
  readonly value = signal<DynamoOrgChartNode[]>(TREE);
  readonly collapsible = signal(true);
  readonly collapsedIds = signal<string[]>([]);
  readonly selectable = signal(false);
  readonly selectionMode = signal<'single' | 'multiple'>('single');
  readonly selection = signal<string[]>([]);
  readonly ariaLabel = signal<string | undefined>('Company');
  readonly selectEvents: DynamoOrgChartNode[] = [];
  onNodeSelect(node: DynamoOrgChartNode): void {
    this.selectEvents.push(node);
  }
}

@Component({
  selector: 'dg-org-chart-plain-host',
  standalone: true,
  imports: [DynamoOrgChart],
  template: `<dg-org-chart [value]="value" />`,
})
class OrgChartPlainHostComponent {
  readonly value = TREE;
}

function boxes(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-testid="DynamoOrgChart-node"]',
    ),
  );
}

function box(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    `[data-testid="DynamoOrgChart-node"][data-node-id="${id}"]`,
  );
  if (!el) throw new Error(`no node box for "${id}"`);
  return el;
}

function toggler(container: HTMLElement, id: string): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    `dg-org-chart-item[data-node-id="${id}"] > [data-testid="DynamoOrgChart-toggler"]`,
  );
  if (!el) throw new Error(`no toggler for "${id}"`);
  return el;
}

describe('DynamoOrgChart', () => {
  describe('creation', () => {
    it('renders the host and a role="tree" container', () => {
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      expect(
        container.querySelector('[data-testid="DynamoOrgChart"]'),
      ).toBeTruthy();
      expect(container.querySelector('[role="tree"]')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('renders every node fully expanded when collapsedIds is empty', () => {
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      expect(boxes(container)).toHaveLength(6);
      expect(box(container, 'eng1')).toBeTruthy();
      expect(box(container, 'fin1')).toBeTruthy();
    });

    it('marks branch nodes with aria-expanded and leaves it off leaves', () => {
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      expect(box(container, 'ceo').getAttribute('aria-expanded')).toBe('true');
      expect(box(container, 'eng1').hasAttribute('aria-expanded')).toBe(false);
    });

    it('falls back to the node label when no template is projected', () => {
      const { container } = renderDynamoComponent(OrgChartPlainHostComponent);

      expect(box(container, 'ceo').textContent?.trim()).toBe('Ada — CEO');
      expect(container.querySelector('[data-testid="tpl-ceo"]')).toBeFalsy();
    });
  });

  describe('input properties', () => {
    it('renders each node through the projected template', () => {
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      expect(container.querySelector('[data-testid="tpl-ceo"]')).toBeTruthy();
      expect(container.querySelector('[data-testid="tpl-eng2"]')).toBeTruthy();
    });

    it('renders a forest of root nodes', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.value.set([
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ]);
      fixture.detectChanges();

      expect(boxes(container)).toHaveLength(2);
    });

    it('hides all togglers when collapsible is false', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.collapsible.set(false);
      fixture.detectChanges();

      expect(
        container.querySelectorAll('[data-testid="DynamoOrgChart-toggler"]'),
      ).toHaveLength(0);
    });

    it('reflects ariaLabel on the tree container', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      expect(
        container.querySelector('[role="tree"]')?.getAttribute('aria-label'),
      ).toBe('Company');

      componentInstance.ariaLabel.set(undefined);
      fixture.detectChanges();
      expect(
        container.querySelector('[role="tree"]')?.hasAttribute('aria-label'),
      ).toBe(false);
    });

    it('exposes aria-selected and a tab stop only when selectable', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      // Not selectable, but a branch node is still focusable for Arrow-key
      // expand/collapse; a leaf is not.
      expect(box(container, 'ceo').hasAttribute('aria-selected')).toBe(false);
      expect(box(container, 'eng1').getAttribute('tabindex')).toBe('-1');

      componentInstance.selectable.set(true);
      fixture.detectChanges();
      expect(box(container, 'ceo').getAttribute('aria-selected')).toBe('false');
      expect(box(container, 'eng1').getAttribute('tabindex')).toBe('0');
    });
  });

  describe('collapse / expand', () => {
    it('hides a subtree when its toggler is clicked and restores it', async () => {
      const user = userEvent.setup();
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      await user.click(toggler(container, 'cto'));
      expect(container.querySelector('[data-node-id="eng1"]')).toBeFalsy();
      expect(box(container, 'cto').getAttribute('aria-expanded')).toBe('false');

      await user.click(toggler(container, 'cto'));
      expect(box(container, 'eng1')).toBeTruthy();
      expect(box(container, 'cto').getAttribute('aria-expanded')).toBe('true');
    });

    it('two-way binds collapsedIds', async () => {
      const user = userEvent.setup();
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );

      componentInstance.collapsedIds.set(['cto']);
      fixture.detectChanges();
      expect(container.querySelector('[data-node-id="eng1"]')).toBeFalsy();

      await user.click(toggler(container, 'cto'));
      expect(componentInstance.collapsedIds()).toEqual([]);
    });

    it('expands with ArrowRight and collapses with ArrowLeft on a branch box', async () => {
      const user = userEvent.setup();
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);

      box(container, 'cto').focus();
      await user.keyboard('{ArrowLeft}');
      expect(box(container, 'cto').getAttribute('aria-expanded')).toBe('false');
      expect(container.querySelector('[data-node-id="eng1"]')).toBeFalsy();

      await user.keyboard('{ArrowRight}');
      expect(box(container, 'cto').getAttribute('aria-expanded')).toBe('true');
      expect(box(container, 'eng1')).toBeTruthy();
    });
  });

  describe('selection', () => {
    it('emits nodeSelect on every box click, even when not selectable', async () => {
      const user = userEvent.setup();
      const { container, componentInstance } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );

      await user.click(box(container, 'cto'));
      await user.click(box(container, 'cfo'));
      expect(componentInstance.selectEvents.map((n) => n.id)).toEqual([
        'cto',
        'cfo',
      ]);
      expect(componentInstance.selection()).toEqual([]);
    });

    it('single mode keeps at most one selected id and toggles it off', async () => {
      const user = userEvent.setup();
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.selectable.set(true);
      fixture.detectChanges();

      await user.click(box(container, 'cto'));
      expect(componentInstance.selection()).toEqual(['cto']);
      await user.click(box(container, 'cfo'));
      expect(componentInstance.selection()).toEqual(['cfo']);
      await user.click(box(container, 'cfo'));
      expect(componentInstance.selection()).toEqual([]);
    });

    it('multiple mode accumulates and removes ids', async () => {
      const user = userEvent.setup();
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.selectable.set(true);
      componentInstance.selectionMode.set('multiple');
      fixture.detectChanges();

      await user.click(box(container, 'cto'));
      await user.click(box(container, 'cfo'));
      expect(componentInstance.selection()).toEqual(['cto', 'cfo']);
      await user.click(box(container, 'cto'));
      expect(componentInstance.selection()).toEqual(['cfo']);
    });

    it('selects via Enter and Space when selectable, ignores other keys', async () => {
      const user = userEvent.setup();
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.selectable.set(true);
      fixture.detectChanges();

      box(container, 'eng1').focus();
      await user.keyboard('a');
      expect(componentInstance.selection()).toEqual([]);

      await user.keyboard('{Enter}');
      expect(componentInstance.selection()).toEqual(['eng1']);

      await user.keyboard(' ');
      expect(componentInstance.selection()).toEqual([]);
    });

    it('ignores keyboard selection when not selectable', async () => {
      const user = userEvent.setup();
      const { container, componentInstance } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );

      box(container, 'cto').focus();
      await user.keyboard('{Enter}');
      expect(componentInstance.selection()).toEqual([]);
      expect(componentInstance.selectEvents).toHaveLength(0);
    });

    it('reflects an externally-set selection on the box', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.selectable.set(true);
      componentInstance.selection.set(['eng2']);
      fixture.detectChanges();

      expect(box(container, 'eng2').getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(OrgChartTestHostComponent);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations when selectable and partly collapsed', async () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.selectable.set(true);
      componentInstance.collapsedIds.set(['cfo']);
      fixture.detectChanges();
      await expectNoA11yViolations(container);
    });
  });

  describe('harness', () => {
    it('drives the chart through DynamoOrgChartHarness', async () => {
      const { fixture } = renderDynamoComponent(OrgChartTestHostComponent);
      fixture.componentInstance.selectable.set(true);
      fixture.detectChanges();

      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoOrgChartHarness,
      );

      expect(await harness.getNodeCount()).toBe(6);
      expect(await harness.getNodeLabels()).toContain('Chris — Eng');
      expect(await harness.isExpanded('cto')).toBe(true);
      expect(await harness.isExpanded('eng1')).toBeNull();

      await harness.toggle('cto');
      fixture.detectChanges();
      expect(await harness.isExpanded('cto')).toBe(false);
      expect(await harness.getNodeCount()).toBe(4);

      await harness.selectNode('cfo');
      fixture.detectChanges();
      expect(await harness.getSelectedNodeIds()).toEqual(['cfo']);
    });
  });

  describe('state service', () => {
    it('is constructible with inert defaults before the root wires it', () => {
      const state = new DynamoOrgChartState();
      const node: DynamoOrgChartNode = { id: 'x', label: 'X' };

      expect(state.template()).toBeNull();
      expect(state.collapsible()).toBe(true);
      expect(state.selectable()).toBe(false);
      expect(state.isCollapsed('x')).toBe(false);
      expect(state.isSelected('x')).toBe(false);
      expect(() => state.toggle('x')).not.toThrow();
      expect(() => state.select(node)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('renders a single leaf root with no toggler and no group', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.value.set([{ id: 'solo', label: 'Solo' }]);
      fixture.detectChanges();

      expect(boxes(container)).toHaveLength(1);
      expect(
        container.querySelectorAll('[data-testid="DynamoOrgChart-toggler"]'),
      ).toHaveLength(0);
      expect(container.querySelector('[role="group"]')).toBeFalsy();
    });

    it('treats an empty children array as a leaf', () => {
      const { container, componentInstance, fixture } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );
      componentInstance.value.set([{ id: 'root', label: 'Root', children: [] }]);
      fixture.detectChanges();

      expect(box(container, 'root').hasAttribute('aria-expanded')).toBe(false);
    });

    it('handles rapid repeated toggling', async () => {
      const user = userEvent.setup();
      const { container, componentInstance } = renderDynamoComponent(
        OrgChartTestHostComponent,
      );

      for (let i = 0; i < 6; i++) await user.click(toggler(container, 'cto'));
      expect(componentInstance.collapsedIds()).toEqual([]);
      expect(box(container, 'eng1')).toBeTruthy();
    });
  });
});
