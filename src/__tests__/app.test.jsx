import React from 'react';
import { render, screen } from '@testing-library/react';
import StadiumOpsControl from '../../app.jsx';

test('renders header title', () => {
  render(<StadiumOpsControl />);
  expect(screen.getByText(/FACILITIES MANAGEMENT OPERATIONS SYSTEM CONTROLLER/i)).toBeInTheDocument();
});
