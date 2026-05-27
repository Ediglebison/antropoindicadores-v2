import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(auth)/login';
import { authAPI } from '../src/services/api';
import { Storage } from '../src/utils/storage';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Mocks
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

jest.mock('../src/utils/storage', () => ({
    Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../src/database', () => ({
  database: null, // Testando caminho online
}));

jest.spyOn(Alert, 'alert');

const mockedGetItem = Storage.getItem as jest.Mock;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly after loading', async () => {
    mockedGetItem.mockResolvedValue(null);
    
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    await waitFor(() => {
      expect(getByText('Antropoindicadores')).toBeTruthy();
      expect(getByPlaceholderText('Digite seu código')).toBeTruthy();
      expect(getByPlaceholderText('Sua senha secreta')).toBeTruthy();
    });
  });

  it('redirects to dashboard if already authenticated', async () => {
    mockedGetItem.mockResolvedValue('existing-token');
    
    render(<LoginScreen />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('alerts if fields are empty on login', async () => {
    mockedGetItem.mockResolvedValue(null);
    const { getByText } = render(<LoginScreen />);

    await waitFor(() => getByText(/entrar na plataforma/i));
    
    const loginButton = getByText(/entrar na plataforma/i);
    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Preencha código de acesso e senha');
  });

  it('performs online login successfully', async () => {
    mockedGetItem.mockResolvedValue(null);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      type: 'unknown',
      isConnected: true,
      isInternetReachable: true,
      details: null,
    });
    (authAPI.login as jest.Mock).mockResolvedValue({
      access_token: 'new-token',
      user: { id: 1, name: 'Admin', role: 'ADMIN' }
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    await waitFor(() => getByText(/entrar na plataforma/i));

    fireEvent.changeText(getByPlaceholderText('Digite seu código'), 'admin123');
    fireEvent.changeText(getByPlaceholderText('Sua senha secreta'), 'secret');
    fireEvent.press(getByText(/entrar na plataforma/i));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('admin123', 'secret');
      expect(Storage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
    });
  });
});