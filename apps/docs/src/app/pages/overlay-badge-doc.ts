import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAvatar } from '@dynamong/avatar';
import { DynamoButton } from '@dynamong/button';
import { DynamoOverlayBadge } from '@dynamong/overlay-badge';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-overlay-badge-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoOverlayBadge, DynamoAvatar, DynamoButton, DocPageShell],
  template: `
    <docs-page-shell
      name="OverlayBadge"
      description="A wrapper that overlays a small badge (a count) or a dot on any element — an unread indicator on an avatar or icon button."
    >
      <div demo class="flex items-center gap-8 py-4">
        <dg-overlay-badge [value]="3" aria-label="Messages, 3 unread">
          <dg-avatar name="Ada Lovelace" />
        </dg-overlay-badge>

        <dg-overlay-badge [value]="128" [max]="99">
          <dg-button variant="outline">Inbox</dg-button>
        </dg-overlay-badge>

        <dg-overlay-badge [dot]="true" severity="success" position="bottom-right">
          <dg-avatar name="Grace Hopper" />
        </dg-overlay-badge>
      </div>
      <div code>
        &lt;dg-overlay-badge [value]="3"&gt; &lt;dg-avatar name="Ada" /&gt;
        &lt;/dg-overlay-badge&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">value</td>
            <td class="py-2 pr-4 font-mono">string | number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">dot</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">max</td>
            <td class="py-2 pr-4 font-mono">number | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">DynamoSeverity</td>
            <td class="py-2 font-mono">'danger'</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">position</td>
            <td class="py-2 pr-4 font-mono">
              'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
            </td>
            <td class="py-2 font-mono">'top-right'</td>
          </tr>
        </tbody>
      </table>
      <p class="mt-4 text-sm text-text-muted">
        The marker is decorative (<code class="font-mono">aria-hidden</code>). Give the wrapped
        control its own accessible name that includes the count, e.g.
        <code class="font-mono">aria-label="Messages, 3 unread"</code>.
      </p>
    </docs-page-shell>
  `,
})
export class OverlayBadgeDocPage {}
