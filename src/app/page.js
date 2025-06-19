'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import "../../src/app/globals.css";
import FileUpload from '../../components/uploadbutton';
import ProcessButton from '../../components/processbutton';
import RefreshButton from '../../components/refreshbutton';
import Sidebar from '../../components/sidebar';

const LoadingSpinner = dynamic(() => import('../../components/LoadingSpinner'), { ssr: false });
const NoSSR = dynamic(() => import('../../components/NoSSR'), { ssr: false });

const Spectrogram = dynamic(() => import("../../components/spectrogram"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangeFFT = dynamic(() => import("../../components/range_fft"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangeSpeedPlot = dynamic(() => import("../../components/range_speed"), { ssr: false, loading: () => <LoadingSpinner /> });
const RangePlot = dynamic(() => import("../../components/rangePlot"), { ssr: false, loading: () => <LoadingSpinner /> });
const SpeedPlot = dynamic(() => import("../../components/speedPlot"), { ssr: false, loading: () => <LoadingSpinner /> });

import { Inter, Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#22d3ee',
    background: {
      main: '#0f172a',
      card: 'rgba(30, 41, 59, 0.5)'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b'
    },
    border: 'rgba(148, 163, 184, 0.1)'
  },
  chart: {
    colors: ['#6366f1', '#22d3ee', '#f472b6']
  }
};

export default function Home() {
  const [data, setData] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const chartConfig = {
    title: {
      font: {
        family: 'Inter',
        size: 15,
        color: theme.colors.text.secondary,
        weight: 500
      }
    },
    xaxis: {
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { family: 'Inter', color: theme.colors.text.muted, size: 11 },
      titlefont: { family: 'Inter', color: theme.colors.text.secondary, size: 12 },
      linecolor: 'transparent'
    },
    yaxis: {
      showgrid: true,
      gridcolor: 'rgba(148, 163, 184, 0.1)',
      tickfont: { family: 'Inter', color: theme.colors.text.muted, size: 11 },
      titlefont: { family: 'Inter', color: theme.colors.text.secondary, size: 12 },
      linecolor: 'transparent'
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    margin: { l: 40, r: 20, t: 20, b: 40 }
  };

  const loadData = async () => {
    try {
      const [rangeData, spectrogramData, speedDistanceData] = await Promise.all([
        import("./range_fft_data.json"),
        import("./spectrogram_data.json"),
        import("./range_speed_data.json"),
      ]);

      const debug = {
        spectrogram: {
          dimensions: {
            time: spectrogramData.default.time?.length,
            frequency: spectrogramData.default.frequency?.length,
            intensity: `${spectrogramData.default.intensity?.length}x${spectrogramData.default.intensity?.[0]?.length}`
          },
        }
      };
      setDebugInfo(debug);

      setData({
        range: rangeData.default,
        spectrogram: spectrogramData.default,
        speedDistance: {
          timeAxis: speedDistanceData.default.time_axis,
          rangeData: speedDistanceData.default.range,
          speedData: speedDistanceData.default.speed
        }
      });
    } catch (error) {
      console.error("Error loading initial data:", error);
      setDebugInfo({ error: error.message });
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [rangeRes, spectrogramRes, speedDistanceRes] = await Promise.all([
        fetch(`/radar_data_range_fft_data.json`),
        fetch(`/spectrogram_data.json`),
        fetch(`/radar_data_range_speed_data.json`)
      ]);

      const [rangeData, spectrogramData, speedDistanceData] = await Promise.all([
        rangeRes.json(),
        spectrogramRes.json(),
        speedDistanceRes.json()
      ]);

      const debug = {
        spectrogram: {
          dimensions: {
            time: spectrogramData.time?.length,
            frequency: spectrogramData.frequency?.length,
            intensity: `${spectrogramData.intensity?.length}x${spectrogramData.intensity?.[0]?.length}`
          }
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
        }
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) return <LoadingSpinner />;

  return (
    <NoSSR>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 pt-[64px]">
        {/* Fixed left-top header above sidebar */}
        <div className="fixed top-0 left-0 w-[280px] bg-slate-900/90 z-[60] px-6 py-4 border-b border-slate-800">
          <h1 className="font-inter text-xl font-semibold text-white">
            RawrDar-24.5
            <span className="ml-2 text-xs font-medium px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">BETA</span>
          </h1>
        </div>

        {/* Top Navbar */}
        <nav className="fixed top-0 left-[280px] right-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div />
              <div className="flex items-center space-x-4">
                <FileUpload />
              </div>
            </div>
          </div>
        </nav>

        <div className="flex pt-14">
          <Sidebar />
          <main className="flex-1 ml-[280px]">
            <div className="max-w-[1600px] mx-auto px-20">
              <div className="flex items-center justify-between mb-8 pt-8">
                <div>
                  <h2 className="font-inter text-2xl font-bold text-white">
                    Radar Analysis Dashboard
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Real-time monitoring and analysis of radar signals
                  </p>
                </div>
                <div className="flex items-center space-x-4 h-12">
                  <RefreshButton onRefreshComplete={refreshData} />
                  <ProcessButton />
                </div>
              </div>

              {/* Plots */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-navy-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Target Speed</h3>
                    <p className="text-sm text-slate-400 mb-4">m/s</p>
                    <SpeedPlot
                      timeAxis={data.speedDistance.timeAxis}
                      speedData={data.speedDistance.speedData}
                      layout={chartConfig}
                    />
                  </div>
                  <div className="bg-navy-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Target Range</h3>
                    <p className="text-sm text-slate-400 mb-4">meters</p>
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

                <div className="col-span-2 bg-navy-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Time-Frequency Analysis</h3>
                  <p className="text-sm text-slate-400 mb-4">Spectral power distribution over time</p>
                  <Spectrogram
                    time={data.spectrogram.time}
                    frequency={data.spectrogram.frequency}
                    intensity={data.spectrogram.intensity}
                  />
                </div>

                <div className="col-span-2 bg-navy-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Range FFT Analysis</h3>
                  <p className="text-sm text-slate-400 mb-4">Signal strength</p>
                  <RangeFFT
                    timeAxis={data.range.time_axis}
                    rangeBins={data.range.array_bin_range}
                    rangeData={data.range.range_tx1rx1_max_abs}
                    layout={chartConfig}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </NoSSR>
  );
}
