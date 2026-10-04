import { describe, expect, it } from 'vitest';
import {
  collectCascadeIds,
  computeNodeCheckState,
  shouldCascadeCheck,
} from './tree-selection';
import type { DynamoTreeNode } from './tree.types';

const TREE: DynamoTreeNode = {
  id: 'docs',
  label: 'Documents',
  children: [
    { id: 'resume', label: 'Resume' },
    { id: 'cover', label: 'Cover Letter', disabled: true },
  ],
};

describe('computeNodeCheckState', () => {
  it('returns checked/unchecked for a leaf based on membership', () => {
    const leaf: DynamoTreeNode = { id: 'resume', label: 'Resume' };
    expect(computeNodeCheckState(leaf, new Set(['resume']))).toBe('checked');
    expect(computeNodeCheckState(leaf, new Set())).toBe('unchecked');
  });

  it('returns checked when every child is checked', () => {
    expect(computeNodeCheckState(TREE, new Set(['resume', 'cover']))).toBe(
      'checked',
    );
  });

  it('returns unchecked when no child is checked', () => {
    expect(computeNodeCheckState(TREE, new Set())).toBe('unchecked');
  });

  it('returns indeterminate when only some children are checked', () => {
    expect(computeNodeCheckState(TREE, new Set(['resume']))).toBe(
      'indeterminate',
    );
  });
});

describe('shouldCascadeCheck', () => {
  it('decides to check when no enabled leaf is checked yet', () => {
    expect(shouldCascadeCheck(TREE, new Set())).toBe(true);
  });

  it('decides to uncheck once every enabled leaf is checked, ignoring disabled ones', () => {
    // "cover" is disabled, so only "resume" needs to be checked for the
    // enabled subtree to read as fully checked.
    expect(shouldCascadeCheck(TREE, new Set(['resume']))).toBe(false);
  });

  it('decides to check for a node with no enabled descendants at all', () => {
    const allDisabled: DynamoTreeNode = {
      id: 'root',
      label: 'Root',
      children: [{ id: 'child', label: 'Child', disabled: true }],
    };
    expect(shouldCascadeCheck(allDisabled, new Set())).toBe(true);
  });
});

describe('collectCascadeIds', () => {
  it('collects the node and its enabled descendants, excluding disabled ones', () => {
    expect(collectCascadeIds(TREE).sort()).toEqual(['docs', 'resume']);
  });

  it('collects just the node itself for a leaf', () => {
    const leaf: DynamoTreeNode = { id: 'resume', label: 'Resume' };
    expect(collectCascadeIds(leaf)).toEqual(['resume']);
  });

  it('returns an empty array for a disabled node', () => {
    const disabled: DynamoTreeNode = {
      id: 'cover',
      label: 'Cover',
      disabled: true,
      children: [{ id: 'nested', label: 'Nested' }],
    };
    expect(collectCascadeIds(disabled)).toEqual([]);
  });
});
