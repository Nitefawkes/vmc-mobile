import 'react-native';
import React from 'react';
import App from '../App';
import { render } from '@testing-library/react-native';

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('VMC Mobile')).toBeTruthy();
  });

  it('displays version number', () => {
    const { getByText } = render(<App />);
    expect(getByText(/Version 0.1.0/)).toBeTruthy();
  });
});
