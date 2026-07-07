import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Login } from './index';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogin.mockReset();
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

  it('successful login navigates to /dashboard (token managed via cookie)', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

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
      expect(mockLogin).toHaveBeenCalledWith('admin123', 'secret');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('failed login displays error message', async () => {
    mockLogin.mockRejectedValueOnce({
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

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
