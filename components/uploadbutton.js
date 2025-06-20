'use client';

  import { useState, useRef } from 'react';

  export default function FileUpload() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      // Validate file types
      const validFiles = files.filter(file => 
        file.name.endsWith('.xml') || file.name.endsWith('.raw.bin')
      );

      if (validFiles.length !== files.length) {
        setUploadStatus('Invalid file type. Only .xml and .raw.bin files are allowed.');
        return;
      }

      setSelectedFiles(validFiles);
      setUploadStatus(null);
    };

    const handleUploadClick = async () => {
      if (selectedFiles.length === 0) {
        setUploadStatus('No files selected');
        return;
      }

      setUploading(true);
      setUploadStatus('uploading');

      try {
        for (const file of selectedFiles) {
          // Determine the standardized filename without GUID
          let targetFileName;
          if (file.name.endsWith('.xml')) {
            targetFileName = 'radar_data.xml';
          } else if (file.name.endsWith('.raw.bin')) {
            targetFileName = 'radar_data.raw.bin';
          } else {
            throw new Error(`Invalid file type: ${file.name}`);
          }

          const formData = new FormData();
          // Create new File object with the clean filename
          const renamedFile = new File([file], targetFileName, { type: file.type });
          formData.append('file', renamedFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${targetFileName}`);
          }
        }

        setUploadStatus('success');
        setSelectedFiles([]);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus(error.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    };

    const handleRemoveFile = (indexToRemove) => {
      setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
      <div className="relative flex flex-col">
        {/* Main Button Row */}
        <div className="flex items-center space-x-3 z-10">
          {/* File Selection Button */}
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 text-sm font-medium bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Select Files{selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".xml,.raw.bin"
            className="hidden"
          />

          {/* Upload Button */}
          <button
            onClick={handleUploadClick}
            disabled={uploading || selectedFiles.length === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2
              ${uploading || selectedFiles.length === 0 
                ? 'bg-indigo-400/50 cursor-not-allowed text-white/50' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload to Azure</span>
              </>
            )}
          </button>

          {/* Status Message */}
          {uploadStatus && (
            <span className={`text-sm ${
              uploadStatus === 'success' ? 'text-emerald-400' :
              uploadStatus?.includes('failed') ? 'text-yellow-400' :
              uploadStatus === 'error' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {uploadStatus === 'success' && '✓ Upload complete'}
              {uploadStatus === 'error' && '× Upload failed'}
              {uploadStatus === 'uploading' && 'Uploading...'}
              {uploadStatus === 'No files selected' && 'Select files first'}
              {!['success', 'error', 'uploading', 'No files selected'].includes(uploadStatus) && uploadStatus}
            </span>
          )}
        </div>

        {/* File List Drawer */}
        <ul className="text-xs text-slate-300 space-y-1">
          {selectedFiles.map((file, index) => {
              const [nameOnly, ext] = file.name.split(/\.(?=[^\.]+$)/); // splits into name + extension
              return (
              <li key={index} className="flex items-center justify-between space-x-2 py-1">
                  <div className="flex items-center space-x-2 max-w-[210px]" title={file.name}>
                  <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="truncate">
                      {nameOnly}
                      {ext && <span className="text-slate-400">.{ext}</span>}
                  </span>
                  </div>
                  <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-400 hover:text-red-500 text-xs"
                  title="Remove file"
                  >
                  ✕
                  </button>
              </li>
              );
          })}
          </ul>



      </div>
    );
  }
