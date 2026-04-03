import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../components/ui/button';

describe('Button', () => {
  it('renders the default button variant', () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant='outline' size='lg'>
        Continue
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toHaveClass('border');
    expect(button).toHaveClass('bg-background');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('px-6');
  });

  it('forwards click events', () => {
    let clicked = false;

    render(
      <Button onClick={() => { clicked = true; }}>
        Click me
      </Button>,
    );

    screen.getByRole('button', { name: 'Click me' }).click();

    expect(clicked).toBe(true);
  });
});
