import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAvatar } from '@dynamong/avatar';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'initials', title: 'Initials & Fallback' },
  { id: 'sizes', title: 'Sizes' },
];

const API: ApiTableRow[] = [
  { name: 'src', type: 'string | undefined', default: 'undefined' },
  { name: 'name', type: 'string | undefined', default: 'undefined' },
  { name: 'alt', type: 'string | undefined', default: 'undefined' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
];

@Component({
  selector: 'docs-avatar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAvatar, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Avatar"
      description="A user image with initials/icon fallback, for user-related data displays like table rows."
      [examples]="examples"
    >
      <docs-example
        exampleId="initials"
        title="Initials & Fallback"
        description="With no src, name renders initials; with neither, a generic icon."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar name="Ada Lovelace" />
          <dg-avatar name="Madonna" />
          <dg-avatar />
        </div>
        <div code>&lt;dg-avatar name="Ada Lovelace" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three diameters via the size input."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar name="Ada Lovelace" size="sm" />
          <dg-avatar name="Ada Lovelace" size="md" />
          <dg-avatar name="Ada Lovelace" size="lg" />
        </div>
        <div code>&lt;dg-avatar name="Ada Lovelace" size="lg" /&gt;</div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class AvatarDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
