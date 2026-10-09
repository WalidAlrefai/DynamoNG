import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoAvatar, DynamoAvatarGroup } from '@dynamong/avatar';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'initials', title: 'Initials & Fallback' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'shape', title: 'Shape' },
  { id: 'label-icon', title: 'Label & Custom Icon' },
  { id: 'image-error', title: 'Image Error' },
  { id: 'recovers', title: 'Recovers After a Failed Load' },
  { id: 'group', title: 'Group' },
];

const API: ApiTableRow[] = [
  { name: 'src', type: 'string | undefined', default: 'undefined' },
  { name: 'name', type: 'string | undefined', default: 'undefined' },
  { name: 'label', type: 'string | undefined', default: 'undefined' },
  { name: 'alt', type: 'string | undefined', default: 'undefined' },
  { name: 'ariaLabelledBy', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'shape', type: "'circle' | 'square'", default: "'circle'" },
  { name: 'imageError (output)', type: 'Event', default: '—' },
];

@Component({
  selector: 'docs-avatar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoAvatar,
    DynamoAvatarGroup,
    DynamoCheckIcon,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
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

      <docs-example
        exampleId="shape"
        title="Shape"
        description="circle (default) or square via the shape input."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar name="Ada Lovelace" shape="circle" />
          <dg-avatar name="Ada Lovelace" shape="square" />
        </div>
        <div code>&lt;dg-avatar name="Ada Lovelace" shape="square" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="label-icon"
        title="Label & Custom Icon"
        description="label renders literal text instead of derived initials (e.g. a count). Projecting an [icon]-attributed element replaces the default generic-person icon in the final fallback tier."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar label="+3" />
          <dg-avatar>
            <dg-icon-check icon />
          </dg-avatar>
        </div>
        <div code>
          &lt;dg-avatar label="+3" /&gt; &lt;dg-avatar&gt;&lt;dg-icon-check icon
          /&gt;&lt;/dg-avatar&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="image-error"
        title="Image Error"
        description="imageError fires when src fails to load, in addition to the automatic fallback to label/initials/icon."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar
            src="https://broken.invalid/avatar.png"
            name="Ada Lovelace"
            (imageError)="imageErrorCount.set(imageErrorCount() + 1)"
          />
          <p class="text-sm text-text-muted">
            imageError fired:
            <span class="font-mono">{{ imageErrorCount() }}</span> time(s)
          </p>
        </div>
        <div code>
          &lt;dg-avatar [src]="brokenUrl" (imageError)="onImageError($event)"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="recovers"
        title="Recovers After a Failed Load"
        description="A failed image falls back to initials — rebinding src to a new, working URL recovers the image instead of staying stuck on the fallback."
      >
        <div preview class="flex items-center gap-4">
          <dg-avatar [src]="recoverSrc()" name="Ada Lovelace" />
          <button
            type="button"
            class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-50"
            (click)="loadWorkingImage()"
          >
            Load a working image
          </button>
        </div>
        <div code>
          &lt;dg-avatar [src]="src" name="Ada Lovelace" /&gt;
          <br />
          // src starts broken, then is rebound to a valid URL
        </div>
      </docs-example>

      <docs-example
        exampleId="group"
        title="Group"
        description="dg-avatar-group stacks projected avatars with an overlapping ring."
      >
        <div preview>
          <dg-avatar-group>
            <dg-avatar name="Ada Lovelace" />
            <dg-avatar name="Grace Hopper" />
            <dg-avatar label="+3" />
          </dg-avatar-group>
        </div>
        <div code>
          &lt;dg-avatar-group&gt; &lt;dg-avatar name="Ada Lovelace" /&gt;
          &lt;dg-avatar name="Grace Hopper" /&gt; &lt;dg-avatar label="+3" /&gt;
          &lt;/dg-avatar-group&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class AvatarDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly imageErrorCount = signal(0);
  protected readonly recoverSrc = signal('https://broken.invalid/avatar.png');

  protected loadWorkingImage(): void {
    // A self-contained inline SVG data URI — no network dependency, just a
    // stand-in for "a URL that actually loads" to demonstrate the recovery.
    this.recoverSrc.set(
      'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
            '<rect width="80" height="80" fill="#6366f1"/>' +
            '<circle cx="40" cy="32" r="14" fill="#fff"/>' +
            '<path d="M14 72c0-16 12-24 26-24s26 8 26 24" fill="#fff"/>' +
            '</svg>',
        ),
    );
  }
}
