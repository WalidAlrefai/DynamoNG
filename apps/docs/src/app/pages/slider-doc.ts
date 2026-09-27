import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoSlider } from '@dynamong/slider';
import type { DynamoSliderRange } from '@dynamong/slider';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'range', title: 'Range' },
  { id: 'severity-size', title: 'Severity & Size' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'reactive-forms', title: 'Reactive Forms' },
  { id: 'vertical', title: 'Vertical' },
  { id: 'ticks', title: 'Tick Marks' },
  { id: 'tooltip', title: 'Drag Tooltip' },
];

@Component({
  selector: 'docs-slider-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSlider, ReactiveFormsModule, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Slider"
      description="A draggable range input with keyboard stepping and click-to-jump."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind the value with [(value)]; defaults to a 0–100 range."
        [code]="basicCode"
      >
        <div preview class="flex flex-col gap-2">
          <span class="text-sm text-text-muted">Volume: {{ volume() }}</span>
          <dg-slider [(value)]="volume" ariaLabel="Volume" />
        </div>
      </docs-example>

      <docs-example
        exampleId="range"
        title="Range"
        description="range renders two independently-draggable thumbs; value becomes a DynamoSliderRange ({minValue, maxValue}) instead of a plain number. Thumbs can touch but never cross."
        [code]="rangeCode"
      >
        <div preview class="flex flex-col gap-2">
          <span class="text-sm text-text-muted"
            >Price: {{ priceRange().minValue }} –
            {{ priceRange().maxValue }}</span
          >
          <dg-slider
            [(value)]="priceRange"
            [range]="true"
            [min]="0"
            [max]="200"
            ariaLabel="Price"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="severity-size"
        title="Severity & Size"
        description="severity recolors the track/thumb; size sets the track thickness."
        [code]="severitySizeCode"
      >
        <div preview>
          <dg-slider
            [value]="70"
            severity="success"
            size="lg"
            ariaLabel="Brightness"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled blocks drag, click, and keyboard interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-slider [value]="40" [disabled]="true" ariaLabel="Disabled" />
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps the thumb visible/focusable but blocks dragging, clicking, and keyboard changes — unlike disabled, it doesn't dim the track or remove it from the tab order."
        [code]="readonlyCode"
      >
        <div preview>
          <dg-slider [value]="60" [readOnly]="true" ariaLabel="Read-only" />
        </div>
      </docs-example>

      <docs-example
        exampleId="vertical"
        title="Vertical"
        description="orientation set to vertical renders a bottom-anchored track that grows upward — verticalHeight sets its pixel height."
        [code]="verticalCode"
      >
        <div preview class="flex items-end gap-2">
          <span class="text-sm text-text-muted">{{ verticalVolume() }}</span>
          <dg-slider
            [(value)]="verticalVolume"
            orientation="vertical"
            ariaLabel="Vertical volume"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="ticks"
        title="Tick Marks"
        description="showTicks renders a dot per step; tickValues renders an explicit, sparse set instead, ignoring step."
        [code]="ticksCode"
      >
        <div preview class="flex flex-col gap-2">
          <dg-slider
            [value]="60"
            [step]="20"
            [showTicks]="true"
            ariaLabel="Ticks by step"
          />
          <dg-slider
            [value]="60"
            [tickValues]="[0, 25, 50, 75, 100]"
            ariaLabel="Sparse ticks"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="tooltip"
        title="Drag Tooltip"
        description="showTooltip shows the live value in a small bubble while a thumb is actively being dragged."
        [code]="tooltipCode"
      >
        <div preview>
          <dg-slider
            [value]="45"
            [showTooltip]="true"
            ariaLabel="With tooltip"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="reactive-forms"
        title="Reactive Forms"
        description="Implements ControlValueAccessor, so it plugs directly into formControl/ngModel."
        [code]="reactiveFormsCode"
      >
        <div preview class="flex flex-col gap-2">
          <span class="text-sm text-text-muted"
            >Value: {{ reactiveVolume.value }}</span
          >
          <dg-slider
            [formControl]="reactiveVolume"
            ariaLabel="Reactive volume"
          />
        </div>
      </docs-example>

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
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">min / max / step</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">0 / 100 / 1</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">range</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">disabled</td>
            <td class="py-2 pr-4 font-mono">boolean (model)</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">readOnly</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">severity</td>
            <td class="py-2 pr-4 font-mono">
              'primary' | 'secondary' | 'success' | 'info' | 'warning' |
              'danger'
            </td>
            <td class="py-2 font-mono">'primary'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">size</td>
            <td class="py-2 pr-4 font-mono">'sm' | 'md' | 'lg'</td>
            <td class="py-2 font-mono">'md'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Slider')</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">orientation</td>
            <td class="py-2 pr-4 font-mono">'horizontal' | 'vertical'</td>
            <td class="py-2 font-mono">'horizontal'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">verticalHeight</td>
            <td class="py-2 pr-4 font-mono">number</td>
            <td class="py-2 font-mono">200</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showTicks</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">tickValues</td>
            <td class="py-2 pr-4 font-mono">number[] | undefined</td>
            <td class="py-2 font-mono">undefined</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">showTooltip</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
        </tbody>
      </table>
    </docs-examples-layout>
  `,
})
export class SliderDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly volume = signal(50);
  protected readonly priceRange = signal<DynamoSliderRange>({
    minValue: 20,
    maxValue: 80,
  });

  protected readonly verticalVolume = signal(50);

  protected readonly reactiveVolume = new FormControl(30, {
    nonNullable: true,
  });

  protected readonly basicCode = `<dg-slider [(value)]="volume" ariaLabel="Volume" />`;
  protected readonly rangeCode = `<dg-slider [(value)]="priceRange" [range]="true" [min]="0" [max]="200" ariaLabel="Price" />`;
  protected readonly severitySizeCode = `<dg-slider [value]="70" severity="success" size="lg" ariaLabel="Brightness" />`;
  protected readonly disabledCode = `<dg-slider [value]="40" [disabled]="true" ariaLabel="Disabled" />`;
  protected readonly readonlyCode = `<dg-slider [value]="60" [readOnly]="true" ariaLabel="Read-only" />`;
  protected readonly reactiveFormsCode = `<dg-slider [formControl]="volume" />`;
  protected readonly verticalCode = `<dg-slider [(value)]="volume" orientation="vertical" ariaLabel="Vertical volume" />`;
  protected readonly ticksCode = `<dg-slider [value]="60" [step]="20" [showTicks]="true" ariaLabel="Ticks by step" />`;
  protected readonly tooltipCode = `<dg-slider [value]="45" [showTooltip]="true" ariaLabel="With tooltip" />`;
}
