import React from 'react';

const TimeWindowSlider = ({ currentIndex, maxIndex, windowSize, onChange }) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex justify-between text-white/80 text-sm">
        <span>Window Size: {windowSize} samples</span>
        <span>Time Index: {currentIndex}</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxIndex}
        value={currentIndex}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-cyan-500"
      />
    </div>
  );
};

export default TimeWindowSlider;