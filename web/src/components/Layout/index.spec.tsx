import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardLayout } from './index';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardLayout Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('displays common links', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'USER' }));
    
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
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    
    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Questionários')).toBeInTheDocument();
    expect(screen.getByText('Locais')).toBeInTheDocument();
    expect(screen.getByText('Pesquisadores')).toBeInTheDocument();
  });

  it('calls localStorage.clear() and navigates to / on clicking Sair', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'USER' }));
    localStorage.setItem('token', 'some-token');

    render(
      <MemoryRouter>
        <DashboardLayout />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('Sair');
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
