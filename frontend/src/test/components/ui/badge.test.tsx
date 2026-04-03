import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../components/ui/badge';

describe('Badge', () => {
  it('renders the default badge variant', () => {
    render(<Badge>New</Badge>);

    const badge = screen.getByText('New');

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('applies outline variant classes', () => {
    render(<Badge variant='outline'>Draft</Badge>);

    const badge = screen.getByText('Draft');

    expect(badge).toHaveClass('text-foreground');
    expect(badge).not.toHaveClass('bg-primary');
  });
});
