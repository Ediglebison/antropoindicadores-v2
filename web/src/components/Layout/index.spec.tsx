import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardLayout } from './index';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

let mockUser: { role: string } | null = { role: 'USER' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

describe('DashboardLayout Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(undefined);
    mockUser = { role: 'USER' };
  });

  it('displays common links', () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Coleta em Campo')).toBeInTheDocument();
    expect(screen.getByText('Resultados')).toBeInTheDocument();

    expect(screen.queryByText('Questionários')).not.toBeInTheDocument();
    expect(screen.queryByText('Locais')).not.toBeInTheDocument();
    expect(screen.queryByText('Pesquisadores')).not.toBeInTheDocument();
  });

  it('displays admin links if user is ADMIN', () => {
    mockUser = { role: 'ADMIN' };

    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Questionários')).toBeInTheDocument();
    expect(screen.getByText('Locais')).toBeInTheDocument();
    expect(screen.getByText('Pesquisadores')).toBeInTheDocument();
  });

  it('calls logout and navigates to / on clicking Sair', async () => {
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('Sair');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
