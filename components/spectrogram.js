'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
    loading: () => <div>Loading Plot...</div>
});

const Spectrogram = ({ time, frequency, intensity }) => {
  try {
    if (!time || !frequency || !intensity) {
      throw new Error('Missing required data');
    }

    // Reduce frequency bins if needed
    const MAX_FREQ_BINS = 4096;
    const freqStep = Math.ceil(frequency.length / MAX_FREQ_BINS);
    const reducedFrequency = frequency.filter((_, idx) => idx % freqStep === 0);
    
    // Use full time range
    const reducedIntensity = intensity
      .filter((_, idx) => idx % freqStep === 0);

    // Validate data before plotting
    if (!reducedIntensity || reducedIntensity.length === 0) {
      throw new Error('Invalid intensity data');
    }

    const layout = {
      xaxis: { 
        title: { 
          text: 'Time (s)',
          font: { color: '#ffffff', family: 'Inter' }
        },
        gridcolor: 'rgba(255, 255, 255, 0.1)',
        tickfont: { color: '#ffffff', family: 'Inter' },
        showline: false,
        zeroline: false,
        showgrid: true
      },
      yaxis: { 
        title: { 
          text: 'Frequency (Hz)',
          font: { color: '#ffffff', family: 'Inter' }
        },
        gridcolor: 'rgba(255, 255, 255, 0.1)',
        tickfont: { color: '#ffffff', family: 'Inter' },
        type: 'log',
        range: [Math.log10(1), Math.log10(400)],
        tickvals: [1, 10, 50, 100, 200, 400],
        ticktext: ['1', '10', '50', '100', '200', '400'],
        autorange: false,
        showline: false,
        zeroline: false
      },      
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      margin: { l: 60, r: 30, t: 60, b: 60 },
      showlegend: false,
      shapes: [],
      annotations: []
    };

    return (
      <div className="plot-container">
        <Plot
          data={[{
            x: time,
            y: reducedFrequency,
            z: reducedIntensity,
            type: "heatmap",
            colorscale: "Jet",
            zmin: -20,
            zmax: -0,
            transpose: false,
            hoverongaps: false,
            showscale: true,
            colorbar: {
              title: { 
                text: 'Power (dB)',
                font: { color: '#ffffff', family: 'Inter' }
              },
              tickfont: { color: '#ffffff', family: 'Inter' },
              thickness: 15,
              outlinewidth: 0
            }
          }]}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: false,
            displaylogo: false
          }}
          style={{ 
            width: '100%', 
            height: '400px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
      </div>
    );

  } catch (error) {
    console.error('Error processing spectrogram data:', error);
    return (
      <div className="text-white bg-red-500/20 p-4 rounded">
        Error: {error.message}
      </div>
    );
  }
};

export default Spectrogram;