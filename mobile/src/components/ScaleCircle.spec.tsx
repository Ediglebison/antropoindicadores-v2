import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScaleCircle } from './ScaleCircle';

describe('ScaleCircle Component', () => {
  it('renders all numbers from 1 to 5', () => {
    const { getByText } = render(<ScaleCircle value={0} onChange={() => {}} />);
    
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('calls onChange with the correct number when pressed', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(<ScaleCircle value={0} onChange={mockOnChange} />);

    fireEvent.press(getByText('3'));

    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('displays the selected value when a value is provided', () => {
    const { getByText, getAllByText } = render(<ScaleCircle value={4} onChange={() => {}} />);

    expect(getByText('Selecionado:')).toBeTruthy();
    // It should have two '4's: one in the circle, one in the selected value display
    const fourElements = getAllByText('4');
    expect(fourElements.length).toBe(2);
  });
});
