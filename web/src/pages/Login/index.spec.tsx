import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from './index';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../../services/api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('Login Page', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('allows inputs to be typed into', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const codeInput = screen.getByPlaceholderText('Digite seu código');
    const passwordInput = screen.getByPlaceholderText('Sua senha secreta');

    fireEvent.change(codeInput, { target: { value: 'admin123' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    expect(codeInput).toHaveValue('admin123');
    expect(passwordInput).toHaveValue('secret');
  });

  it('successful login sets localStorage and navigates to /dashboard', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: {
        access_token: 'fake-token',
        user: { id: 1, name: 'Admin User', role: 'ADMIN' },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const codeInput = screen.getByPlaceholderText('Digite seu código');
    const passwordInput = screen.getByPlaceholderText('Sua senha secreta');
    const submitBtn = screen.getByRole('button', { name: /entrar na plataforma/i });

    fireEvent.change(codeInput, { target: { value: 'admin123' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        access_code: 'admin123',
        password: 'secret',
      });
    });

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify({ id: 1, name: 'Admin User', role: 'ADMIN' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('failed login displays error message', async () => {
    (api.post as any).mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const codeInput = screen.getByPlaceholderText('Digite seu código');
    const passwordInput = screen.getByPlaceholderText('Sua senha secreta');
    const submitBtn = screen.getByRole('button', { name: /entrar na plataforma/i });

    fireEvent.change(codeInput, { target: { value: 'wrong-code' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Acesso negado. Verifique suas credenciais.')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
