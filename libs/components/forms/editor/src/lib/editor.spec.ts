import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
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

function stubExecCommand(returnValue = true): void {
  document.execCommand = vi.fn().mockReturnValue(returnValue) as typeof document.execCommand;
}

function stubQueryCommandState(returnValue = false): void {
  document.queryCommandState = vi.fn().mockReturnValue(returnValue) as typeof document.queryCommandState;
}

describe('DynamoEditor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('renders a contenteditable textbox and all six toolbar buttons', () => {
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      expect(within(container).getByRole('textbox', { name: 'Notes' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Bold' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Italic' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Underline' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Bulleted list' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Numbered list' })).toBeTruthy();
      expect(within(container).getByRole('button', { name: 'Insert link' })).toBeTruthy();
    });
  });

  describe('CVA lifecycle', () => {
    it('writeValue sets the contenteditable region content', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      componentInstance.writeValue('<p>hello</p>');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(within(container).getByRole('textbox').innerHTML).toBe('<p>hello</p>');
    });

    it('propagates typed content to a bound reactive FormControl', () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello</p>');

      expect(componentInstance.control.value).toBe('<p>hello</p>');
    });

    it('propagates typed content to an [(ngModel)] binding', () => {
      const { container, componentInstance } = renderDynamoComponent(NgModelHostComponent);
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello</p>');

      expect(componentInstance.value).toBe('<p>hello</p>');
    });

    it('blurring an unbound instance (no registered onTouched) does not throw', () => {
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      const content = within(container).getByRole('textbox');

      expect(() => fireEvent.blur(content)).not.toThrow();
    });

    it('marks the FormControl as touched on blur', async () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      expect(componentInstance.control.touched).toBe(false);

      const content = within(container).getByRole('textbox');
      content.focus();
      await userEvent.tab();

      expect(componentInstance.control.touched).toBe(true);
    });
  });

  describe('sanitization', () => {
    it('passes already-safe HTML through unchanged', () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hello <b>world</b></p>');

      expect(componentInstance.control.value).toBe('<p>hello <b>world</b></p>');
    });

    it('strips a script tag from the committed value', () => {
      const { container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);
      const content = within(container).getByRole('textbox') as HTMLDivElement;

      typeIntoEditor(content, '<p>hi</p><script>alert(1)</script>');

      expect(componentInstance.control.value).not.toContain('<script');
    });
  });

  describe('formatting buttons', () => {
    it('Bold calls execCommand("bold")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Bold' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
    });

    it('Italic calls execCommand("italic")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Italic' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('italic', false);
    });

    it('Underline calls execCommand("underline")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Underline' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('underline', false);
    });

    it('Bulleted list calls execCommand("insertUnorderedList")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Bulleted list' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false);
    });

    it('Numbered list calls execCommand("insertOrderedList")', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Numbered list' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false);
    });

    it('disabled buttons render inert and do not respond to a native click', () => {
      stubExecCommand();
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });

      (within(container).getByRole('button', { name: 'Bold' }) as HTMLButtonElement).click();

      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it("onFormat/onLink's own disabled guard no-ops even if called directly", () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue('https://example.com') as typeof window.prompt;
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
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
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
      const { fixture, container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hello</p>';

      selectInsideElement(content);
      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      expect(within(container).getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('true');
    });

    it('does not recompute when the selection changes outside the editor', () => {
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      const outside = selectOutsideElement();

      document.dispatchEvent(new Event('selectionchange'));
      fixture.detectChanges();

      expect(within(container).getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('false');
      outside.remove();
    });
  });

  describe('link button', () => {
    it('prompts for a URL and calls execCommand("createLink") when one is provided', () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue('https://example.com') as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    });

    it('is a no-op when the prompt is cancelled', () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue(null) as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).not.toHaveBeenCalledWith('createLink', expect.anything(), expect.anything());
    });

    it('is a no-op when the prompt returns an empty string', () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue('') as typeof window.prompt;
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });

      within(container).getByRole('button', { name: 'Insert link' }).click();

      expect(document.execCommand).not.toHaveBeenCalledWith('createLink', expect.anything(), expect.anything());
    });
  });

  describe('disabled state', () => {
    it('removes contenteditable and disables every toolbar button', () => {
      const { container } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });

      expect(within(container).getByRole('textbox').getAttribute('contenteditable')).not.toBe('true');
      for (const name of ['Bold', 'Italic', 'Underline', 'Bulleted list', 'Numbered list', 'Insert link']) {
        expect((within(container).getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it('disables the native element when the bound FormControl is disabled', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(ReactiveFormHostComponent);

      componentInstance.control.disable();
      fixture.detectChanges();

      expect(within(container).getByRole('textbox').getAttribute('contenteditable')).not.toBe('true');
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoEditorHarness', async () => {
      stubExecCommand();
      stubQueryCommandState(true);
      const { fixture, container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoEditorHarness);

      await harness.clickBold();
      await harness.clickItalic();
      await harness.clickUnderline();
      await harness.clickUnorderedList();
      await harness.clickOrderedList();

      expect(document.execCommand).toHaveBeenCalledWith('bold', false);
      expect(document.execCommand).toHaveBeenCalledWith('italic', false);
      expect(document.execCommand).toHaveBeenCalledWith('underline', false);
      expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false);
      expect(document.execCommand).toHaveBeenCalledWith('insertOrderedList', false);
      expect(await harness.isBoldActive()).toBe(true);
      expect(await harness.isDisabled()).toBe(false);

      const content = within(container).getByRole('textbox') as HTMLDivElement;
      content.innerHTML = '<p>hi</p>';
      expect(await harness.getHtml()).toBe('<p>hi</p>');
    });

    it('clicks the link button through the harness', async () => {
      stubExecCommand();
      window.prompt = vi.fn().mockReturnValue('https://example.com') as typeof window.prompt;
      const { fixture } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoEditorHarness);

      await harness.clickLink();

      expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    });

    it('reports disabled through the harness', async () => {
      const { fixture } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes', disabled: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, DynamoEditorHarness);

      expect(await harness.isDisabled()).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in the default state', async () => {
      const { container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
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
      const { fixture, container } = renderDynamoComponent(DynamoEditor, { inputs: { ariaLabel: 'Notes' } });
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
      const { fixture, container, componentInstance } = renderDynamoComponent(DynamoEditor, {
        inputs: { ariaLabel: 'Notes' },
      });

      componentInstance.writeValue(null);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(within(container).getByRole('textbox').innerHTML).toBe('');
    });
  });
});
