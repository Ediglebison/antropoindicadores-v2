import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { SurveyBuilder } from './SurveyBuilder';
import { api } from '../../services/api';

vi.mock('../../services/api');

describe('SurveyBuilder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    window.confirm = vi.fn();
    window.scrollTo = vi.fn();
  });

  const mockSurveys = [
    {
      id: 's1',
      title: 'Survey 1',
      description: 'Desc 1',
      is_active: true,
      created_at: '2024-01-01T10:00:00Z',
      questions_schema: [{ id: 'q1', type: 'text', label: 'Question 1' }]
    },
    {
      id: 's2',
      title: 'Survey 2',
      description: 'Desc 2',
      is_active: false,
      created_at: '2024-01-02T10:00:00Z',
      questions_schema: []
    }
  ];

  it('renders correctly and loads surveys', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockSurveys });

    render(<SurveyBuilder />);

    expect(screen.getByText('Novo Questionário')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Survey 1')).toBeInTheDocument();
      expect(screen.getByText('Survey 2')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/surveys');
  });

  it('can create a new survey', async () => {
    (api.get as Mock).mockResolvedValue({ data: [] });
    (api.post as Mock).mockResolvedValue({ data: { success: true } });

    render(<SurveyBuilder />);

    const titleInput = screen.getByPlaceholderText(/Ex: Pesquisa de Campo/i);
    fireEvent.change(titleInput, { target: { value: 'New Survey' } });

    const descInput = screen.getByPlaceholderText(/Instruções para o pesquisador/i);
    fireEvent.change(descInput, { target: { value: 'Some description' } });

    const labelInput = screen.getByPlaceholderText(/Ex: Qual a renda familiar\?/i);
    fireEvent.change(labelInput, { target: { value: 'Question label' } });

    const saveBtn = screen.getByRole('button', { name: /Salvar Questionário/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/surveys', {
        title: 'New Survey',
        description: 'Some description',
        is_active: true,
        questions_schema: expect.arrayContaining([
          expect.objectContaining({ label: 'Question label', type: 'text' })
        ])
      });
      expect(window.alert).toHaveBeenCalledWith('Questionário criado com sucesso!');
    });
  });

  it('can edit an existing survey', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockSurveys });
    (api.patch as Mock).mockResolvedValue({ data: { success: true } });

    render(<SurveyBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Survey 1')).toBeInTheDocument();
    });

    const surveyCard = screen.getByText('Survey 1');
    fireEvent.click(surveyCard);

    expect(screen.getByText('Editando Questionário')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Survey 1')).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue('Survey 1');
    fireEvent.change(titleInput, { target: { value: 'Survey 1 Updated' } });

    const updateBtn = screen.getByRole('button', { name: /Atualizar Questionário/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/surveys/s1', expect.objectContaining({
        title: 'Survey 1 Updated'
      }));
      expect(window.alert).toHaveBeenCalledWith('Questionário atualizado com sucesso!');
    });
  });

  it('can add and remove questions', async () => {
    (api.get as Mock).mockResolvedValue({ data: [] });

    render(<SurveyBuilder />);

    // Add a question
    const addBtn = screen.getByRole('button', { name: /Adicionar Nova Pergunta/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Pergunta #1')).toBeInTheDocument();
    expect(screen.getByText('Pergunta #2')).toBeInTheDocument();

    // Remove first question
    const removeBtns = screen.getAllByRole('button');
    // First remove button is for the first question
    const removeBtn = removeBtns.find(btn => btn.querySelector('.lucide-trash2'))!;
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Pergunta #2')).not.toBeInTheDocument();
  });

  it('can toggle survey status', async () => {
    (api.get as Mock).mockResolvedValue({ data: mockSurveys });
    (api.patch as Mock).mockResolvedValue({ data: { success: true } });
    (window.confirm as Mock).mockReturnValue(true);

    render(<SurveyBuilder />);

    await waitFor(() => {
      expect(screen.getByText('Survey 1')).toBeInTheDocument();
    });

    // Toggle status buttons have title props or icons
    const toggleBtns = screen.getAllByTitle('Desativar questionário');
    
    // Toggle active to inactive
    fireEvent.click(toggleBtns[0]);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('desativar o questionário "Survey 1"'));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/surveys/s1/toggle');
      // fetches surveys again
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});
