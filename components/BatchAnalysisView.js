// components/BatchAnalysisView.jsx (Conceptual Example)
'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from './LoadingSpinner'; // Assuming you have this

const Spectrogram = dynamic(() => import("./spectrogram"), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

export function BatchAnalysisView({ theme, batchSpectrograms }) {
  const chartConfig = {
    // Define chart config relevant to your batch spectrograms
    title: {
      font: {
        family: 'Inter',
        size: 16,
        color: theme.colors.text.secondary,
        weight: 600
      }
    },
    xaxis: { /* ... */ },
    yaxis: { /* ... */ },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    margin: { l: 50, r: 30, t: 30, b: 50 }
  };

  const batchKeys = Object.keys(batchSpectrograms).sort(); // Sort keys to maintain consistent order

  if (batchKeys.length === 0) {
    return (
      <div className="text-center text-slate-500 py-10">
        No batch spectrogram data available. Please process data and refresh.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {batchKeys.map((key) => {
        const batchData = batchSpectrograms[key];
        // Ensure batchData and its properties exist before rendering
        if (!batchData || !batchData.time || !batchData.frequency || !batchData.intensity) {
          console.warn(`Missing data for ${key}`);
          return null; // Skip rendering if data is incomplete
        }

        return (
          <div 
            key={key} 
            className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
            style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
          >
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <h3 className="text-lg font-bold text-white">Spectrogram {key.replace('_', ' ').replace('batch', 'Batch')}</h3>
            </div>
            <div className="p-4">
              <Spectrogram
                time={batchData.time}
                frequency={batchData.frequency}
                intensity={batchData.intensity}
                // Pass chartConfig if Spectrogram component supports it
                // chartConfig={chartConfig} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}