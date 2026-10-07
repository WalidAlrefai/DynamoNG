import { Component } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamoEditor } from './editor';
import { DynamoEditorHarness } from './editor.harness';

@Component({
  selector: 'dg-editor-reactive-form-host',
  standalone: true,
  imports: [DynamoEditor, ReactiveFormsModule],
  template: `<dg-editor [formControl]="control" aria-label="Notes" />`,
})
class ReactiveFormHostComponent {
  readonly control = new FormControl('', { nonNullable: true });
}

@Component({
  selector: 'dg-editor-ng-model-host',
  standalone: true,
  imports: [DynamoEditor, FormsModule],
  template: `<dg-editor [(ngModel)]="value" aria-label="Notes" />`,
})
class NgModelHostComponent {
  value = '';
}

function typeIntoEditor(el: HTMLDivElement, html: string): void {
  el.innerHTML = html;
  fireEvent.input(el);
}

function selectInsideElement(el: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function selectOutsideElement(): HTMLElement {
  const outside = document.createElement('div');
  outside.textContent = 'outside';
  document.body.appendChild(outside);
  const range = document.createRange();
  range.selectNodeContents(outside);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return outside;
}

// Same shape as chips-input.spec.ts's own pasteEvent() helper, extended to
// respond per-MIME-type (a real ClipboardEvent's clipboardData.getData
// returns different content for 'text/html' vs 'text/plain').
function pasteEvent(html: string | null, text = ''): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => (type === 'text/html' ? (html ?? '') : text),
    },
  });
  return event;
}

function stubExecCommand(returnValue = true): void {
  document.execCommand = vi
    .fn()
    .mockReturnValue(returnValue) as typeof document.execCommand;
}

function stubQueryCommandState(returnValue = false): void {
  document.queryCommandState = vi
    .fn()
    .mockReturnValue(returnValue) as typeof document.queryCommandState;
}

function stubQueryCommandValue(returnValue = 'p'): void {
  document.queryCommandValue = vi
    .fn()
    .mockReturnValue(returnValue) as typeof document.queryCommandValue;
}

function makeImageFile(name: string, type = 'image/png', size = 100): File {
  return new File([new Uint8Array(size)], name, { type });
}

// afterNextRender's callback (where the toolbar's first width measurement
// and ResizeObserver setup happen) runs asynchronously after the initial
// render, not synchronously with construction — same "flush before
// asserting" idiom already established by scroll-panel.spec.ts for the
// identical afterNextRender-driven-setup reason.
async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function stubToolbarWidth(container: HTMLElement, widthPx: number): void {
  const toolbar = within(container).getByRole('toolbar') as HTMLElement;
  Object.defineProperty(toolbar, 'clientWidth', {
    configurable: true,
    value: widthPx,
  });
}

// jsdom never fires a real ResizeObserver (no layout engine to detect a
// resize), so recomputeOverflow() only ever runs once, via afterNextRender,
// reading jsdom's real (always-0) clientWidth — which the `available === 0`
// guard treats as "not measured yet," keeping the optimistic all-visible
// state. To exercise the narrow-width path, stub ResizeObserver, capture
// its callback, stub a width via stubToolbarWidth, then invoke the
// captured callback directly to simulate "a resize occurred."
function stubResizeObserver(): { trigger: () => void } {
  let callback: (() => void) | null = null;
  class FakeResizeObserver {
    constructor(cb: () => void) {
      callback = cb;
    }
    observe(): void {
      /* no-op */
    }
    unobserve(): void {
      /* no-op */
    }
    disconnect(): void {
      /* no-op */
    }
  }
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  return { trigger: () => callback?.() };
}

// The CDK overlay portals content into a `.cdk-overlay-container` appended
// to `document.body` — same helper shape as menu.spec.ts's own
// getOverlayContainer().
function getOverlayContainer(): HTMLElement {
  return document.body.querySelector('.cdk-overlay-container') as HTMLElement;
}

const ALL_TOOLBAR_BUTTON_NAMES = [
  'Undo',
  'Redo',
  'Bold',
  'Italic',
  'Underline',
  'Align left',
  'Align center',
  'Align right',
  'Justify',
  'Bulleted list',
  'Numbered list',
  'Insert link',
  'Insert image',
];

describe('DynamoEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('renders a contenteditable textbox and every toolbar control', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      expect(
        within(container).getByRole('textbox', { name: 'Notes' }),
      ).toBeTruthy();
      for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
        expect(within(container).getByRole('button', { name })).toBeTruthy();
      }
      expect(
        within(container).getByRole('combobox', { name: 'Text style' }),
      ).toBeTruthy();
    });
  });

  describe('CVA lifecycle', () => {
    it('writeValue sets the contenteditable region content', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoEditor,
        {
          inputs: { ariaLabel: 'Notes' },
        },
      );

      componentInstance.writeValue('<p>hello</p>');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(within(container).getByRole('textbox').innerHTML).toBe(
        '<p>hello</p>',
      );
    });

    it('propagates typed content to a bound reactive FormControl', () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello</p>');

      expect(componentInstance.control.value).toBe('<p>hello</p>');
    });

    it('propagates typed content to an [(ngModel)] binding', () => {
      const { container, componentInstance } =
        renderDynamoComponent(NgModelHostComponent);
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello</p>');

      expect(componentInstance.value).toBe('<p>hello</p>');
    });

    it('blurring an unbound instance (no registered onTouched) does not throw', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox');

      expect(() => fireEvent.blur(content)).not.toThrow();
    });

    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      expect(componentInstance.control.touched).toBe(false);

      const content = within(container).getByRole('textbox');
      content.focus();
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });
  });

  describe('sanitization', () => {
    it('passes already-safe HTML through unchanged', () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello <b>world</b></p>');

      expect(componentInstance.control.value).toBe('<p>hello <b>world</b></p>');
    });

    it('strips a script tag from the committed value', () => {
      const { container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hi</p><script>alert(1)</script>');

      expect(componentInstance.control.value).not.toContain('<script');
    });
  });

  describe('formatting buttons', () => {
    it('Bold calls execCommand("bold")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Bold' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
    });

    it('Italic calls execCommand("italic")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Italic' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('italic', false);
    });

    it('Underline calls execCommand("underline")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Underline' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('underline', false);
    });

    it('Bulleted list calls execCommand("insertUnorderedList")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Bulleted list' }).click();

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertUnorderedList',
        false,
      );
    });

    it('Numbered list calls execCommand("insertOrderedList")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Numbered list' }).click();

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertOrderedList',
        false,
      );
    });

    it('Undo calls execCommand("undo")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Undo' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('undo', false);
    });

    it('Redo calls execCommand("redo")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Redo' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('redo', false);
    });

    it('Align left calls execCommand("justifyLeft")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Align left' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('justifyLeft', false);
    });

    it('Align center calls execCommand("justifyCenter")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Align center' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('justifyCenter', false);
    });

    it('Align right calls execCommand("justifyRight")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Align right' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('justifyRight', false);
    });

    it('Justify calls execCommand("justifyFull")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Justify' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('justifyFull', false);
    });

    it('disabled buttons render inert and do not respond to a native click', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });

      (
        within(container).getByRole('button', {
          name: 'Bold',
        }) as HTMLButtonElement
      ).click();

      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it("onFormat/onLink's own disabled guard no-ops even if called directly", () => {
      stubExecCommand();
      window.prompt = vi
        .fn()
        .mockReturnValue('https://example.com') as typeof window.prompt;
      const { componentInstance } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      const instance = componentInstance as unknown as {
        onFormat: (command: string) => void;
        onLink: () => void;
      };

      instance.onFormat('bold');
      instance.onLink();

      expect(document.execCommand).not.toHaveBeenCalled();
      expect(window.prompt).not.toHaveBeenCalled();
    });

    it('rapid repeated formatting calls do not throw when execCommand reports failure', () => {
      stubExecCommand(false);
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const bold = within(container).getByRole('button', { name: 'Bold' });

      expect(() => {
        bold.click();
        bold.click();
        bold.click();
      }).not.toThrow();
    });
  });

  describe('toolbar active state', () => {
    it('reflects queryCommandState via aria-pressed when the selection is inside the editor', () => {
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';

      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Bold' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });

    it('does not recompute when the selection changes outside the editor', () => {
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const outside = selectOutsideElement();

      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Bold' })
          .getAttribute('aria-pressed'),
      ).toBe('false');
      outside.remove();
    });

    it('reflects justifyCenter via aria-pressed when active', () => {
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';

      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      expect(
        within(container)
          .getByRole('button', { name: 'Align center' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });
  });

  describe('heading select', () => {
    it('changing the select calls execCommand("formatBlock", false, "<h1>")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const select = within(container).getByRole('combobox', {
        name: 'Text style',
      }) as HTMLSelectElement;

      select.value = 'h1';
      fireEvent.change(select);

      expect(document.execCommand).toHaveBeenCalledWith(
        'formatBlock',
        false,
        '<h1>',
      );
    });

    it('reflects queryCommandValue("formatBlock") as the selected option after a selection change', () => {
      stubExecCommand();
      stubQueryCommandValue('h2');
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<h2>hello</h2>';

      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      const select = within(container).getByRole('combobox', {
        name: 'Text style',
      }) as HTMLSelectElement;
      expect(select.value).toBe('h2');
    });

    it('falls back to Paragraph when queryCommandValue throws', () => {
      stubExecCommand();
      document.queryCommandValue = vi.fn().mockImplementation(() => {
        throw new Error('unsupported');
      }) as typeof document.queryCommandValue;
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';

      expect(() => {
        selectInsideElement(content);
        document.dispatchEvent(new Event('selectionchange'));
        fixture.detectChanges();
      }).not.toThrow();

      const select = within(container).getByRole('combobox', {
        name: 'Text style',
      }) as HTMLSelectElement;
      expect(select.value).toBe('p');
    });

    it("onHeadingChange's own disabled guard no-ops even if called directly", () => {
      stubExecCommand();
      const { componentInstance } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      const instance = componentInstance as unknown as {
        onHeadingChange: (event: Event) => void;
      };
      const select = document.createElement('select');
      select.value = 'h1';

      instance.onHeadingChange({ target: select } as unknown as Event);

      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('image button', () => {
    it('selecting an image file reads it and calls execCommand("insertImage") with a data URI', async () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      within(container).getByRole('button', { name: 'Insert image' }).click();
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeImageFile('pic.png')] },
      });

      await vi.waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith(
          'insertImage',
          false,
          expect.stringMatching(/^data:image\/png;base64,/),
        );
      });
    });

    it('rejects a non-image file without calling execCommand("insertImage")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      within(container).getByRole('button', { name: 'Insert image' }).click();
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeImageFile('doc.pdf', 'application/pdf')] },
      });

      expect(document.execCommand).not.toHaveBeenCalledWith(
        'insertImage',
        expect.anything(),
        expect.anything(),
      );
    });

    it('restores the caret to the range captured before the file picker opened', async () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';
      selectInsideElement(content);
      const selection = window.getSelection() as Selection;
      const addRangeSpy = vi.spyOn(selection, 'addRange');

      within(container).getByRole('button', { name: 'Insert image' }).click();
      // Simulate the file picker stealing focus/selection — the component
      // already captured its own clone before this point.
      selection.removeAllRanges();
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { files: [makeImageFile('pic.png')] },
      });

      await vi.waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith(
          'insertImage',
          false,
          expect.any(String),
        );
      });
      expect(addRangeSpy).toHaveBeenCalled();
    });

    it('disabled blocks the whole flow — the button itself is inert', () => {
      const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });

      (
        within(container).getByRole('button', {
          name: 'Insert image',
        }) as HTMLButtonElement
      ).click();

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('warns in dev mode for a file over the size threshold', () => {
      stubExecCommand();
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      within(container).getByRole('button', { name: 'Insert image' }).click();
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const big = makeImageFile('big.png', 'image/png', 3 * 1024 * 1024);

      fireEvent.change(input, { target: { files: [big] } });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[dg-editor]'),
      );
    });
  });

  describe('link button', () => {
    it('prompts for a URL and calls execCommand("createLink") when one is provided', () => {
      stubExecCommand();
      window.prompt = vi
        .fn()
        .mockReturnValue('https://example.com') as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).toHaveBeenCalledWith(
        'createLink',
        false,
        'https://example.com',
      );
    });

    it('is a no-op when the prompt is cancelled', () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue(null) as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).not.toHaveBeenCalledWith(
        'createLink',
        expect.anything(),
        expect.anything(),
      );
    });

    it('is a no-op when the prompt returns an empty string', () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue('') as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).not.toHaveBeenCalledWith(
        'createLink',
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('toolbar overflow', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('shows every control inline and no trigger when everything fits', async () => {
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      stubToolbarWidth(container, 600);

      await settle(fixture);

      expect(
        within(container).queryByRole('button', {
          name: 'More formatting options',
        }),
      ).toBeNull();
      for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
        expect(within(container).getByRole('button', { name })).toBeTruthy();
      }
    });

    it('collapses trailing items into the panel when the toolbar is narrow', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100); // fits Undo + Redo only
      resizeObserver.trigger();
      await settle(fixture);

      expect(
        within(container).getByRole('button', {
          name: 'More formatting options',
        }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Undo' }),
      ).toBeTruthy();
      expect(
        within(container).getByRole('button', { name: 'Redo' }),
      ).toBeTruthy();
      expect(
        within(container).queryByRole('button', { name: 'Bold' }),
      ).toBeNull();
    });

    it('opens the panel and renders overflowed items with a visible label', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);

      within(container)
        .getByRole('button', { name: 'More formatting options' })
        .click();
      await settle(fixture);

      const panel = within(getOverlayContainer());
      const boldButton = panel.getByRole('button', { name: 'Bold' });
      expect(boldButton).toBeTruthy();
      expect(boldButton.nextElementSibling?.textContent).toBe('Bold');
    });

    it('an overflowed button still calls the same execCommand as its inline counterpart', async () => {
      stubExecCommand();
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      within(container)
        .getByRole('button', { name: 'More formatting options' })
        .click();
      await settle(fixture);

      within(getOverlayContainer())
        .getByRole('button', { name: 'Bold' })
        .click();

      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
    });

    it('an overflowed button reflects aria-pressed identically to its inline counterpart', async () => {
      stubQueryCommandState(true);
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';
      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      within(container)
        .getByRole('button', { name: 'More formatting options' })
        .click();
      await settle(fixture);

      expect(
        within(getOverlayContainer())
          .getByRole('button', { name: 'Bold' })
          .getAttribute('aria-pressed'),
      ).toBe('true');
    });

    it('the heading select works identically when overflowed', async () => {
      stubExecCommand();
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      within(container)
        .getByRole('button', { name: 'More formatting options' })
        .click();
      await settle(fixture);

      const select = within(getOverlayContainer()).getByRole('combobox', {
        name: 'Text style',
      }) as HTMLSelectElement;
      select.value = 'h1';
      fireEvent.change(select);

      expect(document.execCommand).toHaveBeenCalledWith(
        'formatBlock',
        false,
        '<h1>',
      );
    });

    it('closes and refocuses the trigger on Escape', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      const trigger = within(container).getByRole('button', {
        name: 'More formatting options',
      });
      trigger.click();
      await settle(fixture);
      expect(
        getOverlayContainer().querySelector('[role="group"]'),
      ).not.toBeNull();

      fireEvent.keyDown(
        getOverlayContainer().querySelector('[role="group"]') as HTMLElement,
        { key: 'Escape' },
      );
      await settle(fixture);

      expect(getOverlayContainer().querySelector('[role="group"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('closes on Escape even when focus never left the trigger (a mouse click on the trigger does not auto-focus into the panel)', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      const trigger = within(container).getByRole('button', {
        name: 'More formatting options',
      });
      trigger.click();
      await settle(fixture);
      expect(
        getOverlayContainer().querySelector('[role="group"]'),
      ).not.toBeNull();

      fireEvent.keyDown(trigger, { key: 'Escape' });
      await settle(fixture);

      expect(getOverlayContainer().querySelector('[role="group"]')).toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const resizeObserver = stubResizeObserver();
      const { container, fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);
      stubToolbarWidth(container, 100);
      resizeObserver.trigger();
      await settle(fixture);
      within(container)
        .getByRole('button', { name: 'More formatting options' })
        .click();
      await settle(fixture);
      expect(
        getOverlayContainer().querySelector('[role="group"]'),
      ).not.toBeNull();

      const backdrop = document.body.querySelector(
        '.cdk-overlay-backdrop',
      ) as HTMLElement;
      backdrop.click();
      await settle(fixture);

      expect(getOverlayContainer().querySelector('[role="group"]')).toBeNull();
    });

    it('observes the toolbar element when ResizeObserver is available', async () => {
      const observed: unknown[] = [];
      class FakeResizeObserver {
        observe(target: unknown): void {
          observed.push(target);
        }
        unobserve(): void {
          /* no-op */
        }
        disconnect(): void {
          /* no-op */
        }
      }
      vi.stubGlobal('ResizeObserver', FakeResizeObserver);

      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await settle(fixture);

      expect(observed).toHaveLength(1);
    });

    it('does not throw when ResizeObserver is unavailable', async () => {
      vi.stubGlobal('ResizeObserver', undefined);

      expect(() => {
        renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      }).not.toThrow();
    });
  });

  describe('disabled state', () => {
    it('removes contenteditable and disables every toolbar button', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });

      expect(
        within(container).getByRole('textbox').getAttribute('contenteditable'),
      ).not.toBe('true');
      for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
        expect(
          (within(container).getByRole('button', { name }) as HTMLButtonElement)
            .disabled,
        ).toBe(true);
      }
    });

    it('disables the native element when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        ReactiveFormHostComponent,
      );

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(
        within(container).getByRole('textbox').getAttribute('contenteditable'),
      ).not.toBe('true');
    });
  });

  describe('readOnly', () => {
    it('defaults to false', () => {
      const { componentInstance } = renderDynamoComponent(DynamoEditor);
      expect(componentInstance.readOnly()).toBe(false);
    });

    it('sets contenteditable="false" but keeps the region tabbable, unlike disabled', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', readOnly: true },
      });
      const textbox = within(container).getByRole('textbox');

      expect(textbox.getAttribute('contenteditable')).toBe('false');
      expect(textbox.getAttribute('tabindex')).toBe('0');
      expect(textbox.getAttribute('aria-readonly')).toBe('true');
    });

    it('disables every toolbar button', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', readOnly: true },
      });

      for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
        expect(
          (within(container).getByRole('button', { name }) as HTMLButtonElement)
            .disabled,
        ).toBe(true);
      }
    });

    it('ignores onInput edits while readOnly', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoEditor,
        {
          inputs: { ariaLabel: 'Notes', readOnly: true, value: '<p>Kept</p>' },
        },
      );
      const textbox = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(textbox, '<p>Injected</p>');

      expect(componentInstance.value()).toBe('<p>Kept</p>');
    });
  });

  describe('placeholder', () => {
    it('sets data-placeholder on the content element', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', placeholder: 'Write something...' },
      });

      expect(
        within(container).getByRole('textbox').getAttribute('data-placeholder'),
      ).toBe('Write something...');
    });

    it('omits data-placeholder entirely when unset', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      expect(
        within(container).getByRole('textbox').hasAttribute('data-placeholder'),
      ).toBe(false);
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoEditorHarness', async () => {
      stubExecCommand();
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoEditorHarness,
      );

      await harness.clickBold();
      await harness.clickItalic();
      await harness.clickUnderline();
      await harness.clickUnorderedList();
      await harness.clickOrderedList();

      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
      expect(document.execCommand).toHaveBeenCalledWith('italic', false);
      expect(document.execCommand).toHaveBeenCalledWith('underline', false);
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertUnorderedList',
        false,
      );
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertOrderedList',
        false,
      );
      expect(await harness.isBoldActive()).toBe(true);
      expect(await harness.isDisabled()).toBe(false);

      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hi</p>';
      expect(await harness.getHtml()).toBe('<p>hi</p>');
    });

    it('clicks the link button through the harness', async () => {
      stubExecCommand();
      window.prompt = vi
        .fn()
        .mockReturnValue('https://example.com') as typeof window.prompt;
      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoEditorHarness,
      );

      await harness.clickLink();

      expect(document.execCommand).toHaveBeenCalledWith(
        'createLink',
        false,
        'https://example.com',
      );
    });

    it('drives undo/redo, alignment, and headings through the harness', async () => {
      stubExecCommand();
      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoEditorHarness,
      );

      await harness.clickUndo();
      await harness.clickRedo();
      await harness.clickAlignLeft();
      await harness.clickAlignCenter();
      await harness.clickAlignRight();
      await harness.clickJustify();
      await harness.selectHeading('h1');

      expect(document.execCommand).toHaveBeenCalledWith('undo', false);
      expect(document.execCommand).toHaveBeenCalledWith('redo', false);
      expect(document.execCommand).toHaveBeenCalledWith('justifyLeft', false);
      expect(document.execCommand).toHaveBeenCalledWith('justifyCenter', false);
      expect(document.execCommand).toHaveBeenCalledWith('justifyRight', false);
      expect(document.execCommand).toHaveBeenCalledWith('justifyFull', false);
      expect(document.execCommand).toHaveBeenCalledWith(
        'formatBlock',
        false,
        '<h1>',
      );
    });

    it('drives image insertion through the harness', async () => {
      stubExecCommand();
      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoEditorHarness,
      );

      await harness.clickInsertImage();
      const input = (fixture.nativeElement as HTMLElement).querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { files: [makeImageFile('pic.png')] },
      });

      await vi.waitFor(() => {
        expect(document.execCommand).toHaveBeenCalledWith(
          'insertImage',
          false,
          expect.stringMatching(/^data:image\/png;base64,/),
        );
      });
    });

    it('reports disabled through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoEditorHarness,
      );

      expect(await harness.isDisabled()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in the default state', async () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations when disabled', async () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('reflects the active state via aria-pressed, not just a visual class', () => {
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      const bold = within(container).getByRole('button', { name: 'Bold' });
      expect(bold.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('edge cases', () => {
    it('handles a writeValue(null) call gracefully (falls back to empty string)', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoEditor,
        {
          inputs: { ariaLabel: 'Notes' },
        },
      );

      componentInstance.writeValue(null);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(within(container).getByRole('textbox').innerHTML).toBe('');
    });
  });
});

describe('DynamoEditor — baseline parity (Phase 0)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('passthrough (pt)', () => {
    it('merges pt class onto every part: root/toolbar/button/content', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: {
          ariaLabel: 'Notes',
          pt: {
            root: { class: 'pt-root' },
            toolbar: { class: 'pt-toolbar' },
            button: { class: 'pt-button' },
            content: { class: 'pt-content' },
          },
        },
      });

      expect(container.querySelector('.pt-root')).not.toBeNull();
      expect(container.querySelector('.pt-toolbar')).not.toBeNull();
      expect(container.querySelectorAll('.pt-button').length).toBeGreaterThan(
        1,
      );
      expect(container.querySelector('.pt-content')).not.toBeNull();
    });
  });

  describe('ariaDescribedby / fluid', () => {
    it('defaults fluid to true', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      expect(container.querySelector('div')?.className).toContain('w-full');
    });

    it('switches to intrinsic width when fluid is set to false', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', fluid: false },
      });
      expect(container.querySelector('div')?.className).toContain('w-auto');
      expect(container.querySelector('div')?.className).not.toContain('w-full');
    });

    it('forwards ariaDescribedby to the content region', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', ariaDescribedby: 'help-text' },
      });
      expect(
        within(container).getByRole('textbox').getAttribute('aria-describedby'),
      ).toBe('help-text');
    });
  });

  describe('paste interception (security fix)', () => {
    it('sanitizes a pasted script tag before it ever reaches the DOM', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox');

      content.dispatchEvent(pasteEvent('<p>hi</p><script>alert(1)</script>'));

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.not.stringContaining('<script'),
      );
    });

    it('strips an onerror attribute from pasted HTML before insertion', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox');

      content.dispatchEvent(pasteEvent('<img src="x" onerror="alert(1)">'));

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertHTML',
        false,
        expect.not.stringContaining('onerror'),
      );
    });

    it('blocks the native (unsanitized) paste from ever landing in the DOM', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox');
      const event = pasteEvent('<p>hi</p>');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      content.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('falls back to execCommand("insertText") when no text/html clipboard flavor is present', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });
      const content = within(container).getByRole('textbox');

      content.dispatchEvent(pasteEvent(null, 'plain text'));

      expect(document.execCommand).toHaveBeenCalledWith(
        'insertText',
        false,
        'plain text',
      );
    });

    it('never calls execCommand while disabled', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      const content = within(container).getByRole('textbox');

      content.dispatchEvent(pasteEvent('<p>hi</p>'));

      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it('never calls execCommand while readOnly', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', readOnly: true },
      });
      const content = within(container).getByRole('textbox');

      content.dispatchEvent(pasteEvent('<p>hi</p>'));

      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations with pt/ariaDescribedby/fluid set', async () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', ariaDescribedby: 'help-text' },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});

describe('DynamoEditor — paste-as-plain-text toggle (Phase 1)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts as plain text even when a text/html clipboard flavor is available', () => {
    stubExecCommand();
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', pasteAsPlainText: true },
    });
    const content = within(container).getByRole('textbox');

    content.dispatchEvent(
      pasteEvent('<p><b>bold html</b></p>', 'plain fallback text'),
    );

    // The toggle must win over an available HTML flavor, not just apply
    // when no HTML flavor is present.
    expect(document.execCommand).toHaveBeenCalledWith(
      'insertText',
      false,
      'plain fallback text',
    );
    expect(document.execCommand).not.toHaveBeenCalledWith(
      'insertHTML',
      expect.anything(),
      expect.anything(),
    );
  });

  it('defaults to false — HTML paste still inserts as HTML', () => {
    stubExecCommand();
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes' },
    });
    const content = within(container).getByRole('textbox');

    content.dispatchEvent(pasteEvent('<p><b>bold html</b></p>', 'plain'));

    expect(document.execCommand).toHaveBeenCalledWith(
      'insertHTML',
      false,
      expect.stringContaining('<b>'),
    );
  });
});

describe('DynamoEditor — character count / maxLength (Phase 2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges pt class onto the characterCount part', () => {
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: {
        ariaLabel: 'Notes',
        maxLength: 10,
        pt: { characterCount: { class: 'pt-character-count' } },
      },
    });

    expect(container.querySelector('.pt-character-count')).not.toBeNull();
  });

  it('renders no count element when maxLength is unset', () => {
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes' },
    });

    expect(within(container).queryByText(/\d+ \/ \d+/)).toBeNull();
  });

  it('renders and updates the count as plain-text content changes', () => {
    const { container, fixture } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', maxLength: 10 },
    });

    expect(within(container).getByText('0 / 10')).toBeTruthy();

    const content = within(container).getByRole('textbox') as HTMLDivElement;
    typeIntoEditor(content, '<p>hello</p>');
    fixture.detectChanges();

    expect(within(container).getByText('5 / 10')).toBeTruthy();
  });

  it('counts plain text, not raw HTML markup', () => {
    const { container, fixture } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', maxLength: 20 },
    });

    const content = within(container).getByRole('textbox') as HTMLDivElement;
    typeIntoEditor(content, '<p><b>bold</b> text</p>');
    fixture.detectChanges();

    // "bold text" = 9 characters, not the raw HTML's byte length.
    expect(within(container).getByText('9 / 20')).toBeTruthy();
  });

  it('is a soft indicator — content past the limit is still accepted, only styling flags it', () => {
    stubExecCommand();
    const { container, fixture } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', maxLength: 5 },
    });

    const content = within(container).getByRole('textbox') as HTMLDivElement;
    typeIntoEditor(content, '<p>this is way over the limit</p>');
    fixture.detectChanges();

    const count = within(container).getByText(/\d+ \/ 5/);
    expect(count.className).toContain('text-danger');
    // Content was still accepted — no hard block.
    expect(content.innerHTML).toContain('way over the limit');
  });
});

describe('DynamoEditor — toolbar customization (Phase 3)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('undefined (default) renders every control — regression guard', () => {
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes' },
    });

    for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
      expect(within(container).getByRole('button', { name })).toBeTruthy();
    }
  });

  it('renders only the configured subset, in the canonical fixed order', () => {
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', toolbarButtons: ['italic', 'bold'] },
    });

    expect(
      within(container).getByRole('button', { name: 'Bold' }),
    ).toBeTruthy();
    expect(
      within(container).getByRole('button', { name: 'Italic' }),
    ).toBeTruthy();
    for (const name of ALL_TOOLBAR_BUTTON_NAMES) {
      if (name === 'Bold' || name === 'Italic') {
        continue;
      }
      expect(within(container).queryByRole('button', { name })).toBeNull();
    }
    // Canonical order (bold before italic) wins regardless of the input
    // array's own order (['italic', 'bold']) — inclusion only, not reorder.
    const toolbar = within(container).getByRole('toolbar');
    const labels = [...toolbar.querySelectorAll('button')].map((btn) =>
      btn.getAttribute('aria-label'),
    );
    expect(labels.indexOf('Bold')).toBeLessThan(labels.indexOf('Italic'));
  });

  it('overflow math respects the filtered set at a narrow width', async () => {
    const resizeObserver = stubResizeObserver();
    const { container, fixture } = renderDynamoComponent(DynamoEditor, {
      inputs: {
        ariaLabel: 'Notes',
        toolbarButtons: ['undo', 'redo', 'bold', 'italic'],
      },
    });
    await settle(fixture);
    // Fits only ~2 of the 4 configured items plus the trigger.
    stubToolbarWidth(container, 70);
    resizeObserver.trigger();
    await settle(fixture);

    expect(
      within(container).getByRole('button', {
        name: 'More formatting options',
      }),
    ).toBeTruthy();
    expect(
      within(container).queryByRole('button', { name: 'Underline' }),
    ).toBeNull(); // never configured in, not merely overflowed
  });

  it('warns in dev mode on an empty toolbarButtons array', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', toolbarButtons: [] },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('toolbarButtons is an empty array'),
    );
  });

  it('warns in dev mode on an unrecognized id', () => {
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);

    renderDynamoComponent(DynamoEditor, {
      inputs: {
        ariaLabel: 'Notes',
        toolbarButtons: ['bold', 'notARealId' as never],
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('unrecognized id'),
    );
  });

  it('harness fail-fast: clicking an excluded button throws a clear error', async () => {
    const { fixture } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', toolbarButtons: ['bold'] },
    });
    const harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      DynamoEditorHarness,
    );

    await expect(harness.clickItalic()).rejects.toThrow(
      /excluded via toolbarButtons/,
    );
  });
});

describe('DynamoEditor — image-upload hook (Phase 4)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handler resolving a URL inserts that exact URL, not a base64 data URI', async () => {
    stubExecCommand();
    const onImageUpload = vi
      .fn()
      .mockResolvedValue('https://cdn.example.com/pic.png');
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', onImageUpload },
    });
    within(container).getByRole('button', { name: 'Insert image' }).click();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeImageFile('pic.png');

    fireEvent.change(input, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertImage',
        false,
        'https://cdn.example.com/pic.png',
      );
    });
    expect(onImageUpload).toHaveBeenCalledWith(file);
  });

  it('handler resolving null cancels the insertion silently', async () => {
    stubExecCommand();
    const onImageUpload = vi.fn().mockResolvedValue(null);
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', onImageUpload },
    });
    within(container).getByRole('button', { name: 'Insert image' }).click();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeImageFile('pic.png')] } });

    await vi.waitFor(() => {
      expect(onImageUpload).toHaveBeenCalled();
    });
    expect(document.execCommand).not.toHaveBeenCalledWith(
      'insertImage',
      expect.anything(),
      expect.anything(),
    );
  });

  it('a rejected handler is swallowed — no uncaught rejection, component stays usable', async () => {
    stubExecCommand();
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    const onImageUpload = vi.fn().mockRejectedValue(new Error('upload failed'));
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes', onImageUpload },
    });
    within(container).getByRole('button', { name: 'Insert image' }).click();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeImageFile('pic.png')] } });

    await vi.waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('onImageUpload rejected'),
        expect.any(Error),
      );
    });
    expect(document.execCommand).not.toHaveBeenCalledWith(
      'insertImage',
      expect.anything(),
      expect.anything(),
    );
    // Component still functions normally afterward — Bold still works.
    within(container).getByRole('button', { name: 'Bold' }).click();
    expect(document.execCommand).toHaveBeenCalledWith('bold', false);
  });

  it('onImageUpload unset — existing base64/FileReader path is unchanged (regression guard)', async () => {
    stubExecCommand();
    const { container } = renderDynamoComponent(DynamoEditor, {
      inputs: { ariaLabel: 'Notes' },
    });
    within(container).getByRole('button', { name: 'Insert image' }).click();
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [makeImageFile('pic.png')] } });

    await vi.waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith(
        'insertImage',
        false,
        expect.stringMatching(/^data:image\/png;base64,/),
      );
    });
  });
});
