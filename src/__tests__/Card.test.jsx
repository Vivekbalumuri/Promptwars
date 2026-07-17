import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../components/Card';

test('Card renders children', () => {
  render(<Card><div>Inside</div></Card>);
  expect(screen.getByText('Inside')).toBeInTheDocument();
});
