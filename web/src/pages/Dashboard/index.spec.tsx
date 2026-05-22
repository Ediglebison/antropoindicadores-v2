import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Dashboard } from './index';
import { api } from '../../services/api';

vi.mock('../../services/api');

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as Mock).mockReturnValue(new Promise(() => {}));
    render(<Dashboard />);
    expect(screen.getByText(/Carregando estatísticas.../i)).toBeInTheDocument();
  });

  it('renders dashboard data after loading', async () => {
    const mockResponses = [
      {
        id: '1',
        survey: { title: 'Survey A' },
        location: { name: 'Location X', unique_code: 'X1' },
        researcher: { name: 'John Doe' },
        collected_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        survey: { title: 'Survey B' },
        location: { name: 'Location Y', unique_code: 'Y1' },
        researcher: { name: 'Jane Doe' },
        collected_at: '2024-01-02T11:00:00Z',
      },
    ];

    const mockSurveys = [{ id: 's1' }, { id: 's2' }, { id: 's3' }];
    const mockLocations = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }, { id: 'l4' }];

    (api.get as Mock).mockImplementation((url) => {
      if (url === '/responses') return Promise.resolve({ data: mockResponses });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      return Promise.reject(new Error('not found'));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando estatísticas.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Dashboard Principal')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // totalResponses
    expect(screen.getByText('4')).toBeInTheDocument(); // totalLocations
    expect(screen.getByText('3')).toBeInTheDocument(); // totalSurveys

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Survey A/i)).toBeInTheDocument();
  });

  it('handles error while fetching data', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (api.get as Mock).mockRejectedValue(new Error('Network error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando estatísticas.../i)).not.toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Erro ao carregar dados do dashboard", expect.any(Error));
    consoleSpy.mockRestore();
  });
});
