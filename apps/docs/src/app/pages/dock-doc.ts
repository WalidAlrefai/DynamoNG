import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoDock } from '@dynamong/dock';
import type { DynamoDockItem } from '@dynamong/dock';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'items', type: 'DynamoDockItem[] (required)', default: '—' },
  {
    name: 'position',
    type: "'bottom' | 'top' | 'left' | 'right'",
    default: "'bottom'",
  },
  { name: 'magnification', type: 'boolean', default: 'true' },
  { name: 'magnificationScale', type: 'number', default: '1.6' },
  { name: 'magnificationRange', type: 'number (px)', default: '140' },
];

@Component({
  selector: 'docs-dock-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoDock, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Dock"
      description="A macOS-style dock — a row or column of icon items that magnify toward the pointer, with roving-focus keyboard navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass items of { label, icon, command?, disabled? }; icons magnify as the pointer nears them."
      >
        <div preview class="flex flex-col items-center gap-8 py-6">
          <dg-dock [items]="items" ariaLabel="Apps" />
          @if (last(); as label) {
            <p class="text-sm text-text-muted">
              Launched: <span class="font-mono">{{ label }}</span>
            </p>
          }
        </div>
        <div code>&lt;dg-dock [items]="items" ariaLabel="Apps" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class DockDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly last = signal<string | null>(null);
  protected readonly items: DynamoDockItem[] = [
    { label: 'Finder', icon: '🔍', command: () => this.last.set('Finder') },
    { label: 'Mail', icon: '✉', command: () => this.last.set('Mail') },
    { label: 'Calendar', icon: '📅', command: () => this.last.set('Calendar') },
    { label: 'Photos', icon: '🖼', command: () => this.last.set('Photos') },
    { label: 'Music', icon: '♫', command: () => this.last.set('Music') },
    { label: 'Trash', icon: '🗑', disabled: true },
  ];
}
