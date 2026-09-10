import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DocExamplesLayout, type DocExampleRef } from './examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'filter', title: 'Filter' },
];

@Component({
  standalone: true,
  imports: [DocExamplesLayout],
  template: `
    <docs-examples-layout
      name="Select"
      description="A single-select combobox."
      [examples]="examples"
    >
      <section id="basic">basic</section>
      <section id="filter">filter</section>
      <table api>
        <tbody></tbody>
      </table>
    </docs-examples-layout>
  `,
})
class HostComponent {
  readonly examples = EXAMPLES;
}

describe('DocExamplesLayout', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the header and an on-page nav link per example', () => {
    const el = setup();

    expect(el.querySelector('h1')?.textContent).toContain('Select');

    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '#basic',
      '#filter',
    ]);
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Basic', 'Filter']);
  });

  it('projects example content and the API slot', () => {
    const el = setup();

    expect(el.querySelector('#basic')?.textContent).toContain('basic');
    expect(el.querySelector('table[api]')).toBeTruthy();
    expect(el.textContent).toContain('API');
  });

  it('scrolls an example to the top when its nav link is clicked', () => {
    const el = setup();
    const scrollIntoView = vi.fn();
    const basic = el.querySelector('#basic') as HTMLElement;
    basic.scrollIntoView = scrollIntoView;

    const link = el.querySelector<HTMLAnchorElement>('nav a[href="#basic"]');
    link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });
});
