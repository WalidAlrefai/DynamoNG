import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  signal,
  viewChild,
} from '@angular/core';
import {
  DynamoTree,
  type DynamoTreeNode,
  type DynamoTreeNodeContext,
} from '@dynamong/tree';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'filter', title: 'Filter' },
  { id: 'selection-modes', title: 'Selection Modes' },
  { id: 'lazy', title: 'Lazy Loading' },
  { id: 'template', title: 'Template' },
  { id: 'virtual-scroll', title: 'Virtual Scroll' },
  { id: 'accessibility', title: 'Accessibility' },
];

function isFolderNode(node: DynamoTreeNode): boolean {
  return !!node.children?.length || node.leaf === false;
}

const VIRTUAL_ITEMS: DynamoTreeNode[] = Array.from(
  { length: 2000 },
  (_, i) => ({ id: `file-${i}`, label: `File ${i}.txt` }),
);

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoTreeNode[]', default: 'required' },
  { name: 'expandedIds', type: 'string[] (model)', default: '[]' },
  { name: 'selected', type: 'string[] (model)', default: '[]' },
  {
    name: 'selectionMode',
    type: "'single' | 'multiple' | 'checkbox'",
    default: "'checkbox'",
  },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'filterable', type: 'boolean', default: 'false' },
  { name: 'filterPlaceholder', type: 'string', default: "'Search...'" },
  { name: 'filterText', type: 'string (model)', default: "''" },
  {
    name: 'noMatchesMessage',
    type: 'string',
    default: "'No matching results'",
  },
  { name: 'nodeExpand (output)', type: 'DynamoTreeNode', default: '—' },
  {
    name: 'nodeTemplate',
    type: 'TemplateRef<DynamoTreeNodeContext> | undefined',
    default: 'undefined',
  },
  { name: 'virtualScroll', type: 'boolean', default: 'false' },
  { name: 'virtualScrollItemSize', type: 'number', default: '40' },
  { name: 'virtualScrollHeight', type: 'number', default: '400' },
];

@Component({
  selector: 'docs-tree-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTree, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Tree"
      description="A hierarchical, expandable tree with keyboard navigation and multi-select tri-state checkboxes."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass a DynamoTreeNode tree; two-way bind [(expandedIds)] and [(selected)]. Checkboxes cascade to descendants with a tri-state parent."
      >
        <div preview>
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            [(selected)]="selected"
            ariaLabel="Project files"
          />
        </div>
        <div code>
          &lt;dg-tree [items]="items()" [(expandedIds)]="expanded"
          [(selected)]="selected" ariaLabel="Project files" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filter"
        title="Filter"
        description="filterable renders a search box that prunes the tree down to matches and their ancestor chain (a match keeps its whole subtree), auto-expanding the matched branches."
      >
        <div preview>
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            [(selected)]="selected"
            ariaLabel="Project files"
            [filterable]="true"
          />
        </div>
        <div code>
          &lt;dg-tree [items]="items()" [(expandedIds)]="expanded"
          [filterable]="true" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="selection-modes"
        title="Selection Modes"
        description="selectionMode='checkbox' (default) is the original always-cascading tri-state model. 'single' replaces the selection on click; 'multiple' toggles plain membership on a bare click — no modifier key, no cascading. All three modes reuse the same selected model."
      >
        <div preview>
          <div class="space-y-4">
            <div>
              <p class="mb-1 text-xs font-medium text-text-muted">Single</p>
              <dg-tree
                [items]="items()"
                [(expandedIds)]="expanded"
                [(selected)]="singleSelected"
                ariaLabel="Project files (single select)"
                selectionMode="single"
              />
            </div>
            <div>
              <p class="mb-1 text-xs font-medium text-text-muted">Multiple</p>
              <dg-tree
                [items]="items()"
                [(expandedIds)]="expanded"
                [(selected)]="multipleSelected"
                ariaLabel="Project files (multiple select)"
                selectionMode="multiple"
              />
            </div>
          </div>
        </div>
        <div code>
          &lt;dg-tree [items]="items()" [(selected)]="selected"
          selectionMode="single" /&gt; &lt;dg-tree [items]="items()"
          [(selected)]="selected" selectionMode="multiple" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="lazy"
        title="Lazy Loading"
        description="Mark a node leaf: false with no children to render it as an unresolved branch. Expanding it fires (nodeExpand); the handler sets loading, fetches, then patches children back in."
      >
        <div preview>
          <dg-tree
            [items]="lazyItems()"
            [(expandedIds)]="lazyExpanded"
            ariaLabel="Remote folders"
            (nodeExpand)="onNodeExpand($event)"
          />
        </div>
        <div code>
          &lt;dg-tree [items]="items()" (nodeExpand)="onNodeExpand($event)"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="template"
        title="Template"
        description="nodeTemplate replaces the default plain-label rendering with custom per-node content — here, a folder/file icon ahead of the label. Bind let-node (the full node), let-depth, and let-expanded."
      >
        <div preview>
          <ng-template
            #fileIcon
            let-node
            let-depth="depth"
            let-expanded="expanded"
          >
            <span class="flex items-center gap-1.5">
              @if (isFolder(node)) {
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z"
                    [attr.fill]="expanded ? '#eab308' : '#ca8a04'"
                  />
                </svg>
              } @else {
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
                    fill="#94a3b8"
                  />
                </svg>
              }
              <span>{{ node.label }}</span>
            </span>
          </ng-template>
          <dg-tree
            [items]="items()"
            [(expandedIds)]="expanded"
            ariaLabel="Project files"
            [nodeTemplate]="fileIconTpl()"
          />
        </div>
        <div code>
          &lt;ng-template #fileIcon let-node let-expanded="expanded"&gt; ...
          &lt;/ng-template&gt; &lt;dg-tree [items]="items()"
          [nodeTemplate]="fileIconTpl" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="virtual-scroll"
        title="Virtual Scroll"
        description="virtualScroll renders only the rows near the viewport via @dynamong/virtual-scroll — 2,000 flat rows here. The roving-tabindex keyboard model (Arrow keys, Home, End) still works: moving to a row outside the mounted range scrolls the viewport to it first, then focuses it once rendered."
      >
        <div preview>
          <dg-tree
            [items]="virtualItems"
            ariaLabel="Files (virtual scroll)"
            [virtualScroll]="true"
            [virtualScrollHeight]="320"
          />
        </div>
        <div code>
          &lt;dg-tree [items]="items" [virtualScroll]="true"
          [virtualScrollHeight]="320" /&gt;
        </div>
      </docs-example>

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            <code class="font-mono">role="tree"</code> root (omitted entirely
            while <code class="font-mono">items</code> is empty, in favor of a
            <code class="font-mono">role="status"</code> empty-state region),
            <code class="font-mono">role="treeitem"</code> rows with
            <code class="font-mono">aria-expanded</code>/<code class="font-mono"
              >aria-checked</code
            >
            (including <code class="font-mono">"mixed"</code> for a
            partially-checked branch)/<code class="font-mono">aria-level</code
            >/<code class="font-mono">aria-posinset</code>/<code
              class="font-mono"
              >aria-setsize</code
            >.
          </li>
          <li>
            Keyboard: <code class="font-mono">ArrowDown</code>/<code
              class="font-mono"
              >ArrowUp</code
            >
            move, <code class="font-mono">ArrowRight</code> expands (or moves
            into the first child), <code class="font-mono">ArrowLeft</code>
            collapses (or moves to the parent),
            <code class="font-mono">Home</code>/<code class="font-mono"
              >End</code
            >
            jump, <code class="font-mono">Enter</code>/<code class="font-mono"
              >Space</code
            >
            toggles the active row's checkbox and activates it.
          </li>
          <li>
            The expand/collapse chevron is a real
            <code class="font-mono">&lt;button&gt;</code> with its own
            accessible name (e.g. "Expand Documents") — not just a clickable
            icon. It's excluded from the Tab sequence (<code class="font-mono"
              >tabindex="-1"</code
            >) since the row itself is already the roving tab stop, but remains
            reachable by touch-AT (VoiceOver/TalkBack) and
            voice-control/switch-access.
          </li>
        </ul>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class TreeDocPage {
  readonly examples = EXAMPLES;
  readonly apiRows = API;

  readonly items = signal<DynamoTreeNode[]>([
    {
      id: 'src',
      label: 'src',
      children: [
        { id: 'main', label: 'main.ts' },
        { id: 'app', label: 'app.ts' },
      ],
    },
    {
      id: 'docs',
      label: 'docs',
      children: [
        { id: 'readme', label: 'README.md' },
        { id: 'license', label: 'LICENSE', disabled: true },
      ],
    },
    { id: 'gitignore', label: '.gitignore' },
  ]);

  readonly expanded = signal<string[]>(['src']);
  readonly selected = signal<string[]>([]);
  readonly singleSelected = signal<string[]>([]);
  readonly multipleSelected = signal<string[]>([]);
  readonly virtualItems = VIRTUAL_ITEMS;

  readonly fileIconTpl =
    viewChild.required<TemplateRef<DynamoTreeNodeContext>>('fileIcon');
  readonly isFolder = isFolderNode;

  readonly lazyItems = signal<DynamoTreeNode[]>([
    { id: 'remote-a', label: 'Marketing (remote)', leaf: false },
    { id: 'remote-b', label: 'Engineering (remote)', leaf: false },
  ]);
  readonly lazyExpanded = signal<string[]>([]);

  onNodeExpand(node: DynamoTreeNode): void {
    this.lazyItems.set(
      this.lazyItems().map((n) =>
        n.id === node.id ? { ...n, loading: true } : n,
      ),
    );
    setTimeout(() => {
      this.lazyItems.set(
        this.lazyItems().map((n) =>
          n.id === node.id
            ? {
                ...n,
                loading: false,
                children: [
                  { id: `${node.id}-1`, label: 'Q1 Report.pdf' },
                  { id: `${node.id}-2`, label: 'Q2 Report.pdf' },
                ],
              }
            : n,
        ),
      );
    }, 600);
  }
}
