import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthView from '../components/AuthView';

const mockAuth = {
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
};

describe('AuthView', () => {
  it('renders sign in form by default', () => {
    render(<AuthView onAuth={mockAuth} />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches to sign up mode', async () => {
    render(<AuthView onAuth={mockAuth} />);
    await userEvent.click(screen.getByText('Sign up'));
    expect(screen.getByText('Create account')).toBeInTheDocument();
  });

  it('shows Google sign in button', () => {
    render(<AuthView onAuth={mockAuth} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('has NeuroLens branding', () => {
    render(<AuthView onAuth={mockAuth} />);
    expect(screen.getByText('Neuro')).toBeInTheDocument();
    expect(screen.getByText('Lens')).toBeInTheDocument();
  });
});
