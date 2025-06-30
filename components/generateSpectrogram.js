'use client';

import { useState } from 'react';

export default function SpectrogramImageGenerator({ data }) {
  const [imageURL, setImageURL] = useState(null);
  const [error, setError] = useState(null);

  const generateImage = () => {
    try {
      const { time, frequency, intensity } = data;

      if (!Array.isArray(time) || !Array.isArray(frequency) || !Array.isArray(intensity)) {
        throw new Error("Invalid spectrogram data format.");
      }

      const width = time.length;
      const height = frequency.length;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error("Canvas context is not supported.");
      }

      const climMin = -40, climMax = 0;
      function dBToRGB(value) {
        const t = Math.min(1, Math.max(0, (value - climMin) / (climMax - climMin)));
        const r = Math.floor(255 * Math.max(Math.min(1.5 - Math.abs(4 * t - 3), 1), 0));
        const g = Math.floor(255 * Math.max(Math.min(1.5 - Math.abs(4 * t - 2), 1), 0));
        const b = Math.floor(255 * Math.max(Math.min(1.5 - Math.abs(4 * t - 1), 1), 0));
        return `rgb(${r},${g},${b})`;
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const value = intensity[y][x];
          ctx.fillStyle = dBToRGB(value);
          ctx.fillRect(x, y, 1, 1);
        }
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageURL(url);
        } else {
          setError("Failed to create PNG blob.");
        }
      }, 'image/png');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-white shadow">
      <button
        onClick={generateImage}
        className="mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
      >
        Generate Spectrogram Image
      </button>

      {error && <p className="text-red-500">Error: {error}</p>}

      {imageURL && (
        <div>
          <img src={imageURL} alt="Generated Spectrogram" className="mt-4 border" />
          <a
            href={imageURL}
            download="spectrogram.png"
            className="mt-2 inline-block text-blue-600 underline"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
