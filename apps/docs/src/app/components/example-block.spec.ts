import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DocExample } from './example-block';

@Component({
  standalone: true,
  imports: [DocExample],
  template: `
    <docs-example
      [exampleId]="'basic'"
      [title]="'Basic'"
      [description]="desc()"
      [code]="code()"
    >
      <div preview data-testid="the-preview">rendered preview</div>
    </docs-example>
  `,
})
class HostComponent {
  readonly desc = signal('what it shows');
  readonly code = signal('<dg-select [options]="opts" />');
}

function setup() {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

const codePane = (el: HTMLElement) => el.querySelector('pre');
const previewPane = (el: HTMLElement) =>
  codePane(el)?.previousElementSibling as HTMLElement;

describe('DocExample', () => {
  it('shows the preview pane by default and the title/description', () => {
    const { el } = setup();

    expect(el.querySelector('h3')?.textContent).toContain('Basic');
    expect(el.textContent).toContain('what it shows');
    expect(previewPane(el).hidden).toBe(false);
    expect(codePane(el)?.hidden).toBe(true);
  });

  it('toggles to the code pane and back', () => {
    const { fixture, el } = setup();
    const groupButtons = Array.from(
      el.querySelectorAll<HTMLButtonElement>('[role="group"] button'),
    );
    const previewBtn = groupButtons[0];
    const codeBtn = groupButtons[1];
    if (!previewBtn || !codeBtn) throw new Error('toggle buttons not found');

    codeBtn.click();
    fixture.detectChanges();
    expect(codePane(el)?.hidden).toBe(false);
    expect(codePane(el)?.textContent).toContain(
      '<dg-select [options]="opts" />',
    );
    expect(previewPane(el).hidden).toBe(true);
    expect(codeBtn.getAttribute('aria-pressed')).toBe('true');

    previewBtn.click();
    fixture.detectChanges();
    expect(previewPane(el).hidden).toBe(false);
    expect(codePane(el)?.hidden).toBe(true);
  });

  it('copies the code to the clipboard via the Copy button', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    try {
      const { fixture, el } = setup();
      const copyBtn = Array.from(
        el.querySelectorAll<HTMLButtonElement>('button'),
      ).find((b) => b.textContent?.trim() === 'Copy');

      copyBtn?.click();
      await Promise.resolve();
      fixture.detectChanges();

      expect(writeText).toHaveBeenCalledWith('<dg-select [options]="opts" />');
      expect(
        Array.from(el.querySelectorAll('button')).some(
          (b) => b.textContent?.trim() === 'Copied',
        ),
      ).toBe(true);
    } finally {
      if (original) {
        Object.defineProperty(navigator, 'clipboard', original);
      } else {
        delete (navigator as { clipboard?: unknown }).clipboard;
      }
    }
  });
});
