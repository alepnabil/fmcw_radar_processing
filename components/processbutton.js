// components/processbutton.js
'use client';
import { useState } from 'react';
// Ensure the path is correct
import { processRadarData } from '../src/app/apiMatlab/matlab_api';

// --- CHANGE STARTS HERE ---
// Accept processAnimalActivityValue as a prop
export default function ProcessButton({ processAnimalActivityValue }) {
// --- CHANGE ENDS HERE ---
  const [status, setStatus] = useState({
    isProcessing: false,
    message: null,
    type: null // 'success', 'error', or null
  });

  const handleProcessClick = async () => {
    try {
      setStatus({
        isProcessing: true,
        message: 'Connecting to MATLAB server...',
        type: null
      });


      const response = await processRadarData(processAnimalActivityValue);

      if (!response) {
        throw new Error('MATLAB API did not return a response.');
      }

      if (response) {
        setStatus({
          isProcessing: false,
          message: 'Processing complete!',
          type: 'success'
        });

      // Step 2: After MATLAB finishes, call Blob Storage refresh API
      setStatus({
        isProcessing: true,
        message: 'Downloading new files from Blob Storage...',
        type: null
      });


      const blobResponse = await fetch('/api/upload');
      if (!blobResponse.ok) {
        throw new Error(`Blob download failed: ${blobResponse.status}`);
      }

        // Step 3: Done
      setStatus({
        isProcessing: false,
        message: 'Processing complete!',
        type: 'success'
      });


        // Clear success message after 3 seconds
        setTimeout(() => {
          setStatus({ isProcessing: false, message: null, type: null });
        }, 3000);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setStatus({
        isProcessing: false,
        message: 'Processing failed. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={handleProcessClick}
        disabled={status.isProcessing}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2
          ${status.isProcessing
            ? 'bg-emerald-500/50 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600'
          } text-white`}
      >
        {status.isProcessing ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Process Data</span>
          </>
        )}
      </button>

      {/* Status Message */}
      {status.message && (
        <span className={`text-sm ${
          status.type === 'success' ? 'text-emerald-400' :
          status.type === 'error' ? 'text-red-400' :
          'text-slate-400'
        }`}>
          {status.message}
        </span>
      )}
    </div>
  );
}