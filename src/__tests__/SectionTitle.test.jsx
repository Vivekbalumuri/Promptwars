import React from 'react';
import { render, screen } from '@testing-library/react';
import SectionTitle from '../components/SectionTitle';

test('SectionTitle renders children and action', () => {
  render(<SectionTitle action={<button>Act</button>}>Hello</SectionTitle>);
  expect(screen.getByText('Hello')).toBeInTheDocument();
  expect(screen.getByText('Act')).toBeInTheDocument();
});
