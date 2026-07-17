import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

const StatCard = ({ label, value, sub, warn, alertActive }) => {
  let indicatorColor = '#2C3540';
  if (warn) indicatorColor = '#D97706';
  if (alertActive) indicatorColor = '#DC2626';

  return (
    <Card style={{ borderTop: `2px solid ${indicatorColor}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#8A99AD', letterSpacing: '0.02em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: '#FFF' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: alertActive ? '#EF4444' : warn ? '#F59E0B' : '#8A99AD', marginTop: 4, fontWeight: 600 }}>{sub}</div>}
    </Card>
  );
};

StatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sub: PropTypes.string,
  warn: PropTypes.bool,
  alertActive: PropTypes.bool,
};

export default StatCard;
