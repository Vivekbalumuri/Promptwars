import React from 'react';
import PropTypes from 'prop-types';
import { Sparkles, ChevronRight } from 'lucide-react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import StatCard from './StatCard';

const CAPACITY = 62000;

function Overview({ avgLoad, seatsFilled, openGates, closedGates, criticalGates, cautionGates, flowRate, latestBrief, briefLoading, onOpenAssistant, sevPill, weather, C, SEVERITY }) {
  const occupancyPct = Math.round((seatsFilled / CAPACITY) * 100);
  
  return (
    <div>
      <SectionTitle>Aggregated System Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <StatCard label="FACILITY CAPACITY METRIC" value={`${seatsFilled.toLocaleString()} / ${CAPACITY.toLocaleString()}`} sub={`${occupancyPct}% Aggregate Footprint`} alertActive={occupancyPct >= 95} />
        <StatCard label="INGRESS RADIAL PATHWAYS" value={`${openGates.length} OPEN CHANNELS`} sub={closedGates.length > 0 ? `${closedGates.length} LOCKED UNITS` : 'All ports processing'} warn={closedGates.length > 0} />
        <StatCard label="MEAN PROFILE SATURATION" value={avgLoad + '% DENSITY'} sub="System matrix average coefficient" warn={avgLoad >= 65} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="MICROCLIMATE TEMPERATURE LOG" value={`${weather.tempF}°F THERMAL`} sub={weather.tempF >= 92 ? 'EXCESS ATMOSPHERIC VALUE WARNING' : 'Basal atmospheric level'} alertActive={weather.tempF >= 92} />
        <StatCard label="INGRESS VELOCITY COEFFICIENT" value={`${flowRate.toLocaleString()} PKT/MIN`} sub="Active entries calculation rate" />
        <StatCard label="SYSTEM AUDIT EXTRAPOLATIONS" value={criticalGates.length + cautionGates.length} sub={`${criticalGates.length} Alerts · ${cautionGates.length} Secondary Warnings`} alertActive={criticalGates.length > 0} />
      </div>

      <Card style={{ background: '#202731', border: `1px solid ${C.borderThick}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: 6, border: `1px solid ${C.accent}`, height: 'max-content' }}>
              <Sparkles size={14} color={C.accent} className={briefLoading ? 'animate-spin-slow' : ''} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: '0.04em' }}>AUTOMATED LOG COMPILER EXECUTIVE BROADCAST BRIEFING</div>
              <div style={{ fontSize: 12, lineHeight: 1.45, marginTop: 4, color: '#E2E8F0' }} aria-live="polite">
                {briefLoading && !latestBrief ? 'Constructing data tree structures from active telemetry matrix models...' : latestBrief?.summary}
              </div>
            </div>
          </div>
          <button onClick={onOpenAssistant} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 700 }}>
            ACCESS MANAGEMENT WORKSPACE <ChevronRight size={12} />
          </button>
        </div>
      </Card>
    </div>
  );
}

Overview.propTypes = {
  avgLoad: PropTypes.number.isRequired,
  seatsFilled: PropTypes.number.isRequired,
  openGates: PropTypes.array.isRequired,
  closedGates: PropTypes.array.isRequired,
  criticalGates: PropTypes.array.isRequired,
  cautionGates: PropTypes.array.isRequired,
  flowRate: PropTypes.number.isRequired,
  latestBrief: PropTypes.shape({
    summary: PropTypes.string,
  }),
  briefLoading: PropTypes.bool.isRequired,
  onOpenAssistant: PropTypes.func.isRequired,
  sevPill: PropTypes.func.isRequired,
  weather: PropTypes.shape({
    tempF: PropTypes.number.isRequired,
  }).isRequired,
  C: PropTypes.object.isRequired,
  SEVERITY: PropTypes.object.isRequired,
};

export default Overview;
