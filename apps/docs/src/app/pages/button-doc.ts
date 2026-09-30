import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DynamoButton,
  DynamoButtonDirective,
  DynamoButtonGroup,
} from '@dynamong/button';
import { DynamoOverlayBadge } from '@dynamong/overlay-badge';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'variants', title: 'Severity & Variant' },
  { id: 'icons', title: 'Icons' },
  { id: 'link', title: 'Link' },
  { id: 'raised-rounded', title: 'Raised, Rounded & Icon Only' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'states', title: 'Loading & Disabled' },
  { id: 'full-width', title: 'Full Width' },
  { id: 'badge', title: 'Badge' },
  { id: 'button-group', title: 'Button Group' },
  { id: 'template', title: 'Template' },
  { id: 'accessibility', title: 'Accessibility' },
];

const API: ApiTableRow[] = [
  { name: 'severity', type: 'DynamoSeverity', default: "'primary'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'variant',
    type: "'solid' | 'outline' | 'text' | 'link'",
    default: "'solid'",
  },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'loading', type: 'boolean', default: 'false' },
  { name: 'fullWidth', type: 'boolean', default: 'false' },
  { name: 'raised', type: 'boolean', default: 'false' },
  { name: 'rounded', type: 'boolean', default: 'false' },
  { name: 'iconOnly', type: 'boolean', default: 'false' },
  {
    name: 'iconPos',
    type: "'left' | 'right' | 'top' | 'bottom'",
    default: "'left'",
  },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaCurrent',
    type: "'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | undefined",
    default: 'undefined',
  },
  { name: 'role', type: 'string | undefined', default: 'undefined' },
  { name: 'ariaChecked', type: 'boolean | undefined', default: 'undefined' },
  { name: 'ariaPressed', type: 'boolean | undefined', default: 'undefined' },
  {
    name: 'tabIndexOverride',
    type: 'number | undefined',
    default: 'undefined',
  },
];

@Component({
  selector: 'docs-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoButtonDirective,
    DynamoButtonGroup,
    DynamoOverlayBadge,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Button"
      description="Triggers an action. Supports severity, size, variant, icons, and a loading state."
      [examples]="examples"
    >
      <docs-example
        exampleId="variants"
        title="Severity & Variant"
        description="severity picks the color; variant picks the fill — solid, outline, or text."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button severity="primary">Primary</dg-button>
          <dg-button severity="danger" variant="outline"
            >Danger outline</dg-button
          >
          <dg-button severity="success" variant="text">Success text</dg-button>
        </div>
        <div code>
          &lt;dg-button severity="primary"&gt;Primary&lt;/dg-button&gt;
          &lt;dg-button severity="danger"
          variant="outline"&gt;Danger&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="icons"
        title="Icons"
        description="A projected [icon]-attributed element renders alongside the label; iconPos controls which side (visual only — reordering is CSS, not DOM order)."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-button>
            <svg
              icon
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              />
            </svg>
            Add item
          </dg-button>
          <dg-button iconPos="right" severity="secondary">
            <svg
              icon
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Next
          </dg-button>
          <dg-button iconPos="top" variant="outline">
            <svg
              icon
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              />
            </svg>
            Upload
          </dg-button>
        </div>
        <div code>
          &lt;dg-button&gt;&lt;svg icon&gt;...&lt;/svg&gt;Add
          item&lt;/dg-button&gt; &lt;dg-button
          iconPos="right"&gt;...&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="link"
        title="Link"
        description='variant="link" never gets a hover background — colored text, underlined only on hover.'
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button variant="link">Learn more</dg-button>
          <dg-button variant="link" severity="danger">Delete account</dg-button>
        </div>
        <div code>
          &lt;dg-button variant="link"&gt;Learn more&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="raised-rounded"
        title="Raised, Rounded & Icon Only"
        description="raised adds a shadow (composes with any variant, e.g. Raised Text); rounded is pill-shaped; iconOnly squares the padding for a lone icon."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-button [raised]="true">Raised</dg-button>
          <dg-button [raised]="true" variant="text">Raised Text</dg-button>
          <dg-button [rounded]="true">Rounded</dg-button>
          <dg-button [iconOnly]="true" ariaLabel="Add item">
            <svg
              icon
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              />
            </svg>
          </dg-button>
        </div>
        <div code>
          &lt;dg-button [raised]="true"&gt;Raised&lt;/dg-button&gt;
          &lt;dg-button [iconOnly]="true" ariaLabel="Add item"&gt;&lt;svg
          icon&gt;...&lt;/svg&gt;&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three heights via the size input."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-button size="sm">Small</dg-button>
          <dg-button size="md">Medium</dg-button>
          <dg-button size="lg">Large</dg-button>
        </div>
        <div code>
          &lt;dg-button size="sm"&gt;Small&lt;/dg-button&gt; &lt;dg-button
          size="lg"&gt;Large&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="states"
        title="Loading & Disabled"
        description="loading shows a spinner and blocks clicks; disabled greys the button out."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-button [loading]="true">Loading</dg-button>
          <dg-button [disabled]="true">Disabled</dg-button>
        </div>
        <div code>
          &lt;dg-button [loading]="true"&gt;Loading&lt;/dg-button&gt;
          &lt;dg-button [disabled]="true"&gt;Disabled&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="full-width"
        title="Full Width"
        description="fullWidth stretches the button to fill its container."
      >
        <div preview class="max-w-sm">
          <dg-button [fullWidth]="true">Continue</dg-button>
        </div>
        <div code>
          &lt;dg-button [fullWidth]="true"&gt;Continue&lt;/dg-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="badge"
        title="Badge"
        description="Button has no badge input of its own — compose @dynamong/overlay-badge around it instead; it already works with no changes on either side."
      >
        <div preview class="flex flex-wrap gap-2">
          <dg-overlay-badge [value]="3" severity="danger">
            <dg-button ariaLabel="Notifications, 3 unread" variant="outline"
              >Inbox</dg-button
            >
          </dg-overlay-badge>
        </div>
        <div code>
          &lt;dg-overlay-badge [value]="3" severity="danger"&gt;
          &lt;dg-button&gt;Inbox&lt;/dg-button&gt; &lt;/dg-overlay-badge&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="button-group"
        title="Button Group"
        description="dg-button-group (same @dynamong/button package) visually merges adjacent buttons into one connected control — a plain CSS-only wrapper around any dg-button children."
      >
        <div preview>
          <dg-button-group ariaLabel="Text formatting">
            <dg-button variant="outline">Bold</dg-button>
            <dg-button variant="outline">Italic</dg-button>
            <dg-button variant="outline">Underline</dg-button>
          </dg-button-group>
        </div>
        <div code>
          &lt;dg-button-group&gt; &lt;dg-button variant="outline"
          &gt;Bold&lt;/dg-button&gt; &lt;dg-button
          variant="outline"&gt;Italic&lt;/dg-button&gt; &lt;/dg-button-group&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="template"
        title="Template"
        description="Button's content is plain projection — put anything inside it, not just text or a small icon."
      >
        <div preview class="flex justify-center">
          <dg-button variant="outline" size="lg" ariaLabel="Brand">
            <svg
              width="32"
              height="32"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                fill="currentColor"
                opacity="0.15"
              />
              <path
                d="M20 2 L36 11 V29 L20 38 L4 29 V11 Z"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <path d="M20 13 L27 20 L20 27 L13 20 Z" fill="currentColor" />
            </svg>
          </dg-button>
        </div>
        <div code>
          &lt;dg-button variant="outline"
          size="lg"&gt;&lt;svg&gt;...&lt;/svg&gt;&lt;/dg-button&gt;
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
            Renders a native
            <code class="font-mono">&lt;button&gt;</code>, inheriting its
            keyboard and click semantics for free (Space/Enter activation,
            correct focus behavior).
          </li>
          <li>
            <code class="font-mono">aria-busy</code> is set while
            <code class="font-mono">loading</code> is true.
          </li>
          <li>
            <code class="font-mono">ariaCurrent</code>/<code class="font-mono"
              >role</code
            >/<code class="font-mono">ariaChecked</code>/<code class="font-mono"
              >ariaPressed</code
            >/<code class="font-mono">tabIndexOverride</code> are opt-in
            forwards to the native button, used to compose Button into ARIA
            radio-group/toggle-group patterns (e.g. Select Button's segmented
            control).
          </li>
        </ul>

        <p class="text-sm text-text-muted">
          Prefer a bare native <code class="font-mono">&lt;button&gt;</code>
          with no wrapping element — inside a
          <code class="font-mono">&lt;form&gt;</code>, or a layout with strict
          <code class="font-mono">:first-child</code>/<code class="font-mono"
            >:nth-child</code
          >
          selectors? Use the
          <code class="font-mono">dgButton</code> directive instead of
          <code class="font-mono">&lt;dg-button&gt;</code> — it applies the
          exact same classes directly to an element you already own, with no
          <code class="font-mono">&lt;dg-button&gt;</code> host tag around it.
        </p>
        <div class="rounded-lg border border-border p-4">
          <button
            dgButton
            severity="secondary"
            variant="outline"
            aria-label="Delete item"
          >
            Delete
          </button>
        </div>
        <div class="rounded-md bg-surface-100 p-3 text-sm font-mono">
          &lt;button dgButton severity="secondary" variant="outline"
          aria-label="Delete item"&gt; Delete &lt;/button&gt;
        </div>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ButtonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
