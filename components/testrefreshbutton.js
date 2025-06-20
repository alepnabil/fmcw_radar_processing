'use client';

import { useState } from 'react';

export default function TestReloadButton({ onReload }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestReload = async () => {
    setIsLoading(true);
    try {
      const [rangeResponse, spectrogramResponse, speedResponse] = await Promise.all([
        fetch('/radar_data_range_fft_data.json'),
        fetch('/spectrogram_data.json'),
        fetch('/radar_data_range_speed_data.json')
      ]);

      const [rangeData, spectrogramData, speedDistanceData] = await Promise.all([
        rangeResponse.json(),
        spectrogramResponse.json(),
        speedResponse.json()
      ]);

      onReload?.({
        rangeData,
        spectrogramData,
        speedDistanceData
      });
    } catch (error) {
      console.error('Test reload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTestReload}
      disabled={isLoading}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      <span>Test Reload</span>
    </button>
  );
}