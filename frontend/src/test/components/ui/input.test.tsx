import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../../../components/ui/input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder='Email address' />);

    const input = screen.getByPlaceholderText('Email address');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('forwards native props', () => {
    render(<Input type='email' aria-label='Email' defaultValue='test@example.com' />);

    const input = screen.getByLabelText('Email');

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveValue('test@example.com');
  });
});
