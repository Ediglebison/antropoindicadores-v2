import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import DashboardScreen, { countCompletedResponses } from '../app/dashboard';
import { database } from '../src/database';
import { Storage } from '../src/utils/storage';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../src/services/api', () => ({
  api: {
    get: jest.fn() as jest.Mock<any, any>,
  },
}));

// Banco local controlável: o dashboard offline lê locations/surveys/responses
// daqui; cada tabela guarda as linhas que a query().fetch() devolve.
let mockDbTables: Record<string, any[]> = { locations: [], surveys: [], responses: [] };

jest.mock('../src/database', () => ({
  database: {
    collections: {
      get: jest.fn((tableName: string) => ({
        query: jest.fn(() => ({
          fetch: jest.fn(async () => mockDbTables[tableName] || []),
        })),
      })),
    },
  },
}));

jest.mock('../src/utils/storage', () => ({
  Storage: {
    removeItem: jest.fn(),
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

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('DashboardScreen', () => {
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbTables = { locations: [], surveys: [], responses: [] };
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('loads stats from the local database, counting only complete responses', async () => {
    mockDbTables.locations.push({ id: 'loc1' }, { id: 'loc2' });
    mockDbTables.surveys.push({ id: 'sur1' });
    mockDbTables.responses.push(
      { id: 'resp1', isDraft: false },
      { id: 'resp2', isDraft: true },
      { id: 'resp3', isDraft: false },
      { id: 'resp4' },
    );

    const { getByTestId } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByTestId('total-coletas').props.children).toBe(3);
      expect(getByTestId('total-locais').props.children).toBe(2);
      expect(getByTestId('total-questionarios').props.children).toBe(1);
    });
  });

  it('AC7: only a local draft → totalColetas = 0', async () => {
    mockDbTables.locations.push({ id: 'loc1' });
    mockDbTables.surveys.push({ id: 'sur1' });
    mockDbTables.responses.push({ id: 'draft-1', isDraft: true });

    const { getByTestId } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByTestId('total-coletas').props.children).toBe(0);
    });
  });

  it('handles navigation to coleta-pesquisa', async () => {
    mockDbTables.locations.push({ id: 'loc1' });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Visão Geral')).toBeTruthy();
    });

    const startBtn = getByText('🎯 Iniciar Nova Coleta');
    fireEvent.press(startBtn);

    expect(mockRouter.push).toHaveBeenCalledWith('coleta-pesquisa');
  });

  it('handles logout on 401 error', async () => {
    mockDbTables.locations.push({ id: 'loc1' });
    (database.collections.get as jest.Mock).mockImplementationOnce((tableName: string) => ({
      query: jest.fn(() => ({
        fetch: jest.fn().mockRejectedValue({ response: { status: 401 } }),
      })),
    }));

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(Storage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(Storage.removeItem).toHaveBeenCalledWith('user');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});

describe('countCompletedResponses', () => {
  it('AC8: trata rascunho como não-concluída', () => {
    const resps = [
      { id: 'ok-1', isDraft: false },
      { id: 'draft-1', isDraft: true },
    ];
    expect(countCompletedResponses(resps)).toBe(1);
  });

  it('AC7: só rascunhos → 0', () => {
    expect(countCompletedResponses([{ id: 'draft-1', isDraft: true }])).toBe(0);
  });

  it('AC8: respostas sem o campo isDraft (defensivo/legado/API) contam como completas', () => {
    const apiResponses = [{ id: 'a' }, { id: 'b', isDraft: false }];
    expect(countCompletedResponses(apiResponses)).toBe(2);
    expect(countCompletedResponses([])).toBe(0);
  });
});