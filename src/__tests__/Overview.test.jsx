import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Overview from '../components/Overview';

const C = {
  border: '#2C3540',
  borderThick: '#475569',
  muted: '#8A99AD',
  accent: '#38BDF8',
};

const SEVERITY = {
  normal: { color: '#10B981' },
  caution: { color: '#F59E0B' },
  critical: { color: '#EF4444' },
};

function baseProps(overrides = {}) {
  return {
    avgLoad: 42,
    seatsFilled: 38400,
    openGates: [{ id: 'A' }, { id: 'B' }],
    closedGates: [{ id: 'G' }],
    criticalGates: [],
    cautionGates: [{ id: 'B' }],
    flowRate: 640,
    latestBrief: { summary: 'All systems nominal.' },
    briefLoading: false,
    onOpenAssistant: () => {},
    sevPill: () => null,
    weather: { tempF: 94 },
    C,
    SEVERITY,
    ...overrides,
  };
}

test('renders key occupancy and flow metrics', () => {
  render(<Overview {...baseProps()} />);
  expect(screen.getByText(/38,400/)).toBeInTheDocument();
  expect(screen.getByText(/2 OPEN CHANNELS/)).toBeInTheDocument();
  expect(screen.getByText('All systems nominal.')).toBeInTheDocument();
});

test('shows a loading placeholder while the first brief is still generating', () => {
  render(<Overview {...baseProps({ latestBrief: undefined, briefLoading: true })} />);
  expect(screen.getByText(/Constructing data tree structures/)).toBeInTheDocument();
});

test('clicking the workspace link calls onOpenAssistant', () => {
  const onOpenAssistant = vi.fn();
  render(<Overview {...baseProps({ onOpenAssistant })} />);
  fireEvent.click(screen.getByText(/ACCESS MANAGEMENT WORKSPACE/));
  expect(onOpenAssistant).toHaveBeenCalledTimes(1);
});
