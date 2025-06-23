'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const router = useRouter();


  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      isActive: true
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'signals',
      label: 'Signal Processing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'targets',
      label: 'Target Tracking',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-[280px] min-h-screen fixed left-0 top-[80px] z-40"
         style={{ 
           background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
           backdropFilter: 'blur(20px)',
           borderRight: '1px solid rgba(148, 163, 184, 0.1)'
         }}>
      
      {/* Welcome Section */}
      <div className="px-6 py-8 border-b border-slate-700/50">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">System Active</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight">
            Welcome back,
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">
              Aliff
            </span>
            <div className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30">
              <span className="text-xs font-medium text-blue-300">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">24.5GHz</div>
            <div className="text-xs text-slate-400">Frequency</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">Online</div>
            <div className="text-xs text-slate-400">Status</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-4">
            Navigation
          </h3>
          <nav>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                    setActiveItem(item.id);
                      if (item.id === 'analysis') {
                        router.push('/analysis'); // navigate when Analysis clicked
                      }
                    }}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                      activeItem === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`mr-3 transition-transform duration-300 ${
                      activeItem === item.id ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {activeItem === item.id && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        
        {/* Quick Stats */}
        <div className="mt-8 p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-semibold text-white mb-3">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Targets Detected</span>
              <span className="text-sm font-bold text-cyan-400">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Signal Strength</span>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-green-400">85%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Processing Load</span>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xs font-medium text-blue-400">45%</span>
              </div>
            </div>
          </div>
        </div>

     

      </div>
    </div>
  );
}