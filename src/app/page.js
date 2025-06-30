// src/app/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import "../../src/app/globals.css"; // Ensure this path is correct relative to page.js

// Import the necessary components
import FileUpload from '../../components/uploadbutton';
import ProcessButton from '../../components/processbutton'; // Keep this import
import RefreshButton from '../../components/refreshbutton';
import Sidebar from '../../components/sidebar';

const LoadingSpinner = dynamic(() => import('../../components/LoadingSpinner'), { ssr: false });
const NoSSR = dynamic(() => import('../../components/NoSSR'), { ssr: false });

// Dashboard-specific plots
const Spectrogram = dynamic(() => import("../../components/spectrogram"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangeFFT = dynamic(() => import("../../components/range_fft"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangeSpeedPlot = dynamic(() => import("../../components/range_speed"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangePlot = dynamic(() => import("../../components/rangePlot"), { ssr: false, loading: () => <LoadingSpinner /> });
const SpeedPlot = dynamic(() => import("../../components/speedPlot"), { ssr: false, loading: () => <LoadingSpinner /> });
const FFTPlot = dynamic(() => import('../../components/fft'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

// New component for Batch Spectrograms
const BatchAnalysisView = dynamic(() => import('../../components/BatchAnalysisView').then(mod => mod.BatchAnalysisView), { // Ensure this is correct based on BatchAnalysisView's export
  ssr: false,
  loading: () => <LoadingSpinner />,
});


import { Inter, Poppins, JetBrains_Mono } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-mono',
});

export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: {
      main: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
      borderRight: '1px solid rgba(148, 163, 184, 0.1)',
      backdropFilter: 'blur(20px)',
      card: 'rgba(15, 23, 42, 0.8)',
      cardHover: 'rgba(30, 41, 59, 0.9)',
      glass: 'rgba(255, 255, 255, 0.03)'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      muted: '#94a3b8',
      accent: '#60a5fa'
    },
    border: {
      primary: 'rgba(148, 163, 184, 0.12)',
      secondary: 'rgba(59, 130, 246, 0.2)',
      glow: 'rgba(59, 130, 246, 0.4)'
    }
  },
  chart: {
    colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b']
  }
};

export default function Home() {
  const [data, setData] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  // State for current page, default to 'dashboard'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showSpectrogramGenerator, setShowSpectrogramGenerator] = useState(false); // Kept for future use if needed within Dashboard content

  const chartConfig = {
    title: {
      font: {
        family: 'Inter',
        size: 16,
        color: theme.colors.text.secondary,
        weight: 600
      }
    },
    xaxis: {
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.08)',
      tickfont: { family: 'Inter', color: theme.colors.text.muted, size: 11 },
      titlefont: { family: 'Inter', color: theme.colors.text.secondary, size: 13, weight: 500 },
      linecolor: 'transparent',
      zeroline: false
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.08)',
      tickfont: { family: 'Inter', color: theme.colors.text.muted, size: 11 },
      titlefont: { family: 'Inter', color: theme.colors.text.secondary, size: 13, weight: 500 },
      linecolor: 'transparent',
      zeroline: false
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    margin: { l: 50, r: 30, t: 30, b: 50 }
  };
  
  const loadData = async () => {
    try {
      // Fetch core data files from public directory
      const [rangeRes, spectrogramRes, speedDistanceRes, fftRes] = await Promise.all([
        fetch(`/radar_data_range_fft_data.json`),
        fetch(`/spectrogram_data.json`),
        fetch(`/radar_data_range_speed_data.json`),
        fetch(`/radar_data_fft_data.json`),
      ]);

      const [rangeData, spectrogramData, speedDistanceData, fftData] = await Promise.all([
        rangeRes.json(),
        spectrogramRes.json(),
        speedDistanceRes.json(),
        fftRes.json(),
      ]);

      // Fetch batch spectrogram files from public directory
      const batchSpectrograms = {};
      const batchPromises = [];
      for (let i = 1; i <= 4; i++) {
        batchPromises.push(
          fetch(`/radar_data_spectrogram_batch_${i}.json`)
            .then(res => {
              if (res.ok) {
                return res.json().then(data => ({ [`batch_${i}`]: data }));
              } else {
                console.warn(`Initial load: Batch file radar_data_spectrogram_batch_${i}.json not found or could not be fetched.`);
                return { [`batch_${i}`]: null };
              }
            })
            .catch(error => {
              console.warn(`Initial load: Error fetching radar_data_spectrogram_batch_${i}.json:`, error);
              return { [`batch_${i}`]: null };
            })
        );
      }
      const resolvedBatchData = await Promise.all(batchPromises);
      resolvedBatchData.forEach(item => {
        Object.assign(batchSpectrograms, item);
      });

      const debug = {
        spectrogram: {
          dimensions: {
            time: spectrogramData.time?.length,
            frequency: spectrogramData.frequency?.length,
            intensity: `${spectrogramData.intensity?.length}x${spectrogramData.intensity?.[0]?.length}`
          },
        },
        fft: {
          freqLength: fftData.range_bins?.length || fftData.freq?.length,
          magnitudeLength: fftData.magnitude?.length,
        }
      };
      setDebugInfo(debug);

      setData({
        range: rangeData,
        spectrogram: spectrogramData,
        speedDistance: {
          timeAxis: speedDistanceData.time_axis,
          rangeData: speedDistanceData.range,
          speedData: speedDistanceData.speed
        },
        fft: {
          freq: fftData.range_bins || fftData.freq,
          magnitude: fftData.magnitude,
          filename: fftData.filename
        },
        batchSpectrograms: batchSpectrograms // Add batch data here
      });

    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      setDebugInfo({ error: error.message });
    }
  };


  const handleGenerateSpectrogram = () => {
    setShowSpectrogramGenerator(true); // This will only affect if SpectrogramImageGenerator is rendered
  };

  useEffect(() => {
    // Only load data if we are on the dashboard page and data hasn't been loaded yet
    // This function loads all data, including batch spectrograms
    if (currentPage === 'dashboard' && !data) {
        loadData();
    }
    // If we switch to 'analysis' and data is null (e.g., direct navigation), load all data
    if (currentPage === 'analysis' && !data) {
        loadData();
    }
  }, [currentPage, data]); // Re-run effect if currentPage changes or data is not yet loaded

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Always fetch the core files
      const [rangeRes, spectrogramRes, speedDistanceRes, fftRes] = await Promise.all([
        fetch(`/radar_data_range_fft_data.json`),
        fetch(`/spectrogram_data.json`),
        fetch(`/radar_data_range_speed_data.json`),
        fetch(`/radar_data_fft_data.json`)
      ]);

      const [rangeData, spectrogramData, speedDistanceData, fftData] = await Promise.all([
        rangeRes.json(),
        spectrogramRes.json(),
        speedDistanceRes.json(),
        fftRes.json()
      ]);

      // --- New: Fetch batch spectrogram files ---
      const batchSpectrograms = {};
      for (let i = 1; i <= 4; i++) {
        try {
          const batchRes = await fetch(`/radar_data_spectrogram_batch_${i}.json`);
          if (batchRes.ok) {
            batchSpectrograms[`batch_${i}`] = await batchRes.json();
            console.log(`Successfully fetched radar_data_spectrogram_batch_${i}.json`);
          } else {
            console.warn(`Batch file radar_data_spectrogram_batch_${i}.json not found or could not be fetched.`);
          }
        } catch (batchError) {
          console.warn(`Error fetching radar_data_spectrogram_batch_${i}.json:`, batchError);
        }
      }
      // --- End new batch fetch ---


      const debug = {
        spectrogram: {
          dimensions: {
            time: spectrogramData.time?.length,
            frequency: spectrogramData.frequency?.length,
            intensity: `${spectrogramData.intensity?.length}x${spectrogramData.intensity?.[0]?.length}`
          }
        },
        fft: {
          bins: fftData?.range_bins?.length || fftData?.freq?.length,
          magnitude: fftData?.magnitude?.length
        }
      };

      setDebugInfo(debug);

      setData({
        range: rangeData,
        spectrogram: spectrogramData,
        speedDistance: {
          timeAxis: speedDistanceData.time_axis,
          rangeData: speedDistanceData.range,
          speedData: speedDistanceData.speed
        },
        fft: {
          freq: fftData.range_bins || fftData.freq,
          magnitude: fftData.magnitude,
          filename: fftData.filename || null
        },
        // --- New: Add batch spectrograms to data state ---
        batchSpectrograms: batchSpectrograms 
        // --- End new batch data ---
      });

    } catch (error) {
      console.error("Error refreshing data:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  // Function to render Dashboard content
  const renderDashboardContent = () => {
    if (!data) return <LoadingSpinner />;
    return (
      <>
        <div className="mb-8">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-4">
              {isRefreshing && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Refreshing...</span>
                </div>
              )}
              <span className="text-xs text-slate-400 font-medium">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              {/* The RefreshButton component now internally calls refreshData on click */}
              <RefreshButton onRefreshComplete={refreshData} /> 
              {/* Pass processAnimalActivity as 'no' for Dashboard */}
              <ProcessButton processAnimalActivityValue="no" /> 
            </div>
          </div>
        </div>

        {/* Enhanced Grid Layout */}
        <div className="space-y-8">
          {/* Primary Analysis Section */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <h3 className="text-xl font-bold text-white">Range FFT Analysis</h3>
                  <span className="text-sm text-slate-400 font-mono">Primary Signal Processing</span>
                </div>
              </div>
              <div className="p-6">
                <RangeFFT
                  timeAxis={data.range.time_axis}
                  rangeBins={data.range.array_bin_range}
                  rangeData={data.range.range_tx1rx1_max_abs}
                  layout={chartConfig}
                />
              </div>
            </div>
          </div>

          {/* Secondary Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FFT Spectrum */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <h3 className="text-lg font-bold text-white">FFT Spectrum</h3>
                </div>
                <p className="text-sm text-slate-400 mt-1">Frequency Domain Analysis</p>
              </div>
              <div className="p-4">
                {data?.fft && (
                  <FFTPlot
                    freqAxis={data.fft.range_bins || data.fft.freq}
                    fftMagnitude={data.fft.magnitude}
                    title="Fast Fourier Transform Spectrum"
                  />
                )}
              </div>
            </div>

            {/* Speed Analysis */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <h3 className="text-lg font-bold text-white">Target Speed</h3>
                </div>
                <p className="text-sm text-slate-400 mt-1">Velocity Tracking (m/s)</p>
              </div>
              <div className="p-4">
                <SpeedPlot
                  timeAxis={data.speedDistance.timeAxis}
                  speedData={data.speedDistance.speedData}
                  layout={chartConfig}
                />
              </div>
            </div>

            {/* Range Analysis */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <h3 className="text-lg font-bold text-white">Target Range</h3>
                </div>
                <p className="text-sm text-slate-400 mt-1">Distance Measurement (m)</p>
              </div>
              <div className="p-4">
                <RangePlot
                  timeAxis={data.speedDistance.timeAxis}
                  rangeData={data.speedDistance.rangeData}
                  layout={{
                    ...chartConfig,
                    xaxis: {
                      ...chartConfig.xaxis,
                      title: { text: 'Time (s)', font: chartConfig.xaxis.titlefont }
                    },
                    yaxis: {
                      ...chartConfig.yaxis,
                      title: { text: 'Range (m)', font: chartConfig.yaxis.titlefont }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Spectrogram Section */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
              style={{ boxShadow: '0 16px 64px rgba(0, 0, 0, 0.3)' }}>
              <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-emerald-900/20 to-teal-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h3 className="text-xl font-bold text-white">Time-Frequency Analysis</h3>
                    <span className="text-sm text-slate-400 font-mono">Spectrogram Visualization</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <span>Time Domain</span>
                    <div className="w-1 h-1 rounded-full bg-slate-500"></div>
                    <span>Frequency Domain</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <Spectrogram
                  time={data.spectrogram.time}
                  frequency={data.spectrogram.frequency}
                  intensity={data.spectrogram.intensity}
                  // You might need to add chartConfig here if Spectrogram component uses it
                  // chartConfig={chartConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // New function to render Analysis page header with Process Button AND Refresh Button
  const renderAnalysisPageHeader = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-4">
              {isRefreshing && ( // Show refreshing status for Analysis page
                <div className="flex items-center space-x-2 text-blue-400">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Refreshing...</span>
                </div>
              )}
              <span className="text-xs text-slate-400 font-medium"> {/* Show last updated timestamp for Analysis page */}
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            {/* The RefreshButton component now internally calls refreshData on click */}
            <RefreshButton onRefreshComplete={refreshData} /> {/* Added RefreshButton */}
            {/* Pass processAnimalActivity as 'yes' for Analysis page */}
            <ProcessButton processAnimalActivityValue="yes" /> 
          </div>
        </div>
      </div>
    );
  };


  return (
    <NoSSR>
      <div className={`min-h-screen ${poppins.variable} ${inter.variable} ${jetbrains.variable}`}
        style={{ background: theme.colors.background.main }}>
        <style jsx>{`
          .radar-sweep {
            animation: radar-sweep 2s linear infinite;
            transform-origin: center;
          }
          @keyframes radar-sweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .radar-pulse {
            animation: radar-pulse 2s ease-in-out infinite;
            }
          @keyframes radar-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
        `}</style>

        {/* Top Fixed Header */}
        <div className="fixed top-0 left-0 w-[280px] z-[60] px-6 py-5 border-b border-slate-700/50"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            borderRight: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              {/* Radar circles */}
              <svg width="16" height="16" viewBox="0 0 16 16" className="absolute">
                <circle cx="8" cy="8" r="2" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" className="radar-pulse" />
                <circle cx="8" cy="8" r="4" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
                <circle cx="8" cy="8" r="6" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2" />
              </svg>
              {/* Radar sweep line */}
              <svg width="16" height="16" viewBox="0 0 16 16" className="absolute radar-sweep">
                <line x1="8" y1="8" x2="8" y2="2" stroke="white" strokeWidth="1" opacity="0.8" />
              </svg>
              {/* Center dot */}
              <div className="w-1 h-1 rounded-full bg-white/80 absolute"></div>
            </div>
            <div>
              <h1 className="font-inter text-xl font-bold text-white tracking-tight">
                RawrDar
                <span className="font-mono text-sm font-medium text-blue-400 ml-1">24.5</span>
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                  BETA
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <nav className="fixed top-0 left-[280px] right-0 border-b border-slate-700/50 z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
            backdropFilter: 'blur(20px)'
          }}>
          <div className="container mx-auto px-8 py-5.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-2xl font-semibold text-white tracking-tight">
                    Radar Analysis Dashboard
                  </h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-yellow-400 font-medium">Developed by Aliff</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FileUpload />
              </div>
            </div>
          </div>
        </nav>

        <div className="flex pt-[80px]">
          <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

          <main className="flex-1 ml-[280px] p-8">
            <div className="max-w-[1800px] mx-auto">
              {currentPage === 'dashboard' && renderDashboardContent()}
              {currentPage === 'analysis' && (
                <>
                  {renderAnalysisPageHeader()} {/* Added the header for Analysis page */}
                  {/* Pass batchSpectrograms data to BatchAnalysisView */}
                  <BatchAnalysisView 
                    theme={theme} 
                    SpectrogramComponent={Spectrogram} 
                    batchSpectrograms={data?.batchSpectrograms || {}} // Pass the fetched batch data
                  />
                </>
              )}
              {/* Add other pages here based on currentPage */}
            </div>
          </main>
        </div>


      </div>
    </NoSSR>
  );
}