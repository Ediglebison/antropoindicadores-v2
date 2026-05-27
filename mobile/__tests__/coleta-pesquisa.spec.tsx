import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ColetaPesquisa from '../app/coleta-pesquisa';
import { api } from '../src/services/api';
import { database } from '../src/database';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../src/database', () => ({
  database: null, // Fallback to API
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

jest.spyOn(Alert, 'alert');

describe('ColetaPesquisa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and loads data from api', async () => {
    const mockLocations = [{ id: 'loc1', name: 'Local 1', unique_code: 'L1' }];
    const mockSurveys = [{ id: 'sur1', title: 'Survey 1', is_active: true, questions_schema: [] }];
    
    const apiGetMock = api.get as any;
    apiGetMock
      .mockResolvedValueOnce({ data: mockLocations }) // locations
      .mockResolvedValueOnce({ data: mockSurveys }); // surveys

    const { getByText } = render(<ColetaPesquisa />);

    await waitFor(() => {
      expect(getByText('📍 Local da Entrevista *')).toBeTruthy();
    });
  });

  it('handles starting a survey and submitting', async () => {
    const mockLocations = [{ id: 'loc1', name: 'Local Teste', unique_code: 'L1' }];
    const mockSurveys = [{ 
      id: 'sur1', 
      title: 'Survey Teste', 
      is_active: true, 
      questions_schema: [
        { id: 'q1', type: 'text', label: 'Nome' }
      ] 
    }];
    
    const apiGetMock = api.get as any;
    apiGetMock
      .mockResolvedValueOnce({ data: mockLocations }) // locations
      .mockResolvedValueOnce({ data: mockSurveys }); // surveys

    const { getByText, getByPlaceholderText } = render(<ColetaPesquisa />);

    await waitFor(() => {
      expect(getByText('📍 Local da Entrevista *')).toBeTruthy();
    });

    // Open Location Modal
    fireEvent.press(getByText('Selecione um local...'));
    await waitFor(() => expect(getByText('Local Teste (L1)')).toBeTruthy());
    fireEvent.press(getByText('Local Teste (L1)'));

    // Open Survey Modal
    fireEvent.press(getByText('Selecione um questionário...'));
    await waitFor(() => expect(getByText('Survey Teste (1 perguntas)')).toBeTruthy());
    fireEvent.press(getByText('Survey Teste (1 perguntas)'));

    // Start Coleta
    fireEvent.press(getByText('Começar Coleta →'));

    // Wait for the next screen (step 2)
    await waitFor(() => {
      expect(getByText('1. Nome')).toBeTruthy();
    });

    // Fill answer
    fireEvent.changeText(getByPlaceholderText('Digite sua resposta...'), 'João');

    // Submit
    const apiPostMock = api.post as any;
    apiPostMock.mockResolvedValueOnce({});
    fireEvent.press(getByText('✓ Enviar Questionário'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/responses', {
        survey_id: 'sur1',
        location_id: 'loc1',
        answers_json: { q1: 'João' }
      });
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', 'Questionário salvo com sucesso');
    });
  });

  it('shows error if starting without questions', async () => {
    const mockLocations = [{ id: 'loc1', name: 'Local Teste', unique_code: 'L1' }];
    const mockSurveys = [{ 
      id: 'sur1', 
      title: 'Survey Teste', 
      is_active: true, 
      questions_schema: [] // Empty questions
    }];
    
    const apiGetMock = api.get as any;
    apiGetMock
      .mockResolvedValueOnce({ data: mockLocations })
      .mockResolvedValueOnce({ data: mockSurveys });

    const { getByText } = render(<ColetaPesquisa />);

    await waitFor(() => {
      expect(getByText('📍 Local da Entrevista *')).toBeTruthy();
    });

    // Select location and survey
    fireEvent.press(getByText('Selecione um local...'));
    await waitFor(() => expect(getByText('Local Teste (L1)')).toBeTruthy());
    fireEvent.press(getByText('Local Teste (L1)'));

    fireEvent.press(getByText('Selecione um questionário...'));
    await waitFor(() => expect(getByText('Survey Teste (0 perguntas)')).toBeTruthy());
    fireEvent.press(getByText('Survey Teste (0 perguntas)'));

    // Try to start
    fireEvent.press(getByText('Começar Coleta →'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Este questionário não tem perguntas configuradas');
    });
  });
});