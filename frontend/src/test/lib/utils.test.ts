import { describe, expect, it } from 'vitest';
import { cn } from '../../lib/utils';

describe('cn utility', () => {
  it('merges basic class names', () => {
    expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm');
  });

  it('resolves tailwind conflicts with latest value', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional and falsy values', () => {
    expect(cn('flex', false && 'hidden', undefined, 'items-center')).toBe('flex items-center');
  });
});
