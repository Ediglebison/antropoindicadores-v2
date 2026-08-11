import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ResultsScreen, {
  parsePayload,
  buildColumnarExportResults,
  loadCompletasLocais,
} from '../app/results-screen';
import { responsesAPI } from '../src/services/api';
import { Q } from '@nozbe/watermelondb';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-doc/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/api', () => ({
  responsesAPI: { getAll: jest.fn().mockResolvedValue([]) },
  api: { get: jest.fn().mockResolvedValue({ data: [] }) },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

// --- Fake WatermelonDB com avaliação de cláusulas -------------------------
// Diferente do harness da coleta, aqui o query() AVALIA as cláusulas recebidas
// (reais, do Q do aguaÇúdica) contra as linhas cruas, espelhando a semântica
// SQL do encoder (`is 0` exclui NULL; `is null` inclui NULL/ausente). Isso
// permite testar o aviso obrigatório: linha legada (is_draft NULL/ausente)
// DEVE entrar na exportação.
let mockDbTables: Record<string, any[]> = { locations: [], surveys: [], responses: [] };
let capturedResponseClauses: any[] = [];

function mockEvaluateClause(row: any, clause: any): boolean {
  if (clause.type === 'or') {
    return clause.conditions.some((condition: any) => mockEvaluateClause(row, condition));
  }
  if (clause.type === 'and') {
    return clause.conditions.every((condition: any) => mockEvaluateClause(row, condition));
  }
  if (clause.type === 'where') {
    const raw = row._raw || row;
    const actual = raw[clause.left];
    const expected = clause.comparison.right.value;
    if (clause.comparison.operator === 'eq') {
      if (expected === null) return actual === null || actual === undefined;
      return actual === expected;
    }
  }
  return true;
}

function mockFetchRows(tableName: string, clauses: any[]) {
  const rows = mockDbTables[tableName] || [];
  if (!clauses || clauses.length === 0) return rows;
  return rows.filter((row) => clauses.every((clause) => mockEvaluateClause(row, clause)));
}

jest.mock('../src/database', () => {
  const db = {
    collections: {
      get: jest.fn((tableName: string) => ({
        query: jest.fn((...clauses: any[]) => {
          if (tableName === 'responses') {
            capturedResponseClauses = clauses;
          }
          return {
            fetch: jest.fn(async () => mockFetchRows(tableName, clauses)),
          };
        }),
      })),
    },
  };
  return { database: db };
});

function mockBuildResponseRow(overrides: {
  id: string;
  survey_id: string;
  location_id: string;
  is_draft?: boolean | null;
  data_payload?: string;
}): any {
  const _raw: any = {
    survey_id: overrides.survey_id,
    location_id: overrides.location_id,
    data_payload: overrides.data_payload ?? '{}',
    created_at: Date.now(),
  };
  if (overrides.is_draft !== undefined) {
    _raw.is_draft = overrides.is_draft;
  }
  return { id: overrides.id, _raw };
}

// --- Fixtures -------------------------------------------------------------
function seedSurveyWithSchema(id: string, title: string, schema: any[]) {
  mockDbTables.surveys.push({
    id,
    title,
    _raw: {
      questions_schema: JSON.stringify(schema),
      is_active: 1,
    },
  });
}

function seedLocation(id: string, name: string, uniqueCode: string) {
  mockDbTables.locations.push({
    id,
    name,
    _raw: { unique_code: uniqueCode },
  });
}

jest.spyOn(Alert, 'alert');

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (responsesAPI.getAll as jest.Mock).mockResolvedValue([]);
    mockDbTables = { locations: [], surveys: [], responses: [] };
    capturedResponseClauses = [];
    seedLocation('loc1', 'Comunidade Rio', 'L1');
    seedLocation('loc2', 'Comunidade Serra', 'L2');
    seedSurveyWithSchema('sur1', 'Questionário Base', [
      { id: 'q1', type: 'text', label: 'Nome' },
      { id: 'q2', type: 'boolean', label: 'Concorda' },
    ]);
  });

  it('AC1: sem seleção, o CSV avisa e NÃO exporta nada', async () => {
    const { getByText } = render(<ResultsScreen />);
    await waitFor(() => expect(getByText('Selecione um local...')).toBeTruthy());

    fireEvent.press(getByText('CSV'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Aviso',
        'Selecione um questionário e uma localidade para exportar.'
      );
    });
    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
  });

  it('AC2+AC3+AC4+AC5: exporta CSV colunar com cabeçalho, booleano Sim/Não, filtro de local e incluindo legado NULL, excluindo rascunho', async () => {
    mockDbTables.responses.push(
      mockBuildResponseRow({
        id: 'resp-final',
        survey_id: 'sur1',
        location_id: 'loc1',
        is_draft: false,
        data_payload: JSON.stringify({ q1: 'Ana', q2: true }),
      }),
      mockBuildResponseRow({
        id: 'resp-legado',
        survey_id: 'sur1',
        location_id: 'loc1',
        is_draft: null,
        data_payload: JSON.stringify({ q1: 'Carlos', q2: false }),
      }),
      mockBuildResponseRow({
        id: 'resp-rascunho',
        survey_id: 'sur1',
        location_id: 'loc1',
        is_draft: true,
        data_payload: JSON.stringify({ q1: 'Borgar', q2: true }),
      }),
      mockBuildResponseRow({
        id: 'resp-outra-local',
        survey_id: 'sur1',
        location_id: 'loc2',
        is_draft: false,
        data_payload: JSON.stringify({ q1: 'Dora', q2: true }),
      }),
    );

    const { getByText } = render(<ResultsScreen />);
    await waitFor(() => expect(getByText('Selecione um local...')).toBeTruthy());

    fireEvent.press(getByText('Selecione um local...'));
    await waitFor(() => expect(getByText('Comunidade Rio (L1)')).toBeTruthy());
    fireEvent.press(getByText('Comunidade Rio (L1)'));

    fireEvent.press(getByText('Selecione um questionário...'));
    await waitFor(() => expect(getByText('Questionário Base (2 perguntas)')).toBeTruthy());
    fireEvent.press(getByText('Questionário Base (2 perguntas)'));

    fireEvent.press(getByText('CSV'));

    const expectedCsv = [
      '\uFEFF"Nome";"Concorda"',
      '"Ana";"Sim"',
      '"Carlos";"Não"',
    ].join('\n');

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
    const fileUri = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0][0];
    const csv = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls[0][1];
    expect(fileUri).toBe('file:///mock-doc/resultados_coletas.csv');
    expect(csv).toBe(expectedCsv);
    expect(Sharing.shareAsync).toHaveBeenCalled();
  });

  it('AC4: seleção de uma localidade sem respostas não exporta', async () => {
    mockDbTables.responses.push(
      mockBuildResponseRow({
        id: 'resp-outra-local',
        survey_id: 'sur1',
        location_id: 'loc2',
        is_draft: false,
        data_payload: JSON.stringify({ q1: 'Dora', q2: true }),
      }),
    );

    const { getByText } = render(<ResultsScreen />);
    await waitFor(() => expect(getByText('Selecione um local...')).toBeTruthy());

    fireEvent.press(getByText('Selecione um local...'));
    await waitFor(() => expect(getByText('Comunidade Rio (L1)')).toBeTruthy());
    fireEvent.press(getByText('Comunidade Rio (L1)'));

    fireEvent.press(getByText('Selecione um questionário...'));
    await waitFor(() => expect(getByText('Questionário Base (2 perguntas)')).toBeTruthy());
    fireEvent.press(getByText('Questionário Base (2 perguntas)'));

    fireEvent.press(getByText('CSV'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Aviso', 'Não há dados para exportar.');
    });
    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
  });
});

describe('parsePayload', () => {
  it('Good: string JSON vira objeto', () => {
    expect(parsePayload('{"q1":"Ana"}')).toEqual({ q1: 'Ana' });
  });

  it('Good: objeto passa direto', () => {
    expect(parsePayload({ q1: 'Ana', q2: false })).toEqual({ q1: 'Ana', q2: false });
  });

  it('Bad: JSON inválido vira {}', () => {
    expect(parsePayload('nao-e-json')).toEqual({});
  });

  it('Ugly: null/undefined/vazio -> {}; JSON primitivo -> {}', () => {
    expect(parsePayload(null)).toEqual({});
    expect(parsePayload(undefined)).toEqual({});
    expect(parsePayload('')).toEqual({});
    expect(parsePayload('"apenas-string"')).toEqual({});
  });
});

describe('buildColumnarExportResults', () => {
  const surveySchema: any = {
    id: 'sur1',
    title: 'Teste',
    questions_schema: [
      { id: 'q1', type: 'text', label: 'Nome' },
      { id: 'q2', type: 'boolean', label: 'Concorda' },
      { id: 'q3', type: 'number', label: 'Idade' },
    ],
  };

  it('Good: cabeçalho = títulos (uma por coluna) e valores sob as colunas certas', () => {
    const responses = [{ id: 'r1', data_payload: { q1: 'Ana', q3: 0 } }];
    const csv = buildColumnarExportResults(responses, surveySchema);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).split('\n');
    expect(lines[0]).toBe('"Nome";"Concorda";"Idade"');
    expect(lines[1]).toBe('"Ana";"Não";"0"');
  });

  it('Good: booleano true -> Sim e false -> Não', () => {
    const responses = [
      { id: 'r1', data_payload: { q1: 'A', q2: true } },
      { id: 'r2', data_payload: { q1: 'B', q2: false } },
    ];
    const csv = buildColumnarExportResults(responses, surveySchema);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"A";"Sim";"Não respondido"');
    expect(lines[2]).toBe('"B";"Não";"Não respondido"');
  });

  it('Bad: resposta ausente vira "Não respondido"', () => {
    const responses = [{ id: 'r1', data_payload: {} }];
    const csv = buildColumnarExportResults(responses, surveySchema);
    expect(csv.split('\n')[1]).toBe('"Não respondido";"Não";"Não respondido"');
  });

  it('Ugly: valor com aspas é escapado e quebra de linha é achatada', () => {
    const responses = [{ id: 'r1', data_payload: { q1: 'diz "oi"\nlinha2', q3: undefined } }];
    const csv = buildColumnarExportResults(responses, surveySchema);
    expect(csv.split('\n')[1]).toBe('"diz ""oi"" linha2";"Não";"Não respondido"');
  });

  it('Ugly: schema vazio ou survey ausente -> string vazia (nada exporta)', () => {
    expect(buildColumnarExportResults([], { ...surveySchema, questions_schema: [] })).toBe('');
    expect(buildColumnarExportResults([], undefined)).toBe('');
  });

  it('Ugly: célula com prefixo de injeção de fórmula (=, +, -, @, tab) é neutralizada', () => {
    const responses = [
      { id: 'r1', data_payload: { q1: '=SUM(A1:A2)' } },
      { id: 'r2', data_payload: { q1: '+1' } },
      { id: 'r3', data_payload: { q1: '-2' } },
      { id: 'r4', data_payload: { q1: '@sudo' } },
      { id: 'r5', data_payload: { q1: '\t=CMD' } },
    ];
    const csv = buildColumnarExportResults(responses, surveySchema);

    expect(csv).toContain('"\'=SUM(A1:A2)"');
    expect(csv).toContain('"\'+1"');
    expect(csv).toContain('"\'-2"');
    expect(csv).toContain('"\'@sudo"');
    expect(csv).toContain(`"'\t=CMD"`);
  });
});

describe('loadCompletasLocais', () => {
  it('query compõe is_draft=false OR is_draft=null (aviso legado obrigatório)', async () => {
    await loadCompletasLocais();

    expect(capturedResponseClauses).toEqual([
      Q.or(
        Q.where('is_draft', false),
        Q.where('is_draft', null),
      ),
    ]);
  });

  it('AC5+aviso legado: completa e legada entram; rascunho fica de fora', async () => {
    mockDbTables.responses = [
      mockBuildResponseRow({ id: 'final', survey_id: 's', location_id: 'l', is_draft: false }),
      mockBuildResponseRow({ id: 'legado-null', survey_id: 's', location_id: 'l', is_draft: null }),
      mockBuildResponseRow({ id: 'legado-ausente', survey_id: 's', location_id: 'l' }),
      mockBuildResponseRow({ id: 'rascunho', survey_id: 's', location_id: 'l', is_draft: true }),
    ];

    const rows = await loadCompletasLocais();

    expect(rows.map((row: any) => row.id)).toEqual(['final', 'legado-null', 'legado-ausente']);
  });

  it('Stress/subtração: um where is_draft=false puro DERRUBARIA a legada, garantir a composição é essencial', async () => {
    const plainFalseClause = Q.where('is_draft', false);
    const legacyRow = mockBuildResponseRow({
      id: 'legado-null',
      survey_id: 's',
      location_id: 'l',
      is_draft: null,
    });

    expect(mockEvaluateClause(legacyRow, plainFalseClause)).toBe(false);
    expect(mockEvaluateClause(legacyRow, Q.where('is_draft', null))).toBe(true);
  });
});