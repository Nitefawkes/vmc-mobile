import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';

describe('HomeScreen', () => {
  it('renders the welcome message', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Welcome!')).toBeTruthy();
  });

  it('displays all feature checkmarks', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText(/TypeScript support/)).toBeTruthy();
    expect(getByText(/ESLint & Prettier configured/)).toBeTruthy();
    expect(getByText(/Jest testing setup/)).toBeTruthy();
  });

  it('shows app name and version', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('VMC Mobile')).toBeTruthy();
    expect(getByText('Version 0.1.0')).toBeTruthy();
  });
});
