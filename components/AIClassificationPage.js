// components/AIClassificationPage.js
'use client';

import React, { useState, useRef, useEffect } from 'react';

const AIClassificationPage = ({ theme }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'VGG16-based Classification System initialized. Ready to classify spectrograms as Human, Calf, or Bees with 98% accuracy.',
      timestamp: new Date()
    }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Optimized API call function
  const classifySpectrogram = async () => {
    try {
      const requestBody = { image_filename: "spectrogram.png" };

      console.log('🚀 Sending classification request via Next.js API route');

      // Optimized fetch with shorter timeout and no extra headers
      const response = await fetch('/api/ai_classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('🤖 Classification result:', result);
      
      return result;

    } catch (error) {
      console.error('❌ API Error:', error.message);
      throw new Error(error.message.includes('fetch') ? 'Connection failed' : error.message);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type.startsWith('image/') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg'))) {
      setSelectedFile(file);
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: `Selected file: ${file.name}`,
        file: file,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
    } else {
      alert('Please select a valid image file (PNG, JPG, JPEG)');
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    // Add analyzing message with API info
    const analyzingMessage = {
      id: Date.now(),
      type: 'system',
      content: 'Connecting to VGG16 classification model and analyzing current spectrogram data...',
      timestamp: new Date(),
      isAnalyzing: true
    };

    setMessages(prev => [...prev, analyzingMessage]);

    // Retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Call the real API (no file parameter needed)
        const result = await classifySpectrogram();
        
        // Remove analyzing message and add result
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isAnalyzing);
          return [...filtered, {
            id: Date.now(),
            type: 'ai',
            content: 'Classification complete!',
            result: result,
            timestamp: new Date()
          }];
        });

        setIsAnalyzing(false); // Stop analyzing immediately after success
        return; // Success, exit function

      } catch (error) {
        retryCount++;
        console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
        
        if (retryCount < maxRetries) {
          // Wait 2 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update message to show retry
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.isAnalyzing);
            return [...filtered, {
              id: Date.now(),
              type: 'system',
              content: `Connection failed. Retrying... (Attempt ${retryCount + 1}/${maxRetries})`,
              timestamp: new Date(),
              isAnalyzing: true
            }];
          });
        } else {
          // Final failure after all retries
          setMessages(prev => {
            const filtered = prev.filter(msg => !msg.isAnalyzing);
            return [...filtered, {
              id: Date.now(),
              type: 'error',
              content: `❌ Classification failed after ${maxRetries} attempts. Please try again.`,
              timestamp: new Date()
            }];
          });
          setIsAnalyzing(false); // Stop analyzing on final failure
        }
      }
    }
  };

  const getClassIcon = (className) => {
    const icons = {
      human: '👤',
      calf: '🐄',
      bees: '🐝',
      unknown: '❓'
    };
    return icons[className] || '📊';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    if (confidence >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 70) return 'Medium Confidence';
    if (confidence >= 50) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></div>
              <h3 className="text-xl font-bold text-white">AI Object Classification</h3>
              <span className="text-sm text-slate-400 font-mono">Neural Network Analysis</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                <span className="text-xs text-purple-300 font-medium">AI Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 bg-gradient-to-r from-slate-800/30 to-slate-700/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">98%</div>
              <div className="text-xs text-slate-400">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">3</div>
              <div className="text-xs text-slate-400">Object Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">VGG16</div>
              <div className="text-xs text-slate-400">Base Architecture</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">384</div>
              <div className="text-xs text-slate-400">Training Images</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">VGG16 Classification Assistant</h4>
                  <p className="text-sm text-slate-400">Click "Classify with AI" to analyze current spectrogram data</p>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : message.type === 'ai'
                      ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30'
                      : message.type === 'error'
                      ? 'bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/30'
                      : 'bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600/30'
                  }`}>
                    
                    {message.type === 'ai' && message.result ? (
                      // AI Classification Result
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getClassIcon(message.result.predicted_class)}</span>
                          <div>
                            <h5 className="text-lg font-bold text-white capitalize">
                              {message.result.predicted_class}
                            </h5>
                            <p className="text-sm text-slate-300">{message.result.message}</p>
                          </div>
                        </div>
                        
                        <div className="bg-black/20 rounded-lg p-3 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300 font-medium">Confidence Level : </span>
                            <span className={`text-sm font-bold ${getConfidenceColor(message.result.confidence)}`}>
                              {getConfidenceLabel(message.result.confidence)}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="w-full bg-slate-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-1000 ${
                                  message.result.confidence >= 90 ? 'bg-green-400' :
                                  message.result.confidence >= 70 ? 'bg-yellow-400' :
                                  message.result.confidence >= 50 ? 'bg-orange-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${message.result.confidence}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>0%</span>
                              <span className="font-mono font-bold text-white text-sm">
                                {message.result.confidence.toFixed(1)}%
                              </span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 bg-slate-800/50 rounded px-2 py-1 font-mono">
                          File: {message.result.filename}
                        </div>
                      </div>
                    ) : (
                      // Regular Message
                      <div>
                        <p className="text-white">{message.content}</p>
                        {message.file && (
                          <div className="mt-2 text-xs text-slate-300 bg-black/20 rounded px-2 py-1 font-mono">
                            📎 {message.file.name} ({(message.file.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                        {message.isAnalyzing && (
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-blue-400">Processing...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-400 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
              <div className="flex items-center justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium text-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Current Spectrogram...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Classify with AI</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-center">Ready to classify current radar spectrogram data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          {/* Training Dataset - Now First */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20">
              <h4 className="text-lg font-bold text-white">Training Dataset</h4>
              <p className="text-xs text-slate-400 mt-1">Binary classification model training data</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <span className="text-white font-medium">Human</span>
                    <div className="text-xs text-slate-400">Spectrograms</div>
                  </div>
                </div>
                <span className="text-blue-400 text-lg font-bold">192</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🐄</span>
                  <div>
                    <span className="text-white font-medium">Calf</span>
                    <div className="text-xs text-slate-400">Spectrograms</div>
                  </div>
                </div>
                <span className="text-blue-400 text-lg font-bold">192</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg opacity-60">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🐝</span>
                  <div>
                    <span className="text-white font-medium">Bees</span>
                    <div className="text-xs text-slate-400">Future expansion</div>
                  </div>
                </div>
                <span className="text-yellow-400 text-sm font-medium">Coming Soon</span>
              </div>
            </div>
          </div>

          {/* Model Information - Now Second - Minimized */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
              <h4 className="text-lg font-bold text-white">Model Architecture</h4>
              <p className="text-xs text-slate-400 mt-1">VGG16-based transfer learning</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-white font-bold">VGG16</div>
                  <div className="text-xs text-slate-400">Base Model</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                  <div className="text-white font-bold">Binary</div>
                  <div className="text-xs text-slate-400">Classification</div>
                </div>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                <div className="text-white font-medium">Dense(256) + Dropout(0.5)</div>
                <div className="text-xs text-slate-400">Custom Layers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIClassificationPage;