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
        { id: 'q4', type: 'scale', label: 'Rate 1 to 5' },
        { id: 'q5', type: 'number', label: 'How many people?' }
      ]
    },
    { id: 'sur2', title: 'Survey Two', is_active: false, questions_schema: [] }
  ];

  const mockDraft = {
    id: 'dr1',
    survey_id: 'sur1',
    location_id: 'loc1',
    data_payload: { q1: 'John Doe', q2: true },
    created_at: '2026-08-10T10:00:00.000Z',
    survey: { id: 'sur1', title: 'Survey One' },
    location: { id: 'loc1', name: 'Location One', unique_code: 'L1' }
  };

  // Seleciona local + questionário e avança para o passo 2 preenchendo todas
  // as perguntas do Survey One (usado nos fluxos de submissão completa).
  async function fillAndGoToSurvey(user: any) {
    const locSelect = screen.getByRole('combobox', { name: /Local da Entrevista/i });
    const surSelect = screen.getByRole('combobox', { name: /Questionário a ser aplicado/i });

    await user.selectOptions(locSelect, 'loc1');
    await user.selectOptions(surSelect, 'sur1');

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Entrevista/i }));
  }

  function answerAllQuestions() {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByLabelText('Sim'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Red' } });
    fireEvent.click(screen.getByLabelText('3'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
  }

  it('renders initial form and loads locations, active surveys and an empty draft list', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });

    render(<Collection />);

    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
      expect(screen.getByText(/Survey One/i)).toBeInTheDocument();
    });

    // Inactive survey should not be present
    expect(screen.queryByText(/Survey Two/i)).not.toBeInTheDocument();

    // Empty draft list is shown without crashing
    expect(screen.getByText(/Rascunhos salvos/i)).toBeInTheDocument();
    expect(screen.getByText(/Nenhum rascunho salvo ainda/i)).toBeInTheDocument();
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

  it('navigates to step 2 and submits a complete new collection via POST /responses', async () => {
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

    await fillAndGoToSurvey(user);
    expect(screen.getByText('Survey One')).toBeInTheDocument();
    expect(screen.getByText('1. What is your name?')).toBeInTheDocument();

    answerAllQuestions();

    fireEvent.submit(screen.getByRole('button', { name: /Finalizar Entrevista/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/responses', {
        location_id: 'loc1',
        survey_id: 'sur1',
        answers_json: {
          q1: 'John Doe',
          q2: true,
          q3: 'Red',
          q4: 3,
          q5: 2
        }
      });
      expect(window.alert).toHaveBeenCalledWith("Questionário salvo com sucesso!");
    });

    expect(api.post).not.toHaveBeenCalledWith(expect.stringContaining('/finalize'));

    // Goes back to step 1
    expect(screen.getByRole('button', { name: /Iniciar Entrevista/i })).toBeInTheDocument();
  });

  it('renders saved drafts with survey title, location and date', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.resolve({ data: [mockDraft] });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    // O botão de retomada expõe título + local + código + data formatada
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Survey One Location One \[L1\].*\d{2}\/\d{2}\/\d{4}/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Excluir rascunho de Survey One/i })).toBeInTheDocument();
  });

  it('resumes a draft repopulating answers and going to step 2', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.resolve({ data: [mockDraft] });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    const resumeButton = await screen.findByRole('button', { name: /Survey One Location One \[L1\]/i });
    fireEvent.click(resumeButton);

    // Passo 2 com as respostas do rascunho repopuladas
    expect(screen.getByText('1. What is your name?')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('John Doe');
  });

  it('saves a new draft via POST /drafts and reloads the list', async () => {
    const user = userEvent.setup();
    let draftsCalls = 0;
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') {
        draftsCalls += 1;
        return Promise.resolve({ data: draftsCalls >= 2 ? [mockDraft] : [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    await fillAndGoToSurvey(user);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/drafts', {
        survey_id: 'sur1',
        location_id: 'loc1',
        data_payload: { q1: 'John Doe' }
      });
      expect(window.alert).toHaveBeenCalledWith("Rascunho salvo! Ele aparecerá na lista para retomar depois.");
    });

    // Voltou ao passo 1 e recarregou a lista (rascunho agora aparece)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Survey One Location One \[L1\]/i })).toBeInTheDocument();
    });
    expect((api.get as Mock).mock.calls.filter(([url]) => url === '/drafts')).toHaveLength(2);
  });

  it('updates an existing draft via PATCH when resumed and saved', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.resolve({ data: [mockDraft] });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    const resumeButton = await screen.findByRole('button', { name: /Survey One Location One \[L1\]/i });
    fireEvent.click(resumeButton);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Red' } });

    fireEvent.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/drafts/dr1', {
        location_id: 'loc1',
        data_payload: { q1: 'John Doe', q2: true, q3: 'Red' }
      });
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('finalizes a resumed draft persisting the latest answers first (PATCH then finalize) and removes it from the list', async () => {
    let draftsCalls = 0;
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') {
        draftsCalls += 1;
        return Promise.resolve({ data: draftsCalls >= 2 ? [] : [mockDraft] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    const resumeButton = await screen.findByRole('button', { name: /Survey One Location One \[L1\]/i });
    fireEvent.click(resumeButton);

    // Completa as perguntas que o rascunho ainda não tinha respondido
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Red' } });
    fireEvent.click(screen.getByLabelText('3'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });

    fireEvent.submit(screen.getByRole('button', { name: /Finalizar Entrevista/i }));

    await waitFor(() => {
      // PATCH primeiro: persiste as respostas atuais (incluindo as novas) no rascunho
      expect(api.patch).toHaveBeenCalledWith('/drafts/dr1', {
        location_id: 'loc1',
        data_payload: { q1: 'John Doe', q2: true, q3: 'Red', q4: 3, q5: 2 }
      });
      // POST depois: o finalize consome o rascunho já com as respostas novas
      expect(api.post).toHaveBeenCalledWith('/drafts/dr1/finalize');
      expect(window.alert).toHaveBeenCalledWith("Questionário salvo com sucesso!");
    });

    // A ordem importa: PATCH antes do POST /finalize
    const saveCallOrder = (api.patch as Mock).mock.invocationCallOrder[0];
    const finalizeCallOrder = (api.post as Mock).mock.invocationCallOrder[0];
    expect(saveCallOrder).toBeLessThan(finalizeCallOrder);

    // Nada é enviado como resposta nova e o rascunho some da lista recarregada
    expect(api.post).not.toHaveBeenCalledWith('/responses', expect.anything());

    await waitFor(() => {
      expect(screen.getByText(/Nenhum rascunho salvo ainda/i)).toBeInTheDocument();
    });
  });

  it('does not run finalize and alerts when persisting the latest answers fails', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.resolve({ data: [mockDraft] });
      return Promise.resolve({ data: [] });
    });
    (api.patch as Mock).mockRejectedValue(new Error('save failed'));

    render(<Collection />);

    const resumeButton = await screen.findByRole('button', { name: /Survey One Location One \[L1\]/i });
    fireEvent.click(resumeButton);

    // Completa as perguntas que o rascunho ainda não tinha respondido
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Red' } });
    fireEvent.click(screen.getByLabelText('3'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });

    fireEvent.submit(screen.getByRole('button', { name: /Finalizar Entrevista/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/drafts/dr1', {
        location_id: 'loc1',
        data_payload: { q1: 'John Doe', q2: true, q3: 'Red', q4: 3, q5: 2 }
      });
    });

    // PATCH falhou: o finalize NÃO roda e nada é confirmado como salvo
    expect(api.post).not.toHaveBeenCalledWith('/drafts/dr1/finalize');
    expect(window.alert).not.toHaveBeenCalledWith("Questionário salvo com sucesso!");
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Erro ao salvar respostas.");
    });

    // O rascunho permanece intacto: nada foi excluído e o fluxo não avançou
    // (continua no passo 2 — o finalize que removeria o rascunho não rodou)
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Finalizar Entrevista/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Iniciar Entrevista/i })).not.toBeInTheDocument();
  });

  it('warns with the exact unanswered titles and "Fechar mesmo assim" saves a draft without sending', async () => {
    const user = userEvent.setup();
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    await fillAndGoToSurvey(user);
    // Responde apenas duas das cinco perguntas
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });
    fireEvent.click(screen.getByLabelText('Sim'));

    fireEvent.submit(screen.getByRole('button', { name: /Finalizar Entrevista/i }));

    // Modo de aviso lista exatamente os títulos sem resposta e nada é enviado
    await waitFor(() => {
      expect(screen.getByText('Color?')).toBeInTheDocument();
      expect(screen.getByText('Rate 1 to 5')).toBeInTheDocument();
      expect(screen.getByText('How many people?')).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Fechar mesmo assim/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/drafts', {
        survey_id: 'sur1',
        location_id: 'loc1',
        data_payload: { q1: 'John Doe', q2: true }
      });
    });
    expect(api.post).not.toHaveBeenCalledWith('/responses', expect.anything());
  });

  it('deletes a draft via DELETE and removes it from the list', async () => {
    let draftsCalls = 0;
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') {
        draftsCalls += 1;
        return Promise.resolve({ data: draftsCalls >= 2 ? [] : [mockDraft] });
      }
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    const deleteButton = await screen.findByRole('button', { name: /Excluir rascunho de Survey One/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/drafts/dr1');
    });

    await waitFor(() => {
      expect(screen.getByText(/Nenhum rascunho salvo ainda/i)).toBeInTheDocument();
    });
  });

  it('renders the draft list empty and without crash when GET /drafts fails', async () => {
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      if (url === '/drafts') return Promise.reject(new Error('network down'));
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);

    await waitFor(() => {
      expect(screen.getByText(/Rascunhos salvos/i)).toBeInTheDocument();
      expect(screen.getByText(/Nenhum rascunho salvo ainda/i)).toBeInTheDocument();
    });
  });

  it('keeps the numeric answer 0 as answered and preserves it in the submitted payload', async () => {
    const user = userEvent.setup();
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    await fillAndGoToSurvey(user);
    answerAllQuestions();
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '0' } });

    expect(screen.getByRole('spinbutton')).toHaveValue(0);

    fireEvent.submit(screen.getByRole('button', { name: /Finalizar Entrevista/i }));

    // 0 conta como respondida (sem aviso) e não é descartado no payload
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/responses', {
        location_id: 'loc1',
        survey_id: 'sur1',
        answers_json: {
          q1: 'John Doe',
          q2: true,
          q3: 'Red',
          q4: 3,
          q5: 0
        }
      });
    });
  });

  it('saves a partial draft without the native required attribute blocking it', async () => {
    const user = userEvent.setup();
    (api.get as Mock).mockImplementation((url) => {
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.resolve({ data: [] });
    });

    render(<Collection />);
    await waitFor(() => {
      expect(screen.getByText(/Location One/i)).toBeInTheDocument();
    });

    await fillAndGoToSurvey(user);

    // O formulário roda com noValidate: required nunca bloqueia salvar parcial
    expect(document.querySelector('form')).toHaveAttribute('novalidate');

    // Salva um rascunho sem NENHUMA pergunta respondida (todas required)
    fireEvent.click(screen.getByRole('button', { name: /Salvar rascunho/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/drafts', {
        survey_id: 'sur1',
        location_id: 'loc1',
        data_payload: {}
      });
    });
  });
});