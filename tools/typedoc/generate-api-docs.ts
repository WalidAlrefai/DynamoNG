import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Application } from 'typedoc';

interface ApiTableRow {
  name: string;
  type: string;
  default: string;
}

interface ComponentTarget {
  entryPoint: string;
  className: string;
  sourceFile: string;
  outFile: string;
}

const TARGETS: ComponentTarget[] = [
  {
    entryPoint: 'libs/components/forms/checkbox/src/index.ts',
    className: 'DynamoCheckbox',
    sourceFile: 'libs/components/forms/checkbox/src/lib/checkbox.ts',
    outFile: 'apps/docs/src/app/generated/api/checkbox.json',
  },
  {
    entryPoint: 'libs/components/forms/radio/src/index.ts',
    className: 'DynamoRadio',
    sourceFile: 'libs/components/forms/radio/src/lib/radio.ts',
    outFile: 'apps/docs/src/app/generated/api/radio.json',
  },
  {
    entryPoint: 'libs/components/forms/switch/src/index.ts',
    className: 'DynamoSwitch',
    sourceFile: 'libs/components/forms/switch/src/lib/switch.ts',
    outFile: 'apps/docs/src/app/generated/api/switch.json',
  },
  {
    entryPoint: 'libs/components/forms/textarea/src/index.ts',
    className: 'DynamoTextarea',
    sourceFile: 'libs/components/forms/textarea/src/lib/textarea.ts',
    outFile: 'apps/docs/src/app/generated/api/textarea.json',
  },
];

const SIGNAL_INPUT_KINDS = new Set([
  'ModelSignal',
  'InputSignal',
  'InputSignalWithTransform',
]);

// TypeDoc's `defaultValue` for a signal-initializer expression like
// `model(false)` is just the placeholder string "...", not the real value —
// it doesn't statically evaluate call-expression initializers. So the actual
// default (and whether a property is `model()`/`input()`/`input.required()`,
// which we render as a "(model)"/"(required)" suffix matching this repo's
// existing hand-written tables) comes from a small regex scan of the
// component's own source instead. This only needs to handle the simple,
// single-line `readonly x = input(...)`/`model(...)` shape every component
// in this repo already follows — not general TS expression parsing.
function scanSourceDefaults(
  sourceFile: string,
): Map<
  string,
  { kind: 'model' | 'input' | 'input.required'; defaultText: string | null }
> {
  const source = readFileSync(sourceFile, 'utf8');
  const result = new Map<
    string,
    { kind: 'model' | 'input' | 'input.required'; defaultText: string | null }
  >();
  const pattern =
    /readonly\s+(\w+)\s*=\s*(model|input)(\.required)?(?:<[^>]*>)?\(([^)]*)\)/g;
  for (const match of source.matchAll(pattern)) {
    const [, name, base, required, rawArgs] = match;
    const kind = required ? 'input.required' : (base as 'model' | 'input');
    const defaultText =
      rawArgs && rawArgs.trim().length > 0 ? rawArgs.trim() : null;
    result.set(name, { kind, defaultText });
  }
  return result;
}

function renderType(node: any, project: any): string {
  if (!node) return 'unknown';
  switch (node.type) {
    case 'intrinsic':
      return node.name;
    case 'reference': {
      // A reference to a workspace type alias (e.g. `DynamoSize`) resolves — via
      // `.reflection`, only populated when the alias's defining module is itself
      // one of the entry points below — to a reflection whose own `.type` is the
      // aliased type. Render that instead of the opaque alias name so e.g.
      // `'sm' | 'md' | 'lg'` shows up directly.
      const target = node.reflection;
      if (target?.type) return renderType(target.type, project);
      return node.name;
    }
    case 'literal':
      return typeof node.value === 'string'
        ? `'${node.value}'`
        : String(node.value);
    case 'union':
      return node.types.map((t: any) => renderType(t, project)).join(' | ');
    default:
      return node.name ?? 'unknown';
  }
}

async function run() {
  const app = await Application.bootstrapWithPlugins({
    // libs/core/api is included so shared type aliases (e.g. `DynamoSize`) used
    // by component inputs get a resolvable reflection — see renderType()'s
    // 'reference' case — rather than rendering as the opaque alias name.
    entryPoints: [
      ...TARGETS.map((t) => t.entryPoint),
      'libs/core/api/src/index.ts',
    ],
    tsconfig: 'tsconfig.base.json',
    skipErrorChecking: true,
    excludeExternals: true,
  });

  const project = await app.convert();
  if (!project) {
    throw new Error('TypeDoc conversion failed');
  }

  for (const target of TARGETS) {
    const classReflection = findClass(project, target.className);
    if (!classReflection) {
      throw new Error(
        `Could not find class ${target.className} in TypeDoc output`,
      );
    }

    const defaults = scanSourceDefaults(target.sourceFile);
    const rows: ApiTableRow[] = [];

    for (const child of classReflection.children ?? []) {
      if (
        child.flags?.isInherited ||
        child.flags?.isProtected ||
        child.flags?.isPrivate
      )
        continue;
      const typeName = child.type?.name;
      if (!SIGNAL_INPUT_KINDS.has(typeName)) continue;

      const valueType = child.type?.typeArguments?.[0];
      const renderedType = renderType(valueType, project);
      const scanned = defaults.get(child.name);
      const suffix =
        scanned?.kind === 'model'
          ? ' (model)'
          : scanned?.kind === 'input.required'
            ? ' (required)'
            : '';

      rows.push({
        name: child.name,
        type: `${renderedType}${suffix}`,
        default:
          scanned?.kind === 'input.required'
            ? '—'
            : (scanned?.defaultText ?? '—'),
      });
    }

    rows.sort((a, b) => a.name.localeCompare(b.name));

    const outFile = resolve(target.outFile);
    mkdirSync(resolve(outFile, '..'), { recursive: true });
    writeFileSync(outFile, JSON.stringify(rows, null, 2) + '\n', 'utf8');
    console.log(`Wrote ${outFile} (${rows.length} rows)`);
  }
}

function findClass(node: any, name: string): any {
  if (node.name === name && node.kind === 128) return node;
  for (const child of node.children ?? []) {
    const found = findClass(child, name);
    if (found) return found;
  }
  return null;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
