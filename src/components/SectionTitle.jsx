import React from 'react';
import PropTypes from 'prop-types';

export default function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid rgba(70,80,90,0.2)` }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.01em', margin: 0, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6 }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

SectionTitle.propTypes = {
  children: PropTypes.node,
  action: PropTypes.node,
};
