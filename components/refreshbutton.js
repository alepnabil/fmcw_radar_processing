'use client';

import { useState } from 'react';

export default function RefreshButton({ onRefreshComplete }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Just trigger the parent refresh logic
      await onRefreshComplete?.();

      // Update timestamp on success
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button 
        onClick={handleRefresh}
        className="group p-2 rounded-lg hover:bg-slate-700/30 transition-all duration-200"
        title="Refresh data"
        disabled={isRefreshing}
      >
        <svg 
          className={`w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
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
