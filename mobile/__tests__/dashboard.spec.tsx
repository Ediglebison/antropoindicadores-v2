import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../app/dashboard';
import { api } from '../src/services/api';
import { database } from '../src/database';
import { Storage } from '../src/utils/storage';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

// Mocks
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

jest.mock('../src/database', () => ({
  database: null, // Fallback to API in test to simplify or we can mock it
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
    mockRouter = {
      replace: jest.fn(),
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders correctly and loads stats from api', async () => {
    const apiGetMock = api.get as jest.Mock<any, any>;
    apiGetMock
      .mockResolvedValueOnce({ data: [{ id: 'loc1' }, { id: 'loc2' }] } as any) // locations
      .mockResolvedValueOnce({ data: [{ id: 'sur1' }] } as any) // surveys
      .mockResolvedValueOnce({ data: [{ id: 'resp1' }, { id: 'resp2' }, { id: 'resp3' }] } as any); // responses

    const { getByText, getByTestId } = render(<DashboardScreen />);

    // Wait for the loading to finish
    await waitFor(() => {
      expect(getByText('Visão Geral')).toBeTruthy();
    });

    // Check stats
    expect(getByTestId('total-locais').props.children).toBe(2);
    expect(getByTestId('total-questionarios').props.children).toBe(1);
    expect(getByTestId('total-coletas').props.children).toBe(3);
  });

  it('handles navigation to coleta-pesquisa', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] } as any);

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('Visão Geral')).toBeTruthy();
    });

    const startBtn = getByText('🎯 Iniciar Nova Coleta');
    fireEvent.press(startBtn);

    expect(mockRouter.push).toHaveBeenCalledWith('coleta-pesquisa');
  });

  it('handles logout on 401 error', async () => {
    (api.get as jest.Mock).mockRejectedValue({ response: { status: 401 } });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(Storage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(Storage.removeItem).toHaveBeenCalledWith('user');
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});