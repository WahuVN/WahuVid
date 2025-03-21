import React from 'react';
import PropTypes from 'prop-types';

const formatNumber = (num) => {
  const absNum = Math.abs(num);
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 10000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

const LargeNumberDisplay = ({ number }) => {
  return <span>{formatNumber(number)}</span>;
};

LargeNumberDisplay.propTypes = {
  number: PropTypes.number.isRequired,
};

export default LargeNumberDisplay;
