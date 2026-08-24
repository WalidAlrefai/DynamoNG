import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoAvatar } from '@dynamong/avatar';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-avatar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoAvatar, DocPageShell],
  template: `
    <docs-page-shell
      name="Avatar"
      description="A user image with initials/icon fallback, for user-related data displays like table rows."
    >
      <div demo class="flex flex-wrap items-center gap-4">
        <dg-avatar name="Ada Lovelace" size="sm" />
        <dg-avatar name="Ada Lovelace" size="md" />
        <dg-avatar name="Madonna" size="lg" />
        <dg-avatar />
      </div>
      <div code>&lt;dg-avatar name="Ada Lovelace" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">src</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">name</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">alt</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class AvatarDocPage {}
