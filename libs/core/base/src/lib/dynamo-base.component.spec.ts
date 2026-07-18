import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { beforeEach, describe, expect, it } from 'vitest';
import { DynamoBaseComponent } from './dynamo-base.component';

type TestPart = 'root' | 'icon';

@Component({
  selector: 'dg-test-base-host',
  template: `<span [attr.data-style-class]="styleClass()" [attr.data-icon-title]="ptFor('icon')['title']"></span>`,
})
class TestBaseHostComponent extends DynamoBaseComponent<TestPart> {}

describe('DynamoBaseComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('defaults styleClass to an empty string and unstyled to false', async () => {
    const { fixture } = await render(TestBaseHostComponent);
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance.styleClass()).toBe('');
    expect(instance.unstyled()).toBe(false);
  });

  it('reflects an input styleClass value', async () => {
    const { fixture } = await render(TestBaseHostComponent, { inputs: { styleClass: 'extra-class' } });
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance.styleClass()).toBe('extra-class');
  });

  it('ptFor returns an empty object for a part with no passthrough configured', async () => {
    const { fixture } = await render(TestBaseHostComponent);
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance['ptFor']('icon')).toEqual({});
  });

  it('ptFor returns the configured attributes for a named part', async () => {
    const { fixture } = await render(TestBaseHostComponent, {
      inputs: { pt: { icon: { title: 'Close' } } },
    });
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance['ptFor']('icon')).toEqual({ title: 'Close' });
  });

  it('resolves the global DYNAMONG_CONFIG via injection', async () => {
    const { fixture } = await render(TestBaseHostComponent);
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance['config'].theme).toBe('aura');
  });

  it('generates a unique id via the shared DynamoIdGenerator', async () => {
    const { fixture } = await render(TestBaseHostComponent);
    const instance: TestBaseHostComponent = fixture.componentInstance;

    expect(instance['idGenerator'].next('test')).toMatch(/^test-\d+$/);
  });
});
