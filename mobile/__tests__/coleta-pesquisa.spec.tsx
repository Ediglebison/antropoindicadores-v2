import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ColetaPesquisa, { findUnansweredQuestions } from '../app/coleta-pesquisa';
import { api } from '../src/services/api';
import { Alert } from 'react-native';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../src/context/MenuContext', () => ({
  useMenu: () => ({ openMenu: jest.fn() }),
}));

jest.mock('../app/side-menu', () => {
  const { View } = require('react-native');
  return function DummySideMenu() {
    return <View testID="side-menu" />;
  };
});

// --- Fake WatermelonDB -----------------------------------------------
// Banco local controlável: cada tabela guarda as linhas que o componente lê
// (query().fetch()) e cria (create()). Linhas imitam o modelo Response —
// accessors (surveyId/isDraft/dataPayload) + _raw com as colunas cruas.
let mockDbTables: Record<string, any[]> = { locations: [], surveys: [], responses: [] };

function mockBuildModelRow(overrides: {
  survey_id: string;
  location_id: string;
  is_draft?: boolean;
  data_payload?: string;
  created_at?: number;
}): any {
  const _raw: any = {
    survey_id: overrides.survey_id,
    location_id: overrides.location_id,
    is_draft: overrides.is_draft ?? false,
    data_payload: overrides.data_payload ?? '{}',
    created_at: overrides.created_at ?? Date.now(),
  };
  const row: any = {
    id: `${overrides.survey_id}-${overrides.location_id}`,
    _raw,
    surveyId: _raw.survey_id,
    locationId: _raw.location_id,
    isDraft: _raw.is_draft,
    dataPayload: _raw.data_payload,
    update: jest.fn(async (updater: any) => {
      updater(row);
      row._raw.survey_id = row.surveyId;
      row._raw.location_id = row.locationId;
      row._raw.is_draft = row.isDraft;
      row._raw.data_payload = row.dataPayload;
    }),
  };
  return row;
}

jest.mock('../src/database', () => {
  const db = {
    write: jest.fn(async (callback: any) => callback()),
    collections: {
      get: jest.fn((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(async () => mockDbTables[tableName] || []),
        })),
        create: jest.fn(async (rowSetter: any) => {
          const row = mockBuildModelRow({ survey_id: '', location_id: '' });
          rowSetter(row);
          row._raw.survey_id = row.surveyId;
          row._raw.location_id = row.locationId;
          row._raw.is_draft = row.isDraft;
          row._raw.data_payload = row.dataPayload;
          mockDbTables.responses.push(row);
          return row;
        }),
      })),
    },
  };
  return { database: db };
});

// --- Fixtures ---------------------------------------------------------
function seedSurveyWithSchema(schema: any[]) {
  mockDbTables.surveys.push({
    id: 'sur1',
    title: 'Survey Teste',
    description: '',
    _raw: {
      questions_schema: JSON.stringify(schema),
      is_active: 1,
    },
  });
}

function seedDraftForPair(payload: string) {
  mockDbTables.responses.push(
    mockBuildModelRow({
      survey_id: 'sur1',
      location_id: 'loc1',
      is_draft: true,
      data_payload: payload,
    })
  );
}

jest.spyOn(Alert, 'alert');

describe('ColetaPesquisa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbTables = { locations: [], surveys: [], responses: [] };
    mockDbTables.locations.push({
      id: 'loc1',
      name: 'Local Teste',
      _raw: { unique_code: 'L1', city: '', state: '', description: '' },
    });
    (api.post as jest.Mock).mockResolvedValue({});
  });

  async function pickPairAndStart(screen: any) {
    const schema = JSON.parse(mockDbTables.surveys[0]._raw.questions_schema);
    const questionText = `Survey Teste (${schema.length} perguntas)`;

    fireEvent.press(screen.getByText('Selecione um local...'));
    await waitFor(() => expect(screen.getByText('Local Teste (L1)')).toBeTruthy());
    fireEvent.press(screen.getByText('Local Teste (L1)'));

    fireEvent.press(screen.getByText('Selecione um questionário...'));
    await waitFor(() => expect(screen.getByText(questionText)).toBeTruthy());
    fireEvent.press(screen.getByText(questionText));

    fireEvent.press(screen.getByText('Começar Coleta →'));
    await waitFor(() => expect(screen.getByText(/1\. /)).toBeTruthy());
  }

  it('renders correctly and loads data from the local database', async () => {
    seedSurveyWithSchema([]);

    const { getByText } = render(<ColetaPesquisa />);

    await waitFor(() => {
      expect(getByText('📍 Local da Entrevista *')).toBeTruthy();
    });
  });

  it('shows an empty-state message when there are no local drafts', async () => {
    seedSurveyWithSchema([]);

    const { getByText } = render(<ColetaPesquisa />);

    await waitFor(() => {
      expect(getByText('Nenhum rascunho salvo ainda.')).toBeTruthy();
    });
  });

  it('shows error if starting without questions', async () => {
    seedSurveyWithSchema([]);

    const { getByText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    fireEvent.press(getByText('Selecione um local...'));
    await waitFor(() => expect(getByText('Local Teste (L1)')).toBeTruthy());
    fireEvent.press(getByText('Local Teste (L1)'));

    fireEvent.press(getByText('Selecione um questionário...'));
    await waitFor(() => expect(getByText('Survey Teste (0 perguntas)')).toBeTruthy());
    fireEvent.press(getByText('Survey Teste (0 perguntas)'));

    fireEvent.press(getByText('Começar Coleta →'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Este questionário não tem perguntas configuradas');
    });
  });

  it('AC6: finalizes a brand-new complete collection (creates a final row and POSTs)', async () => {
    seedSurveyWithSchema([{ id: 'q1', type: 'text', label: 'Nome' }]);

    const { getByText, getByPlaceholderText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    await pickPairAndStart({ getByText });

    fireEvent.changeText(getByPlaceholderText('Digite sua resposta...'), 'João');
    fireEvent.press(getByText('✓ Enviar Questionário'));

    await waitFor(() => {
      expect(mockDbTables.responses).toHaveLength(1);
      expect(mockDbTables.responses[0].isDraft).toBe(false);
      expect(api.post).toHaveBeenCalledWith('/responses', {
        survey_id: 'sur1',
        location_id: 'loc1',
        answers_json: { q1: 'João' },
        latitude: -23.5505,
        longitude: -46.6333,
      });
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', 'Questionário salvo com sucesso');
    });
  });

  it('AC1: salvar rascunho persiste is_draft=true e volta ao passo 1', async () => {
    seedSurveyWithSchema([{ id: 'q1', type: 'text', label: 'Nome' }]);

    const { getByText, getByPlaceholderText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    await pickPairAndStart({ getByText });

    fireEvent.changeText(getByPlaceholderText('Digite sua resposta...'), 'Ana');
    fireEvent.press(getByText('💾 Salvar rascunho'));

    await waitFor(() => {
      expect(mockDbTables.responses).toHaveLength(1);
      expect(mockDbTables.responses[0].isDraft).toBe(true);
      expect(mockDbTables.responses[0].dataPayload).toBe(JSON.stringify({ q1: 'Ana' }));
      expect(api.post).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Rascunho salvo!', expect.any(String));
    });

    // De volta ao passo 1, o rascunho aparece na lista
    await waitFor(() => expect(getByText('Começar Coleta →')).toBeTruthy());
    expect(getByText('Survey Teste')).toBeTruthy();
  });

  it('AC2: submit com faltante NÃO envia e o Alert lista exatamente as faltantes', async () => {
    seedSurveyWithSchema([
      { id: 'q1', type: 'text', label: 'Nome' },
      { id: 'q2', type: 'text', label: 'Idade' },
    ]);

    const { getByText, getAllByPlaceholderText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    await pickPairAndStart({ getByText });

    // Responde apenas q1 (Nome); q2 fica sem resposta
    fireEvent.changeText(getAllByPlaceholderText('Digite sua resposta...')[0], 'João');
    fireEvent.press(getByText('✓ Enviar Questionário'));

    expect(api.post).not.toHaveBeenCalled();
    expect(mockDbTables.responses).toHaveLength(0);

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    expect(alertCall[0]).toBe('Perguntas sem resposta');
    expect(alertCall[1]).toContain('Idade');
    expect(alertCall[1]).not.toContain('Nome');
  });

  it('AC3: "Fechar mesmo assim" grava rascunho e NÃO envia', async () => {
    seedSurveyWithSchema([
      { id: 'q1', type: 'text', label: 'Nome' },
      { id: 'q2', type: 'text', label: 'Idade' },
    ]);

    const { getByText, getAllByPlaceholderText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    await pickPairAndStart({ getByText });

    fireEvent.changeText(getAllByPlaceholderText('Digite sua resposta...')[0], 'João');
    fireEvent.press(getByText('✓ Enviar Questionário'));

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const fecharMesmoAssim = buttons.find((button: any) => button.text === 'Fechar mesmo assim');
    fecharMesmoAssim.onPress();

    await waitFor(() => {
      expect(mockDbTables.responses).toHaveLength(1);
      expect(mockDbTables.responses[0].isDraft).toBe(true);
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  it('AC4: lista rascunhos locais e retoma ao tocar', async () => {
    seedSurveyWithSchema([{ id: 'q1', type: 'text', label: 'Nome' }]);
    seedDraftForPair(JSON.stringify({ q1: 'preenchido' }));

    const { getByText, getByDisplayValue } = render(<ColetaPesquisa />);

    await waitFor(() => expect(getByText('Survey Teste')).toBeTruthy());

    fireEvent.press(getByText('Survey Teste'));

    await waitFor(() => {
      expect(getByText(/1\. Nome/)).toBeTruthy();
      expect(getByDisplayValue('preenchido')).toBeTruthy();
    });
  });

  it('AC4: iniciar no mesmo par repopula o rascunho existente', async () => {
    seedSurveyWithSchema([{ id: 'q1', type: 'text', label: 'Nome' }]);
    seedDraftForPair(JSON.stringify({ q1: 'preenchido' }));

    const { getByText, getByDisplayValue } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('📍 Local da Entrevista *')).toBeTruthy());

    await pickPairAndStart({ getByText });

    await waitFor(() => {
      expect(getByText(/1\. Nome/)).toBeTruthy();
      expect(getByDisplayValue('preenchido')).toBeTruthy();
    });
  });

  it('AC5: finalizar alterna na MESMA linha is_draft=false e POSTa', async () => {
    seedSurveyWithSchema([{ id: 'q1', type: 'text', label: 'Nome' }]);
    seedDraftForPair(JSON.stringify({ q1: 'preenchido' }));

    const { getByText } = render(<ColetaPesquisa />);
    await waitFor(() => expect(getByText('Survey Teste')).toBeTruthy());

    fireEvent.press(getByText('Survey Teste'));
    await waitFor(() => expect(getByText(/1\. Nome/)).toBeTruthy());

    fireEvent.press(getByText('✓ Enviar Questionário'));

    await waitFor(() => {
      expect(mockDbTables.responses).toHaveLength(1);
      expect(mockDbTables.responses[0].isDraft).toBe(false);
      expect(api.post).toHaveBeenCalledWith('/responses', expect.objectContaining({
        answers_json: { q1: 'preenchido' },
      }));
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', 'Questionário salvo com sucesso');
    });
  });
});

describe('findUnansweredQuestions', () => {
  const survey: any = {
    id: 'sur1',
    title: 'Teste',
    questions_schema: [
      { id: 'q1', type: 'text', label: 'Nome' },
      { id: 'q2', type: 'number', label: 'Idade' },
      { id: 'q3', type: 'boolean', label: 'Concorda' },
    ],
  };

  it('Good: lista vazia quando todas respondidas', () => {
    expect(findUnansweredQuestions(survey, { q1: 'Ana', q2: 42, q3: true })).toEqual([]);
  });

  it('Bad: lista os títulos exatos das faltantes', () => {
    expect(findUnansweredQuestions(survey, { q1: 'Ana' })).toEqual(['Idade', 'Concorda']);
  });

  it('Ugly: 0 numérico conta respondida; false, vazio, null e ausente não', () => {
    expect(findUnansweredQuestions(survey, { q1: '', q2: 0, q3: false })).toEqual(['Nome', 'Concorda']);
    expect(findUnansweredQuestions(survey, { q1: 'Ana', q2: null })).toEqual(['Idade', 'Concorda']);
    expect(findUnansweredQuestions(survey, {})).toEqual(['Nome', 'Idade', 'Concorda']);
  });

  it('Ugly: survey sem perguntas nunca acusa faltantes', () => {
    expect(findUnansweredQuestions({ ...survey, questions_schema: [] }, {})).toEqual([]);
  });
});