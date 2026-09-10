import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * One example on a component doc page: a title, a short description, a live
 * **Preview** of the rendered example (projected via `[preview]`), and a
 * **Code** view of its source. Source is either the `code` input (a string,
 * shown verbatim) or projected `[code]` content (HTML-escaped markup, same
 * shape the old `DocPageShell` used). A segmented Preview/Code toggle flips
 * between the two; a Copy button puts the source on the clipboard.
 *
 * `exampleId` is the anchor the page's right-hand on-page nav links to, so
 * it must be unique within the page and match the `id` passed to
 * `docs-examples-layout`.
 */
@Component({
  selector: 'docs-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [id]="exampleId()" class="scroll-mt-8 space-y-3">
      <div>
        <h3 class="text-lg font-semibold text-text-primary">{{ title() }}</h3>
        @if (description()) {
          <p class="mt-1 text-sm text-text-muted">{{ description() }}</p>
        }
      </div>

      <div class="flex items-center justify-between">
        <div
          class="inline-flex rounded-md border border-border p-0.5 text-sm"
          role="group"
          aria-label="View"
        >
          <button
            type="button"
            class="rounded px-3 py-1"
            [class]="
              view() === 'preview'
                ? 'bg-surface-100 font-medium text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            "
            [attr.aria-pressed]="view() === 'preview'"
            (click)="view.set('preview')"
          >
            Preview
          </button>
          <button
            type="button"
            class="rounded px-3 py-1"
            [class]="
              view() === 'code'
                ? 'bg-surface-100 font-medium text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            "
            [attr.aria-pressed]="view() === 'code'"
            (click)="view.set('code')"
          >
            Code
          </button>
        </div>

        <button
          type="button"
          class="rounded-md border border-border px-3 py-1 text-sm text-text-muted hover:text-text-primary"
          (click)="copy()"
        >
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </div>

      <div [hidden]="view() !== 'preview'">
        <div class="rounded-lg border border-border p-6">
          <ng-content select="[preview]" />
        </div>
      </div>

      <pre
        [hidden]="view() !== 'code'"
        class="overflow-x-auto rounded-lg border border-border bg-surface-100 p-4 text-sm text-text-primary"
      ><code>{{ code() }}<ng-content select="[code]" /></code></pre>
    </section>
  `,
})
export class DocExample {
  readonly exampleId = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly code = input('');

  protected readonly view = signal<'preview' | 'code'>('preview');
  protected readonly copied = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected copy(): void {
    const text = (
      this.host.nativeElement.querySelector('pre')?.textContent ?? this.code()
    ).trim();
    const clipboard =
      typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (!clipboard || !text) return;
    void clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    });
  }
}
