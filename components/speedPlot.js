'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
    loading: () => <div>Loading Plot...</div>
});

const SpeedPlot = ({ timeAxis, speedData }) => {
  if (!timeAxis || !speedData) {
    return <div>Error: Missing data for Speed Plot</div>;
  }

  // Extract first column values
  const speeds = speedData.map(row => row[0] || 0);
  const layout = {
    xaxis: {
      title: {
        text: 'Time (s)',
        font: {
          size: 14,
          family: 'Arial, sans-serif',
          color: '#ffffff'
        }
      },
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      tickfont: {
        size: 12,
        family: 'Arial, sans-serif',
        color: '#ffffff'
      },
      linecolor: 'rgba(255, 255, 255, 0.3)',
      showline: true
    },
    yaxis: {
      title: {
        text: 'Speed (m/s)',
        font: {
          size: 14,
          family: 'Arial, sans-serif',
          color: '#ffffff'
        }
      },
      showgrid: true,
      gridcolor: 'rgba(255, 255, 255, 0.1)',
      tickfont: {
        size: 12,
        family: 'Arial, sans-serif',
        color: '#ffffff'
      },
      linecolor: 'rgba(255, 255, 255, 0.3)',
      showline: true
    },
    paper_bgcolor: '#16213e',
    plot_bgcolor: '#16213e',
    margin: { l: 60, r: 30, t: 60, b: 60 }
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Plot
        data={[{
          x: timeAxis,
          y: speeds,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#ff7f0e', width: 2 }
        }]}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default SpeedPlot;