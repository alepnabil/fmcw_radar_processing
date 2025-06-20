'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div>Loading FFT Plot...</div>,
});

const FFTPlot = ({ freqAxis, fftMagnitude, title = '' }) => {
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    if (fftMagnitude && fftMagnitude.length > 0) {
      console.log('✅ FFT Data Loaded');
      console.log('📏 freqAxis length:', freqAxis.length);
      console.log('📊 fftMagnitude length:', fftMagnitude.length);
    } else {
      console.warn('⚠️ FFT Data is empty or undefined');
    }
  }, [fftMagnitude, freqAxis]);

  if (!fftMagnitude || fftMagnitude.length === 0) {
    return <div className="text-red-500">No FFT data</div>;
  }

  const handleClick = (event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const newAnnotation = {
        x: point.x,
        y: point.y,
        text: `(${point.x.toFixed(2)} Hz, ${point.y.toFixed(2)})`,
        xanchor: 'left',
        yanchor: 'bottom',
        showarrow: true,
        arrowhead: 4,
        ax: 20,
        ay: -20,
        font: {
          color: '#f8fafc',
          size: 12,
        },
        bgcolor: 'rgba(30, 41, 59, 0.8)',
        bordercolor: '#38bdf8',
        borderwidth: 1,
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  return (
    <div className="w-full h-[500px]">
      <Plot
        data={[
          {
            x: freqAxis,
            y: fftMagnitude,
            mode: 'lines',
            type: 'scatter',
            line: { width: 2, color: '#38bdf8' },
            name: 'FFT',
            hoverinfo: 'x+y',
            showlegend: false,
          },
        ]}
        layout={{
          autosize: true,
          xaxis: {
            title: {
              text: 'Frequency (Hz)',
              font: { size: 14, color: '#f8fafc', family: 'Inter' },
            },
            tickfont: { size: 12, color: '#cbd5e1' },
            color: '#94a3b8',
            showgrid: true,
            gridcolor: 'rgba(148, 163, 184, 0.1)',
            zeroline: false,
          },
          yaxis: {
            title: {
              text: 'FFT Normalized Magnitude',
              font: { size: 14, color: '#f8fafc', family: 'Inter' },
            },
            tickfont: { size: 12, color: '#cbd5e1' },
            color: '#94a3b8',
            showgrid: true,
            gridcolor: 'rgba(148, 163, 184, 0.1)',
            zeroline: false,
          },
          annotations: annotations,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { l: 50, r: 20, t: 30, b: 40 },
          hovermode: 'closest',
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToAdd: ['drawline', 'drawopenpath', 'drawcircle', 'drawrect', 'eraseshape'],
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        onClick={handleClick}
      />
    </div>
  );
};

export default FFTPlot;
