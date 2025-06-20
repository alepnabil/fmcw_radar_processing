'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading Plot...</div>,
});

// Median filter function (like MATLAB's medfilt1)
function medianFilter1D(array, windowSize) {
  const result = [];
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < array.length; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(array.length, i + half + 1);
    const window = array.slice(start, end).sort((a, b) => a - b);
    const median = window[Math.floor(window.length / 2)];
    result.push(median);
  }
  return result;
}

// Apply filter column-wise to 2D array
function denoiseRangeData(data, filterLen = 5) {
  const numRows = data.length;
  const numCols = data[0]?.length || 0;
  const denoised = Array.from({ length: numRows }, () => Array(numCols).fill(0));

  for (let col = 0; col < numCols; col++) {
    const column = data.map(row => row[col]);
    const smoothed = medianFilter1D(column, filterLen);
    for (let row = 0; row < numRows; row++) {
      denoised[row][col] = smoothed[row];
    }
  }

  return denoised;
}

const RangeFFT = ({ timeAxis, rangeBins, rangeData }) => {
  const rangeTickValues = [0, 5, 10, 15, 20, 25];
  const maxTime = Math.max(...timeAxis);
  const timeTickValues = Array.from({ length: Math.ceil(maxTime) + 1 }, (_, i) => i);

  const filterLen = 5;
  const denoisedRangeData = denoiseRangeData(rangeData, filterLen);

  const plotLayout = {
    title: {
      text: 'Range FFT (Denoised)',
      font: {
        size: 14,
        family: 'Inter',
        color: '#94a3b8',
      },
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    margin: { l: 50, r: 20, t: 40, b: 40 },
    font: {
      family: 'Inter',
      color: '#94a3b8',
    },
    yaxis: {
      title: {
        text: 'Range (m)',
        font: {
          size: 12,
          family: 'Inter',
          color: '#94a3b8',
        },
      },
      tickmode: 'array',
      tickvals: rangeTickValues,
      ticktext: rangeTickValues.map(r => r.toString()),
      range: [0,7.5], // mimic ylim([min_distance, max_distance])
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { family: 'Inter', color: '#64748b', size: 11 },
      linecolor: 'transparent',
    },
    xaxis: {
      title: {
        text: 'Time (s)',
        font: {
          size: 12,
          family: 'Inter',
          color: '#94a3b8',
        },
      },
      tickmode: 'array',
      tickvals: timeTickValues,
      ticktext: timeTickValues.map(t => t.toFixed(1)),
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { family: 'Inter', color: '#64748b', size: 11 },
      linecolor: 'transparent',
    },
    coloraxis: {
      colorbar: {
        title: {
          text: 'Magnitude (linear)',
          font: {
            size: 12,
            family: 'Inter',
            color: '#94a3b8',
          },
        },
        tickfont: {
          size: 11,
          family: 'Inter',
          color: '#64748b',
        },
        outlinecolor: 'rgba(255, 255, 255, 0.3)',
        thickness: 20,
        len: 0.9,
      },
    },
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '430px',
      backgroundColor: 'transparent',
      borderRadius: '12px',
    }}>
      <Plot
        data={[
          {
            z: denoisedRangeData,
            x: timeAxis,
            y: rangeBins,
            type: 'heatmap',
            colorscale: 'Jet',
            colorbar: {
              title: 'Magnitude (linear)',
              tickformat: '.2f',
              len: 0.9,
              thickness: 20,
              outlinewidth: 1,
              outlinecolor: 'rgba(255, 255, 255, 0.3)',
            },
          },
        ]}
        layout={plotLayout}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
      />
    </div>
  );
};

export default RangeFFT;
