'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
    loading: () => <div>Loading Plot...</div>
});

const SpeedDistancePlot = ({ timeAxis, rangeData, speedData }) => {
  if (!timeAxis || !rangeData || !speedData) {
    console.error('Missing required data');
    return <div>Error: Missing data</div>;
  }

  try {
    // Extract first column values since that's where the data is
    const ranges = rangeData.map(row => row[0] || 0);
    const speeds = speedData.map(row => row[0] || 0);

    // Create layout for two subplots stacked vertically
    const layout = {
      grid: {
        rows: 2,
        columns: 1,
        pattern: 'independent',
        roworder: 'top to bottom'
      },
      height: 800,

      // Range plot
      xaxis: {
        title: 'Time (s)',
        showgrid: true,
        gridcolor: 'rgba(128, 128, 128, 0.2)',
        domain: [0, 0.9]
      },
      yaxis: {
        title: 'Range (m)',
        showgrid: true,
        gridcolor: 'rgba(128, 128, 128, 0.2)'
      },
      // Speed plot
      xaxis2: {
        title: 'Time (s)',
        showgrid: true,
        gridcolor: 'rgba(128, 128, 128, 0.2)',
        domain: [0, 0.9]
      },
      yaxis2: {
        title: 'Speed (m/s)',
        showgrid: true,
        gridcolor: 'rgba(128, 128, 128, 0.2)'
      },
      paper_bgcolor: 'white',
      plot_bgcolor: 'white',
      margin: {
        l: 80,
        r: 50,
        t: 100,
        b: 60
      },
      showlegend: false
    };

    return (
      <div style={{ width: '100%', height: '600px' }}>
        <Plot
          data={[
            // Range plot
            {
              x: timeAxis,
              y: ranges,
              type: 'scatter',
              mode: 'lines',
              name: 'Range',
              line: { color: '#1f77b4', width: 2 },
              xaxis: 'x',
              yaxis: 'y'
            },
            // Speed plot
            {
              x: timeAxis,
              y: speeds,
              type: 'scatter',
              mode: 'lines',
              name: 'Speed',
              line: { color: '#ff7f0e', width: 2 },
              xaxis: 'x2',
              yaxis: 'y2'
            }
          ]}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  } catch (error) {
    console.error('Error processing range-speed data:', error);
    return <div>Error processing data</div>;
  }
};

export default SpeedDistancePlot;