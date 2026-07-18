import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readProjectConfiguration, type Tree } from '@nx/devkit';
import { beforeEach, describe, expect, it } from 'vitest';

import { componentGenerator } from './component';
import type { ComponentGeneratorSchema } from './schema';

describe('componentGenerator', () => {
  let tree: Tree;
  const options: ComponentGeneratorSchema = { name: 'test-widget', domain: 'forms' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('registers the project under libs/components/<domain>/<name>', async () => {
    await componentGenerator(tree, options);

    const config = readProjectConfiguration(tree, 'forms-test-widget');
    expect(config.root).toBe('libs/components/forms/test-widget');
  });

  it('tags the project with type:component and domain:<domain>', async () => {
    await componentGenerator(tree, options);

    const config = readProjectConfiguration(tree, 'forms-test-widget');
    expect(config.tags).toEqual(expect.arrayContaining(['type:component', 'domain:forms', 'scope:public']));
  });

  it('writes the full DynamoNG component file set, not the generic library scaffold', async () => {
    await componentGenerator(tree, options);

    const libDir = 'libs/components/forms/test-widget/src/lib';
    expect(tree.exists(`${libDir}/test-widget.ts`)).toBe(true);
    expect(tree.exists(`${libDir}/test-widget.html`)).toBe(true);
    expect(tree.exists(`${libDir}/test-widget.spec.ts`)).toBe(true);
    expect(tree.exists(`${libDir}/test-widget.types.ts`)).toBe(true);
    expect(tree.exists(`${libDir}/test-widget.styles.ts`)).toBe(true);
    expect(tree.exists(`${libDir}/test-widget.harness.ts`)).toBe(true);
  });

  it('names the component class with a Dynamo prefix and PascalCase', async () => {
    await componentGenerator(tree, options);

    const content = tree.read('libs/components/forms/test-widget/src/lib/test-widget.ts', 'utf-8');
    expect(content).toContain('export class DynamoTestWidget');
  });

  it('produces a spec file covering every mandatory checklist section', async () => {
    await componentGenerator(tree, options);

    const spec = tree.read('libs/components/forms/test-widget/src/lib/test-widget.spec.ts', 'utf-8') ?? '';
    for (const section of [
      'creation',
      'default behavior',
      'input properties',
      'output events',
      'user interactions',
      'conditional rendering',
      'template behavior',
      'accessibility',
      'state changes',
      'edge cases',
    ]) {
      expect(spec).toContain(`describe('${section}'`);
    }
  });

  it('does not leave the generic library-generator demo component behind', async () => {
    await componentGenerator(tree, options);

    const libChildren = tree.children('libs/components/forms/test-widget/src/lib');
    expect(libChildren).not.toContain('forms-test-widget');
  });
});
