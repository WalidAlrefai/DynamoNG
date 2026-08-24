import {
  formatFiles,
  joinPathFragments,
  logger,
  names,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator, UnitTestRunner } from '@nx/angular/generators';
import type { ComponentGeneratorSchema } from './schema';

export async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema,
) {
  const { name, domain } = options;
  const { className: pascalName } = names(name);
  const dynamoClassName = `Dynamo${pascalName}`;
  const selector = options.selector ?? `dg-${name}`;
  const projectName = `${domain}-${name}`;
  const projectRoot = `libs/components/${domain}/${name}`;
  const importPath = `@dynamong/${name}`;

  await libraryGenerator(tree, {
    directory: projectRoot,
    name: projectName,
    importPath,
    buildable: true,
    publishable: true,
    unitTestRunner: UnitTestRunner.VitestAngular,
    style: 'none',
    standalone: true,
    linter: 'eslint',
    prefix: 'dg',
    // Every new component starts as a dependency-graph leaf (tier:0). If it
    // later grows a dependency on another @dynamong/* component, bump this
    // tag by hand to (that dependency's highest tier) + 1 — the
    // `@nx/enforce-module-boundaries` tier constraints in the root
    // eslint.config.mjs reject a same-or-higher-tier import outright, so
    // forgetting the bump fails lint immediately rather than silently.
    tags: `type:component,domain:${domain},tier:0,scope:public`,
    skipModule: true,
    skipFormat: true,
  });

  // The base generator scaffolds a demo component named after the project
  // (e.g. src/lib/forms-button/); replace it with DynamoNG's own file set.
  const libDir = joinPathFragments(projectRoot, 'src/lib');
  for (const child of tree.children(libDir)) {
    tree.delete(joinPathFragments(libDir, child));
  }

  tree.write(
    joinPathFragments(projectRoot, 'src/index.ts'),
    indexFileContent(name),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.types.ts`),
    typesFileContent(name, pascalName),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.styles.ts`),
    stylesFileContent(name, pascalName),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.html`),
    templateFileContent(dynamoClassName),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.ts`),
    componentFileContent(name, pascalName, dynamoClassName, selector),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.harness.ts`),
    harnessFileContent(name, pascalName, selector),
  );
  tree.write(
    joinPathFragments(libDir, `${name}.spec.ts`),
    specFileContent(name, pascalName, dynamoClassName),
  );

  await formatFiles(tree);

  logger.info(
    `\nScaffolded @dynamong/${name} at ${projectRoot}.\n` +
      `Next steps:\n` +
      `  1. npm install                     (links the new package into node_modules)\n` +
      `  2. Implement ${dynamoClassName} in ${libDir}/${name}.ts\n` +
      `  3. Fill in the checklist sections in ${libDir}/${name}.spec.ts\n` +
      `  4. nx run ${projectName}:build / :test / :lint\n`,
  );
}

function indexFileContent(name: string): string {
  return (
    `export * from './lib/${name}';\n` +
    `export * from './lib/${name}.types';\n`
  );
}

function typesFileContent(name: string, pascalName: string): string {
  return `export type Dynamo${pascalName}Size = 'sm' | 'md' | 'lg';
export type Dynamo${pascalName}Part = 'root';
`;
}

function stylesFileContent(name: string, pascalName: string): string {
  return `import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — never inline in ${name}.html. See @dynamong/utils/class-merge's
// \`cn()\` for how this composes with \`styleClass\`/\`pt\` overrides.
export const ${toCamelCase(pascalName)}Styles = cva('', {
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
`;
}

function templateFileContent(dynamoClassName: string): string {
  return `<div [class]="classes()" [attr.data-testid]="'${dynamoClassName}'">\n  <ng-content />\n</div>\n`;
}

function componentFileContent(
  name: string,
  pascalName: string,
  dynamoClassName: string,
  selector: string,
): string {
  const stylesFn = `${toCamelCase(pascalName)}Styles`;
  return `import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import type { Dynamo${pascalName}Part, Dynamo${pascalName}Size } from './${name}.types';
import { ${stylesFn} } from './${name}.styles';

@Component({
  selector: '${selector}',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './${name}.html',
})
export class ${dynamoClassName} extends DynamoBaseComponent<Dynamo${pascalName}Part> {
  readonly size = input<Dynamo${pascalName}Size>('md');

  protected readonly classes = computed(() =>
    this.unstyled() ? this.styleClass() : cn(${stylesFn}({ size: this.size() }), this.styleClass()),
  );
}
`;
}

function harnessFileContent(
  name: string,
  pascalName: string,
  selector: string,
): string {
  return `import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for ${pascalName}, for use in consumer app tests. */
export class Dynamo${pascalName}Harness extends ComponentHarness {
  static hostSelector = '${selector}';
}
`;
}

function specFileContent(
  name: string,
  pascalName: string,
  dynamoClassName: string,
): string {
  return `import { renderDynamoComponent } from '@dynamong/testing';
import { expectNoA11yViolations } from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { ${dynamoClassName} } from './${name}';

describe('${dynamoClassName}', () => {
  describe('creation', () => {
    it.todo('renders without errors and has the expected host element');
  });

  describe('default behavior', () => {
    it.todo('produces the documented default appearance/state with no inputs set');
  });

  describe('input properties', () => {
    it.todo('reflects each input, including boundary/invalid values');
  });

  describe('output events', () => {
    it.todo('emits each output with the correct payload and call count');
  });

  describe('user interactions', () => {
    it.todo('responds correctly to click/keyboard/focus/blur interactions');
  });

  describe('conditional rendering', () => {
    it.todo('only renders optional template branches when their inputs are set');
  });

  describe('template behavior', () => {
    it.todo('reflects size/variant/state via class bindings; projects content correctly');
  });

  describe('accessibility', () => {
    it('has no axe violations in its default state', async () => {
      const { container } = await renderDynamoComponent(${dynamoClassName});
      await expectNoA11yViolations(container);
    });

    it.todo('exposes the correct role/aria-* attributes once the component has real markup');
  });

  describe('state changes', () => {
    it.todo('updates the DOM correctly across disabled/loading/error transitions');
  });

  describe('edge cases', () => {
    it.todo('handles empty content, long text, and rapid repeated interaction gracefully');
  });
});
`;
}

function toCamelCase(pascalName: string): string {
  return pascalName.charAt(0).toLowerCase() + pascalName.slice(1);
}

// Nx's `nx g` CLI generator runner resolves the factory module and calls it
// as a function; a CommonJS build with only a named export resolves to an
// object, not a callable, and fails with "implementation is not a function".
// `component.spec.ts` imports the named export directly and is unaffected.
export default componentGenerator;
