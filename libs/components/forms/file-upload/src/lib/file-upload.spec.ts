import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { fireEvent, within } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { DynamoFileUpload } from './file-upload';
import { DynamoFileUploadHarness } from './file-upload.harness';
import type {
  DynamoFileRejection,
  DynamoFileUploadProgress,
} from './file-upload.types';

function makeFile(name: string, size: number, type = 'text/plain'): File {
  return new File([new Uint8Array(size)], name, { type });
}

// jsdom implements neither DataTransfer nor DragEvent (confirmed: both throw
// "is not a constructor"), so drag events are built by hand — a plain Event
// with `dataTransfer` attached via defineProperty — and dispatched directly,
// same workaround category as Carousel/Slider's pointer-capture guards.
function dropEvent(files: File[]): Event {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  return event;
}

function dragOverEvent(): Event {
  return new Event('dragover', { bubbles: true, cancelable: true });
}

function dragLeaveEvent(): Event {
  return new Event('dragleave', { bubbles: true, cancelable: true });
}

describe('DynamoFileUpload', () => {
  describe('creation', () => {
    it('renders a role="button" dropzone', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);

      expect(within(container).getByRole('button')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('defaults to an empty file list, single-file mode, and the default label', () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);

      expect(componentInstance.value()).toEqual([]);
      expect(componentInstance.multiple()).toBe(false);
      expect(componentInstance.disabled()).toBe(false);
      expect(
        within(container).getByText(
          'Drag and drop files here, or click to browse',
        ),
      ).toBeTruthy();
      expect(container.querySelector('li')).toBeNull();
    });

    it('renders a custom label', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { label: 'Upload your resume' },
      });

      expect(within(container).getByText('Upload your resume')).toBeTruthy();
    });
  });

  describe('user interactions', () => {
    it('clicking the dropzone opens the native file browser', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      fireEvent.click(within(container).getByRole('button'));

      expect(clickSpy).toHaveBeenCalledOnce();
    });

    it('Enter/Space on the dropzone also opens the file browser', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');
      const dropzone = within(container).getByRole('button');

      fireEvent.keyDown(dropzone, { key: 'Enter' });
      fireEvent.keyDown(dropzone, { key: ' ' });

      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it('adds a file selected through the native input', () => {
      const { fixture, container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = makeFile('report.pdf', 1024, 'application/pdf');

      fireEvent.change(input, { target: { files: [file] } });
      fixture.detectChanges();

      expect(componentInstance.value()).toEqual([file]);
      expect(within(container).getByText('report.pdf')).toBeTruthy();
    });

    it('resets the native input value so re-picking the same file still fires change', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('a.txt', 10)] },
      });

      expect(input.value).toBe('');
    });

    it('replaces rather than appends when multiple is false', () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('first.txt', 10)] },
      });
      fireEvent.change(input, {
        target: { files: [makeFile('second.txt', 10)] },
      });

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'second.txt',
      ]);
    });

    it('appends when multiple is true', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true } },
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('first.txt', 10)] },
      });
      fireEvent.change(input, {
        target: { files: [makeFile('second.txt', 10)] },
      });

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'first.txt',
        'second.txt',
      ]);
    });

    it('removes a file when its remove button is clicked', () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true } },
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: {
          files: [makeFile('keep.txt', 10), makeFile('remove.txt', 10)],
        },
      });
      fixture.detectChanges();

      fireEvent.click(within(container).getByLabelText('Remove remove.txt'));
      fixture.detectChanges();

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'keep.txt',
      ]);
      expect(within(container).queryByText('remove.txt')).toBeNull();
    });

    it('formats file sizes for display', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { value: [makeFile('big.bin', 1_572_864)] },
      });

      expect(within(container).getByText('1.5 MB')).toBeTruthy();
    });
  });

  describe('drag and drop', () => {
    it('accepts dropped files', () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      const dropzone = within(container).getByRole('button');

      fireEvent(dropzone, dropEvent([makeFile('dropped.txt', 10)]));

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'dropped.txt',
      ]);
    });

    it('reflects the dragging state while a file is dragged over, and clears it on drop', () => {
      const { fixture, container } = renderDynamoComponent(DynamoFileUpload);
      const dropzone = within(container).getByRole('button');

      fireEvent(dropzone, dragOverEvent());
      fixture.detectChanges();
      expect(dropzone.className).toContain('border-primary');

      fireEvent(dropzone, dragLeaveEvent());
      fixture.detectChanges();
      expect(dropzone.className).not.toContain('border-primary');

      fireEvent(dropzone, dragOverEvent());
      fixture.detectChanges();
      fireEvent(dropzone, dropEvent([makeFile('a.txt', 10)]));
      fixture.detectChanges();
      expect(dropzone.className).not.toContain('border-primary');
    });

    it('ignores drops while disabled', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { disabled: true } },
      );
      const dropzone = within(container).getByRole('button');

      fireEvent(dropzone, dropEvent([makeFile('a.txt', 10)]));

      expect(componentInstance.value()).toEqual([]);
    });

    it('does not enter the dragging state while disabled', () => {
      const { fixture, container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { disabled: true },
      });
      const dropzone = within(container).getByRole('button');

      fireEvent(dropzone, dragOverEvent());
      fixture.detectChanges();

      expect(dropzone.className).not.toContain('border-primary');
    });
  });

  describe('validation', () => {
    it('rejects files that fail the accept pattern (extension and wildcard mime)', () => {
      const rejections: DynamoFileRejection[] = [];
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true, accept: '.png,image/*' } },
      );
      componentInstance.rejected.subscribe((batch) =>
        rejections.push(...batch),
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: {
          files: [
            makeFile('notes.txt', 10, 'text/plain'),
            makeFile('photo.png', 10, 'image/png'),
            makeFile('icon.svg', 10, 'image/svg+xml'),
          ],
        },
      });

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'photo.png',
        'icon.svg',
      ]);
      expect(rejections).toEqual([
        {
          file: expect.objectContaining({ name: 'notes.txt' }),
          reason: 'type',
        },
      ]);
    });

    it('rejects files over maxFileSize', () => {
      const rejections: DynamoFileRejection[] = [];
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { maxFileSize: 100 } },
      );
      componentInstance.rejected.subscribe((batch) =>
        rejections.push(...batch),
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('huge.bin', 200)] },
      });

      expect(componentInstance.value()).toEqual([]);
      expect(rejections).toEqual([
        { file: expect.objectContaining({ name: 'huge.bin' }), reason: 'size' },
      ]);
    });

    it('matches an exact mime type with no wildcard or extension pattern', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { accept: 'application/pdf' } },
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('doc.pdf', 10, 'application/pdf')] },
      });

      expect(componentInstance.value().map((f) => f.name)).toEqual(['doc.pdf']);
    });

    it('accepts everything when accept resolves to no patterns', () => {
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { accept: ' , ' } },
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, { target: { files: [makeFile('a.txt', 10)] } });

      expect(componentInstance.value().map((f) => f.name)).toEqual(['a.txt']);
    });

    it('rejects files past maxFiles, counting already-selected files', () => {
      const rejections: DynamoFileRejection[] = [];
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true, maxFiles: 2 } },
      );
      componentInstance.rejected.subscribe((batch) =>
        rejections.push(...batch),
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('one.txt', 10), makeFile('two.txt', 10)] },
      });
      fireEvent.change(input, {
        target: { files: [makeFile('three.txt', 10)] },
      });

      expect(componentInstance.value().map((f) => f.name)).toEqual([
        'one.txt',
        'two.txt',
      ]);
      expect(rejections).toEqual([
        {
          file: expect.objectContaining({ name: 'three.txt' }),
          reason: 'count',
        },
      ]);
    });
  });

  describe('preview', () => {
    it('defaults showPreview to true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoFileUpload);
      expect(componentInstance.showPreview()).toBe(true);
    });

    it('renders a thumbnail for an image file', () => {
      const { container, fixture, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      componentInstance.value.set([makeFile('photo.png', 10, 'image/png')]);
      fixture.detectChanges();

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toMatch(/^blob:/);
    });

    it('renders no thumbnail for a non-image file', () => {
      const { container, fixture, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      componentInstance.value.set([makeFile('notes.txt', 10, 'text/plain')]);
      fixture.detectChanges();

      expect(container.querySelector('img')).toBeNull();
    });

    it('renders no thumbnail for an image file when showPreview is false', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { showPreview: false } },
      );
      componentInstance.value.set([makeFile('photo.png', 10, 'image/png')]);
      fixture.detectChanges();

      expect(container.querySelector('img')).toBeNull();
    });

    it('revokes the object URL when the file is removed', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      const { container, fixture, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      const file = makeFile('photo.png', 10, 'image/png');
      componentInstance.value.set([file]);
      fixture.detectChanges();
      expect(container.querySelector('img')).not.toBeNull(); // the preview URL is created during this render

      within(container).getByLabelText('Remove photo.png').click();

      expect(revokeSpy).toHaveBeenCalled();
      revokeSpy.mockRestore();
    });
  });

  describe('disabled', () => {
    it('blocks click, keyboard, and native selection', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { disabled: true },
      });
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');
      const dropzone = within(container).getByRole('button');

      fireEvent.click(dropzone);
      fireEvent.keyDown(dropzone, { key: 'Enter' });

      expect(clickSpy).not.toHaveBeenCalled();
      expect(input.disabled).toBe(true);
      expect(dropzone.getAttribute('aria-disabled')).toBe('true');
      expect(dropzone.getAttribute('tabindex')).toBe('-1');
    });

    it('disables each remove button', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { disabled: true, value: [makeFile('a.txt', 10)] },
      });

      const removeButton = within(container).getByLabelText(
        'Remove a.txt',
      ) as HTMLButtonElement;
      expect(removeButton.disabled).toBe(true);
    });
  });

  describe('loading', () => {
    it('renders a spinner in the dropzone only while loading', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { loading: false },
      });
      expect(container.querySelector('dg-spinner')).toBeNull();

      setInputs({ loading: true });

      expect(container.querySelector('dg-spinner')).not.toBeNull();
    });

    it('sets aria-busy and blocks click, keyboard, and drag-and-drop while loading', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { loading: true },
      });
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');
      const dropzone = within(container).getByRole('button');

      expect(dropzone.getAttribute('aria-busy')).toBe('true');
      expect(dropzone.getAttribute('aria-disabled')).toBe('true');
      expect(dropzone.getAttribute('tabindex')).toBe('-1');
      expect(input.disabled).toBe(true);

      fireEvent.click(dropzone);
      fireEvent.keyDown(dropzone, { key: 'Enter' });
      expect(clickSpy).not.toHaveBeenCalled();

      dropzone.dispatchEvent(dropEvent([makeFile('a.txt', 10)]));

      expect(container.querySelector('li')).toBeNull();
    });

    it('disables each remove button while loading', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { loading: true, value: [makeFile('a.txt', 10)] },
      });

      const removeButton = within(container).getByLabelText(
        'Remove a.txt',
      ) as HTMLButtonElement;
      expect(removeButton.disabled).toBe(true);
    });

    it('re-enables the dropzone when loading transitions back to false', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { loading: true },
      });
      const dropzone = within(container).getByRole('button');
      expect(dropzone.getAttribute('aria-disabled')).toBe('true');

      setInputs({ loading: false });

      expect(dropzone.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('falls back aria-label to the label text when unset', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);

      expect(
        within(container).getByRole('button').getAttribute('aria-label'),
      ).toBe('Drag and drop files here, or click to browse');
    });

    it('uses the provided ariaLabel when set', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { ariaLabel: 'Attachments' },
      });

      expect(
        within(container).getByRole('button').getAttribute('aria-label'),
      ).toBe('Attachments');
    });

    it('has no axe violations in its default state', async () => {
      const { container } = renderDynamoComponent(DynamoFileUpload);
      await expectNoA11yViolations(container);
    });

    it('has no axe violations with files selected', async () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: {
          multiple: true,
          value: [makeFile('a.txt', 10), makeFile('b.txt', 20)],
        },
      });
      await expectNoA11yViolations(container);
    });
  });

  describe('edge cases', () => {
    it('ignores an empty FileList without throwing', () => {
      const { container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      expect(() =>
        fireEvent.change(input, { target: { files: [] } }),
      ).not.toThrow();
      expect(componentInstance.value()).toEqual([]);
    });

    it('formats a zero-byte file as "0 B"', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { value: [makeFile('empty.txt', 0)] },
      });

      expect(within(container).getByText('0 B')).toBeTruthy();
    });
  });

  describe('DynamoFileUploadHarness', () => {
    it('supports the documented interaction API', async () => {
      const { fixture, container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true } },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: {
          files: [makeFile('one.txt', 10), makeFile('two.txt', 10)],
        },
      });
      fixture.detectChanges();

      expect(await harness.getSelectedFileNames()).toEqual([
        'one.txt',
        'two.txt',
      ]);
      expect(await harness.isDisabled()).toBe(false);

      await harness.removeFileByName('one.txt');
      expect(componentInstance.value().map((f) => f.name)).toEqual(['two.txt']);
    });

    it('opens the file browser', async () => {
      const { fixture, container } = renderDynamoComponent(DynamoFileUpload);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      await harness.openFileBrowser();

      expect(clickSpy).toHaveBeenCalledOnce();
    });

    it('throws when removing a file name that is not present', async () => {
      const { fixture } = renderDynamoComponent(DynamoFileUpload);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );

      await expect(harness.removeFileByName('missing.txt')).rejects.toThrow(
        'No file item found with name "missing.txt"',
      );
    });
  });

  describe('filesAdded', () => {
    it('emits exactly the newly-accepted files, not the full accumulated value', () => {
      const batches: File[][] = [];
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { multiple: true } },
      );
      componentInstance.filesAdded.subscribe((batch) => batches.push(batch));
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('first.txt', 10)] },
      });
      fireEvent.change(input, {
        target: {
          files: [makeFile('second.txt', 10), makeFile('third.txt', 10)],
        },
      });

      expect(batches.map((b) => b.map((f) => f.name))).toEqual([
        ['first.txt'],
        ['second.txt', 'third.txt'],
      ]);
    });

    it('does not fire for a batch that was entirely rejected', () => {
      const filesAdded = vi.fn();
      const { container, componentInstance } = renderDynamoComponent(
        DynamoFileUpload,
        { inputs: { accept: '.png' } },
      );
      componentInstance.filesAdded.subscribe(filesAdded);
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: { files: [makeFile('notes.txt', 10, 'text/plain')] },
      });

      expect(filesAdded).not.toHaveBeenCalled();
    });

    it('emits only the single replacing file in non-multiple mode', () => {
      const batches: File[][] = [];
      const { container, componentInstance } =
        renderDynamoComponent(DynamoFileUpload);
      componentInstance.filesAdded.subscribe((batch) => batches.push(batch));
      const input = container.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;

      fireEvent.change(input, {
        target: {
          files: [makeFile('a.txt', 10), makeFile('b.txt', 10)],
        },
      });

      expect(batches).toEqual([[expect.objectContaining({ name: 'a.txt' })]]);
    });
  });

  describe('fileStatus', () => {
    function renderWithStatus(status: DynamoFileUploadProgress) {
      const file = makeFile('report.pdf', 2048, 'application/pdf');
      const rendered = renderDynamoComponent(DynamoFileUpload, {
        inputs: {
          value: [file],
          fileStatus: new Map([[file, status]]),
        },
      });
      return { ...rendered, file };
    }

    it('renders no progress bar, status icon, or error text when fileStatus is unset (regression)', () => {
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: { value: [makeFile('report.pdf', 2048)] },
      });

      expect(container.querySelector('[data-progress]')).toBeNull();
      expect(container.querySelector('[data-success]')).toBeNull();
      expect(container.querySelector('[data-error]')).toBeNull();
    });

    it('renders a progress bar at the given percent while uploading', async () => {
      const { container, fixture } = renderWithStatus({
        status: 'uploading',
        progress: 42,
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );

      const fill = container.querySelector('[data-progress]') as HTMLElement;
      expect(fill.style.width).toBe('42%');
      expect(await harness.getProgress('report.pdf')).toBe(42);
      expect(await harness.getStatus('report.pdf')).toBe('uploading');
    });

    it('renders a success icon and no progress bar or error text', async () => {
      const { container, fixture } = renderWithStatus({ status: 'success' });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );

      expect(container.querySelector('[data-success]')).toBeTruthy();
      expect(container.querySelector('[data-progress]')).toBeNull();
      expect(await harness.getStatus('report.pdf')).toBe('success');
    });

    it('renders the given error message, falling back to a generic one when unset', async () => {
      const { container, fixture } = renderWithStatus({
        status: 'error',
        error: 'Network timeout',
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoFileUploadHarness,
      );

      expect(container.querySelector('[data-error]')?.textContent).toBe(
        'Network timeout',
      );
      expect(await harness.getErrorText('report.pdf')).toBe('Network timeout');
      expect(await harness.getStatus('report.pdf')).toBe('error');
    });

    it('falls back to a generic error message when none is given', () => {
      const { container } = renderWithStatus({ status: 'error' });

      expect(container.querySelector('[data-error]')?.textContent).toBe(
        'Upload failed',
      );
    });

    it('leaves the remove button enabled while a file is uploading (documented scope cut)', () => {
      const { container } = renderWithStatus({
        status: 'uploading',
        progress: 10,
      });

      const removeButton = within(container).getByRole('button', {
        name: 'Remove report.pdf',
      }) as HTMLButtonElement;
      expect(removeButton.disabled).toBe(false);
    });

    it('has no axe violations with a mixed-status file list', async () => {
      const uploading = makeFile('uploading.txt', 10);
      const success = makeFile('success.txt', 10);
      const error = makeFile('error.txt', 10);
      const { container } = renderDynamoComponent(DynamoFileUpload, {
        inputs: {
          multiple: true,
          value: [uploading, success, error],
          fileStatus: new Map<File, DynamoFileUploadProgress>([
            [uploading, { status: 'uploading', progress: 50 }],
            [success, { status: 'success' }],
            [error, { status: 'error', error: 'Failed' }],
          ]),
        },
      });

      await expectNoA11yViolations(container);
    });
  });
});
