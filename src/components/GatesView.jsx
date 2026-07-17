import React from 'react';
import PropTypes from 'prop-types';
import { Users } from 'lucide-react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { severityFor } from '../utils/helpers';

function GatesView({ gates, sevPill, executeTrafficReroute, C, SEVERITY }) {
  return (
    <div>
      <SectionTitle>Real-Time Ingress Perimeters Log</SectionTitle>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <caption className="sr-only">Real-time ingress gate status: density, queue, trend, staffing and audit status per gate</caption>
          <thead>
            <tr style={{ textAlign: 'left', color: C.muted, background: '#1F2630', borderBottom: `1px solid ${C.border}` }}>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>TARGET IDENTIFICATION INDEX</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>CAPACITY ENVELOPE</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>DELAY CALCULATION</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>FLOW INDEX PATH</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>ASSIGNED RESPONDERS</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600 }}>AUDIT STATUS</th>
              <th scope="col" style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>CORE DIRECTIVES</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => {
              const isHighDensity = g.open && severityFor(g.density) === 'critical';
              return (
                <tr key={g.id} style={{ borderBottom: `1px solid ${C.border}`, background: g.open ? 'transparent' : '#161B22' }}>
                  <th scope="row" style={{ padding: '12px 14px', fontWeight: 600, color: '#FFF', textAlign: 'left' }}>{g.name}</th>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: isHighDensity ? SEVERITY.critical.color : '#FFF' }}>{g.open ? `${g.density}%` : 'OFFLINE'}</td>
                  <td style={{ padding: '12px 14px', color: C.muted }}>{g.open ? `${g.queue}M TOTAL` : '---'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: g.trend === 'rising' ? SEVERITY.critical.color : g.trend === 'falling' ? '#10B981' : C.muted }}>{g.open ? g.trend.toUpperCase() : '---'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} color={C.muted} /> {g.open ? `${g.staff} PERSONNEL` : '0 STANDBY'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {g.open ? sevPill(severityFor(g.density)) : (
                      <span style={{ fontSize: 9, padding: '2px 4px', border: `1px solid ${C.faint}`, color: C.muted, fontWeight: 600 }}>SECURED</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {isHighDensity ? (
                      <button onClick={() => executeTrafficReroute(g.id)} style={{ background: 'transparent', border: `1px solid ${C.accent}`, color: C.accent, padding: '3px 6px', borderRadius: 2, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                        SHUNT VOLUME BUFFER
                      </button>
                    ) : g.open ? <span style={{ color: C.faint, fontSize: 11 }}>IN COMPLIANCE</span> : <span style={{ color: SEVERITY.critical.color, fontSize: 11 }}>RESTRICTED</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

GatesView.propTypes = {
  gates: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    density: PropTypes.number.isRequired,
    queue: PropTypes.number.isRequired,
    trend: PropTypes.string.isRequired,
    staff: PropTypes.number.isRequired,
  })).isRequired,
  sevPill: PropTypes.func.isRequired,
  executeTrafficReroute: PropTypes.func.isRequired,
  C: PropTypes.object.isRequired,
  SEVERITY: PropTypes.object.isRequired,
};

export default GatesView;
