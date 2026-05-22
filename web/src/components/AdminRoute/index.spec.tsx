import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminRoute } from './index';
import * as router from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    Navigate: vi.fn(({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={replace ? "true" : "false"} />),
  };
});

describe('AdminRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to / if there is no user in localStorage', () => {
    render(
      <AdminRoute>
        <div data-testid="child-content">Admin Content</div>
      </AdminRoute>
    );

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/');
  });

  it('alerts and redirects to /dashboard if user is not ADMIN', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'USER' }));
    
    render(
      <AdminRoute>
        <div data-testid="child-content">Admin Content</div>
      </AdminRoute>
    );

    expect(window.alert).toHaveBeenCalledWith("Acesso negado: Apenas administradores podem acessar esta página.");
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/dashboard');
    expect(navigate).toHaveAttribute('data-replace', 'true');
  });

  it('renders children if user role is ADMIN', () => {
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));

    render(
      <AdminRoute>
        <div data-testid="child-content">Admin Content</div>
      </AdminRoute>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});
