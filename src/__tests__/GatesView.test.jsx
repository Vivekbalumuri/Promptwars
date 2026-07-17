import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GatesView from '../components/GatesView';

const C = {
  border: '#2C3540',
  borderThick: '#475569',
  muted: '#8A99AD',
  faint: '#414E5E',
  accent: '#38BDF8',
};

const SEVERITY = {
  normal: { color: '#10B981' },
  caution: { color: '#F59E0B' },
  critical: { color: '#EF4444' },
};

const gates = [
  { id: 'A', name: 'Gate A — North Plaza', open: true, density: 30, queue: 2, trend: 'steady', staff: 5 },
  { id: 'C', name: 'Gate C — East Concourse', open: true, density: 85, queue: 6, trend: 'rising', staff: 4 },
  { id: 'G', name: 'Gate G — West Concourse', open: false, density: 0, queue: 0, trend: 'steady', staff: 0 },
];

function renderGatesView(overrides = {}) {
  const props = {
    gates,
    sevPill: (sev) => <span>{sev.toUpperCase()}</span>,
    executeTrafficReroute: () => {},
    C,
    SEVERITY,
    ...overrides,
  };
  return render(<GatesView {...props} />);
}

test('renders a row for every gate, including closed ones', () => {
  renderGatesView();
  expect(screen.getByText('Gate A — North Plaza')).toBeInTheDocument();
  expect(screen.getByText('Gate C — East Concourse')).toBeInTheDocument();
  expect(screen.getByText('Gate G — West Concourse')).toBeInTheDocument();
  expect(screen.getByText('OFFLINE')).toBeInTheDocument();
});

test('shows a reroute action only for gates at critical density', () => {
  renderGatesView();
  expect(screen.getByText('SHUNT VOLUME BUFFER')).toBeInTheDocument();
});

test('clicking the reroute action calls executeTrafficReroute with the gate id', () => {
  const executeTrafficReroute = vi.fn();
  renderGatesView({ executeTrafficReroute });
  fireEvent.click(screen.getByText('SHUNT VOLUME BUFFER'));
  expect(executeTrafficReroute).toHaveBeenCalledWith('C');
});
