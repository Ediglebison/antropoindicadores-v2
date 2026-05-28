import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { Collection } from './index';
import { api } from '../../services/api';

vi.mock('../../services/api');

describe('Collection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn();
    window.scrollTo = vi.fn();
  });

  const mockLocations = [
    { id: 'loc1', name: 'Location One', unique_code: 'L1' },
    { id: 'loc2', name: 'Location Two', unique_code: 'L2' }
  ];

  const mockSurveys = [
    { 
      id: 'sur1', 
      title: 'Survey One', 
      is_active: true,
      questions_schema: [
        { id: 'q1', type: 'text', label: 'What is your name?' },
        { id: 'q2', type: 'boolean', label: 'Do you like React?' },
        { id: 'q3', type: 'select', label: 'Color?', options: 'Red,Blue' },
        { id: 'q4', type: 'scale', label: 'Rate 1 to 5' }
      ]
    },
    { id: 'sur2', title: 'Survey Two', is_active: false, questions_schema: [] }
  ];

  it('renders initial form and loads locations and active surveys', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.reject(new Error('not found'));
    });

    render(<Collection />);

    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
      expect(screen.getByText(/Survey One/i)).toBeInTheDocument();
    });

    // Inactive survey should not be present
    expect(screen.queryByText(/Survey Two/i)).not.toBeInTheDocument();
  });

  it('alerts if location or survey is not selected on start', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Entrevista/i }));

    expect(window.alert).toHaveBeenCalledWith("Selecione um local e um questionário para começar.");
  });

  it('navigates to step 2 and submits the form successfully', async () => {
    const user = userEvent.setup();
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.resolve({ data: [] });
    });
    (api.post as Mock).mockResolvedValue({ data: { success: true } });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    // Select location and survey
    const locSelect = screen.getByRole('combobox', { name: /Local da Entrevista/i });
    const surSelect = screen.getByRole('combobox', { name: /Questionário a ser aplicado/i });

    await user.selectOptions(locSelect, 'loc1');
    await user.selectOptions(surSelect, 'sur1');

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Entrevista/i }));

    // Step 2 should be visible
    expect(screen.getByText('Survey One')).toBeInTheDocument();
    expect(screen.getByText('1. What is your name?')).toBeInTheDocument();

    // Fill answers
    const textInput = screen.getByRole('textbox');
    fireEvent.change(textInput, { target: { value: 'John Doe' } });

    const yesRadio = screen.getByLabelText('Sim');
    fireEvent.click(yesRadio);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Red' } });

    // Submit form
    (window.confirm as Mock).mockReturnValue(true);

    const submitBtn = screen.getByRole('button', { name: /Finalizar Entrevista/i });
    fireEvent.submit(submitBtn);

    expect(window.confirm).toHaveBeenCalledWith("Finalizar e enviar questionário?");

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/responses', {
        location_id: 'loc1',
        survey_id: 'sur1',
        answers_json: expect.objectContaining({
          q1: 'John Doe',
          q2: true,
          q3: 'Red'
        })
      });
      expect(window.alert).toHaveBeenCalledWith("Questionário salvo com sucesso!");
    });
    
    // Goes back to step 1
    expect(screen.getByRole('button', { name: /Iniciar Entrevista/i })).toBeInTheDocument();
  });
});
