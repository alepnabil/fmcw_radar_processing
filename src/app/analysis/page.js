'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import FileUpload from '../../../components/uploadbutton';
import ProcessButton from '../../../components/processbutton';
import RefreshButton from '../../../components/refreshbutton';
import Sidebar from '../../../components/sidebar';
import Spectrogram from '../../../components/spectrogram';
import NoSSR from '../../../components/NoSSR';
import LoadingSpinner from '../../../components/LoadingSpinner';

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

const MAX_BATCHES = 4;

export default function SpectrogramAnalysisPage() {
  const [spectrograms, setSpectrograms] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    async function loadBatchSpectrograms() {
      const loaded = [];

      for (let i = 1; i <= MAX_BATCHES; i++) {
        try {
          const response = await fetch(`/radar_data_spectrogram_batch_${i}.json`);
          if (!response.ok) throw new Error(`Failed to load batch ${i}`);
          const json = await response.json();
          loaded.push(json);
        } catch (err) {
          console.warn(`Batch ${i} not found or failed to load.`);
          break; // stop trying further batches if one is missing
        }
      }

      setSpectrograms(loaded);
      setLoading(false);
    }

    loadBatchSpectrograms();
  }, []);


  if (loading) return <LoadingSpinner />;

  return (
    <NoSSR>
      <div className={`min-h-screen ${poppins.variable} ${inter.variable} ${jetbrains.variable}`}
           style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)' }}>

        {/* Top Navbar */}
        <div className="fixed top-0 left-0 w-[280px] z-[60] px-6 py-5 border-b border-slate-700/50"
             style={{ 
               background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
               backdropFilter: 'blur(20px)',
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
               borderRight: '1px solid rgba(148, 163, 184, 0.1)'
             }}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <svg width="16" height="16" viewBox="0 0 16 16" className="absolute">
                <circle cx="8" cy="8" r="2" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" className="radar-pulse"/>
                <circle cx="8" cy="8" r="4" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                <circle cx="8" cy="8" r="6" fill="none" stroke="white" strokeWidth="0.5" opacity="0.2"/>
              </svg>
              <svg width="16" height="16" viewBox="0 0 16 16" className="absolute radar-sweep">
                <line x1="8" y1="8" x2="8" y2="2" stroke="white" strokeWidth="1" opacity="0.8"/>
              </svg>
              <div className="w-1 h-1 rounded-full bg-white/80 absolute"></div>
            </div>
            <div>
              <h1 className="font-inter text-xl font-bold text-white tracking-tight">
                RawrDar <span className="font-mono text-sm font-medium text-blue-400 ml-1">24.5</span>
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">BETA</span>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Navigation */}
        <nav className="fixed top-0 left-[280px] right-0 border-b border-slate-700/50 z-50"
             style={{ 
               background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)',
               backdropFilter: 'blur(20px)'
             }}>
          <div className="container mx-auto px-8 py-5.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                  Spectrogram Batch Analysis
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <FileUpload />
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar and Spectrogram Grid */}
        <div className="flex pt-[80px]">
          <Sidebar />
          <main className="flex-1 ml-[280px] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spectrograms.map((spec, index) => (
                <div key={index} className="bg-slate-800 rounded-xl p-4 border border-slate-700/50 shadow-lg">
                  <h2 className="text-lg font-bold text-white mb-3">Batch {index + 1} Spectrogram</h2>
                  <Spectrogram
                    time={spec.time}
                    frequency={spec.frequency}
                    intensity={spec.intensity}
                  />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </NoSSR>
  );
}
