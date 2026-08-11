import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { Responses } from './index';
import { api } from '../../services/api';

vi.mock('../../services/api');

describe('Responses Component', () => {
  let createObjectURLMock: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
    createObjectURLMock = vi.fn(() => 'blob:stub');
    (URL as any).createObjectURL = createObjectURLMock;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockLocations = [
    { id: 'loc1', name: 'Location One', unique_code: 'L1' },
    { id: 'loc2', name: 'Location Two', unique_code: 'L2' }
  ];

  const mockSurveys = [
    {
      id: 'sur1',
      title: 'Survey One',
      questions_schema: [
        { id: 'q1', type: 'text', label: 'Nome' },
        { id: 'q2', type: 'boolean', label: 'Concorda' },
        { id: 'q3', type: 'number', label: 'Idade' }
      ]
    },
    {
      id: 'sur2',
      title: 'Survey Two',
      questions_schema: [{ id: 'q1', type: 'text', label: 'Nome' }]
    }
  ];

  // Linha de resposta completa: survey_id/location_id vêm como colunas da API
  // e são o alvo do filtro de exportação.
  function mockResponse(overrides: Record<string, any> = {}) {
    return {
      id: 'r1',
      survey_id: 'sur1',
      location_id: 'loc1',
      data_payload: { q1: 'Ana', q2: true, q3: 0 },
      collected_at: '2026-08-10T10:00:00.000Z',
      survey: { id: 'sur1', title: 'Survey One', questions_schema: mockSurveys[0].questions_schema },
      location: { name: 'Location One', unique_code: 'L1' },
      researcher: { name: 'Researcher One' },
      ...overrides
    };
  }

  function mockApi(data: any[]) {
    (api.get as Mock).mockImplementation((url: string) => {
      if (url === '/responses') return Promise.resolve({ data });
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: mockSurveys });
      return Promise.reject(new Error('not found'));
    });
  }

  async function selectExportTargets(user: any) {
    const locSelect = screen.getByRole('combobox', { name: /Localidade/i });
    const surSelect = screen.getByRole('combobox', { name: /Questionário/i });
    await user.selectOptions(locSelect, 'loc1');
    await user.selectOptions(surSelect, 'sur1');
  }

  async function readExportedCsv(): Promise<string> {
    const blob = createObjectURLMock.mock.calls[0][0];
    return await blob.text();
  }

  async function expectExportedBom() {
    const blob = createObjectURLMock.mock.calls[0][0] as Blob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  }

  it('loads GET /surveys and GET /locations on mount and populates the export selectors', async () => {
    mockApi([]);
    render(<Responses />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Location One/i })).toBeInTheDocument();
    });

    const calls = (api.get as Mock).mock.calls.map(([url]) => url);
    expect(calls).toContain('/responses');
    expect(calls).toContain('/surveys');
    expect(calls).toContain('/locations');
  });

  it('AC1: sem seleção, avisa e NÃO exporta nada', async () => {
    mockApi([]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    expect(window.alert).toHaveBeenCalledWith('Selecione um questionário e uma localidade para exportar.');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('AC2+AC3+AC5: exporta CSV colunar com cabeçalho do schema, booleano Sim/Não e 0 preservado', async () => {
    const user = userEvent.setup();
    mockApi([mockResponse()]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    // blob.text() decodifica descartando o BOM; o arquivo em si carrega os
    // bytes EF BB BF na abertura (Excel lê os acentos corretamente).
    await expectExportedBom();

    const csv = await readExportedCsv();
    const lines = csv.split('\n');
    expect(lines[0]).toBe('"Nome";"Concorda";"Idade"');
    expect(lines[1]).toBe('"Ana";"Sim";"0"');
  });

  it('AC4: filtra as linhas pelo questionário + localidade selecionados', async () => {
    const user = userEvent.setup();
    mockApi([
      mockResponse(),
      mockResponse({ id: 'r2', location_id: 'loc2', data_payload: { q1: 'Dora', q2: true, q3: 3 } }),
      mockResponse({ id: 'r3', survey_id: 'sur2' })
    ]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    const csv = await readExportedCsv();
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(csv).not.toContain('Dora');
  });

  it('booleano false exporta como Não', async () => {
    const user = userEvent.setup();
    mockApi([mockResponse({ data_payload: { q1: 'Bia', q2: false, q3: 1 } })]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    const csv = await readExportedCsv();
    expect(csv).toContain('"Bia";"Não";"1"');
  });

  it('resposta ausente exporta como Não respondido', async () => {
    const user = userEvent.setup();
    mockApi([mockResponse({ data_payload: { q1: 'Carlos' } })]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    const csv = await readExportedCsv();
    expect(csv).toContain('"Carlos";"Não";"Não respondido"');
  });

  it('neutraliza injeção de fórmula (=, +, -, @ e tab) na célula exportada', async () => {
    const user = userEvent.setup();
    mockApi([
      mockResponse({ id: 'r1', data_payload: { q1: '=SUM(A1:A2)' } }),
      mockResponse({ id: 'r2', data_payload: { q1: '+1' } }),
      mockResponse({ id: 'r3', data_payload: { q1: '-2' } }),
      mockResponse({ id: 'r4', data_payload: { q1: '@sudo' } }),
      mockResponse({ id: 'r5', data_payload: { q1: '\t=CMD' } })
    ]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    const csv = await readExportedCsv();
    expect(csv).toContain('"\'=SUM(A1:A2)"');
    expect(csv).toContain('"\'+1"');
    expect(csv).toContain('"\'-2"');
    expect(csv).toContain('"\'@sudo"');
    expect(csv).toContain(`"'\t=CMD"`);
  });

  it('avalisa e não exporta quando a combinação selecionada não tem dados', async () => {
    const user = userEvent.setup();
    mockApi([]);
    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Survey One/i })).toBeInTheDocument();
    });

    await selectExportTargets(user);
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    expect(window.alert).toHaveBeenCalledWith('Não há dados para exportar.');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('avisa quando o questionário selecionado não tem perguntas configuradas', async () => {
    const user = userEvent.setup();
    (api.get as Mock).mockImplementation((url: string) => {
      if (url === '/responses') return Promise.resolve({ data: [] });
      if (url === '/locations') return Promise.resolve({ data: mockLocations });
      if (url === '/surveys') return Promise.resolve({ data: [{ id: 'sur-empty', title: 'Empty Survey', questions_schema: [] }] });
      return Promise.reject(new Error('not found'));
    });

    render(<Responses />);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /Empty Survey/i })).toBeInTheDocument();
    });

    const locSelect = screen.getByRole('combobox', { name: /Localidade/i });
    const surSelect = screen.getByRole('combobox', { name: /Questionário/i });
    await user.selectOptions(locSelect, 'loc1');
    await user.selectOptions(surSelect, 'sur-empty');

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));

    expect(window.alert).toHaveBeenCalledWith('O questionário selecionado não tem perguntas configuradas.');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });
});