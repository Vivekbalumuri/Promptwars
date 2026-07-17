import React from 'react';
import PropTypes from 'prop-types';

const Card = React.memo(function Card({ children, style }) {
  return (
    <div style={{ background: '#1A1F26', border: `1px solid rgba(60,70,80,0.2)`, borderRadius: 3, padding: 14, boxSizing: 'border-box', ...style }}>
      {children}
    </div>
  );
});

Card.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
};

export default Card;
