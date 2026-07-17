import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/StatCard';

test('StatCard shows label and value', () => {
  render(<StatCard label="L" value="V" sub="S" />);
  expect(screen.getByText('L')).toBeInTheDocument();
  expect(screen.getByText('V')).toBeInTheDocument();
  expect(screen.getByText('S')).toBeInTheDocument();
});
