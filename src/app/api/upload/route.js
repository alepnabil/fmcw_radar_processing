export const runtime = 'nodejs'; // Ensures Node.js environment

import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // Get the connection string from environment variables
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!connectionString || !containerName) {
      return new Response(JSON.stringify({ 
        error: 'Storage configuration missing' 
      }), { status: 500 });
    }

    // Create blob service client
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file uploaded' 
      }), { status: 400 });
    }

    // Use the filename directly without adding GUID
    const fileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get blob client with clean filename
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    // Delete existing file if it exists
    try {
      const exists = await blockBlobClient.exists();
      if (exists) {
        await blockBlobClient.delete();
      }
    } catch (error) {
      console.error('Error checking/deleting existing file:', error);
    }

    // Upload with clean filename
    await blockBlobClient.upload(buffer, buffer.length);

    // Return success response with the URL
    return new Response(JSON.stringify({
      url: blockBlobClient.url,
      fileName: fileName
    }), { status: 200 });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed' 
    }), { status: 500 });
  }
}


export async function GET() {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!connectionString || !containerName) {
      return new Response(JSON.stringify({ error: 'Storage config missing' }), { status: 500 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Define the list of core files
    const coreFiles = [
      { name: 'spectrogram_data.json', client: containerClient.getBlockBlobClient('spectrogram_data.json') },
      { name: 'radar_data_range_fft_data.json', client: containerClient.getBlockBlobClient('radar_data_range_fft_data.json') },
      { name: 'radar_data_range_speed_data.json', client: containerClient.getBlockBlobClient('radar_data_range_speed_data.json') },
      { name: 'radar_data_fft_data.json', client: containerClient.getBlockBlobClient('radar_data_fft_data.json') },
    ];

    // Define the list of batch spectrogram files
    const batchSpectrogramFiles = [
      { name: 'radar_data_spectrogram_batch_1.json', client: containerClient.getBlockBlobClient('radar_data_spectrogram_batch_1.json') },
      { name: 'radar_data_spectrogram_batch_2.json', client: containerClient.getBlockBlobClient('radar_data_spectrogram_batch_2.json') },
      { name: 'radar_data_spectrogram_batch_3.json', client: containerClient.getBlockBlobClient('radar_data_spectrogram_batch_3.json') },
      { name: 'radar_data_spectrogram_batch_4.json', client: containerClient.getBlockBlobClient('radar_data_spectrogram_batch_4.json') },
    ];

    // Combine all files for existence check and download
    const allFiles = [...coreFiles, ...batchSpectrogramFiles];

    // Check existence of all files concurrently
    const existenceChecks = await Promise.all(
      allFiles.map(file => file.client.exists())
    );

    // Filter out files that don't exist
    const existingFiles = allFiles.filter((_, index) => existenceChecks[index]);


    if (existingFiles.length === 0) {
        return new Response(JSON.stringify({ error: 'No data files found in Azure Blob Storage.' }), { status: 404 });
    }

    // Download only the existing files concurrently
    const downloadPromises = existingFiles.map(file => file.client.downloadToBuffer());
    const downloadedBuffers = await Promise.all(downloadPromises);

    // Save files to /public directory
    const saveDir = path.join(process.cwd(), 'public');

    // Create the public directory if it doesn't exist
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    existingFiles.forEach((file, index) => {
      const buffer = downloadedBuffers[index];
      const filePath = path.join(saveDir, file.name);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved ${file.name} to ${filePath}`);
    });

    return new Response(JSON.stringify({
      message: `Successfully downloaded and saved ${existingFiles.length} files to /public/`,
      downloadedFiles: existingFiles.map(f => f.name),
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch or save data' }), { status: 500 });
  }
}

// Your existing RefreshButton component (no changes needed here for the file download logic)
export default function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLastUpdated(new Date());
      
      // You can add state management here for the graphs
      // You might want to trigger a re-render of your BatchAnalysisView
      // if it depends on these newly downloaded files.

    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button 
        onClick={refreshData}
        className="group p-2 rounded-lg hover:bg-slate-700/30 transition-all duration-200"
        title="Refresh data"
        disabled={isRefreshing}
      >
        <svg 
          className={`w-5 h-5 text-slate-400 hover:text-indigo-400 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-300">
          Refresh Data
        </span>
        <span className="text-xs text-slate-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}