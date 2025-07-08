import React, { useState, useCallback } from 'react';
import { AnalysisResult, AppState } from './types';
import { getSpeechAnalysis } from './services/geminiService';
import AudioUploader from './components/AudioUploader';
import AnalysisDisplay from './components/AnalysisDisplay';
import { HeaderIcon, ErrorIcon, UploadIcon, MicIcon } from './components/Icons';

type InputMode = 'upload' | 'record';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setAnalysis(null);
    setError(null);
    setAnalysisTime(null);
    if(selectedFile) {
        setAppState(AppState.IDLE); // Ready to analyze
    }
  };

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setError("Please select or record a file first.");
      return;
    }

    setAppState(AppState.ANALYZING);
    setError(null);
    setAnalysis(null);
    setAnalysisTime(null);

    const startTime = performance.now();
    try {
      const result = await getSpeechAnalysis(file);
      const endTime = performance.now();
      setAnalysisTime(endTime - startTime);
      setAnalysis(result);
      setAppState(AppState.SUCCESS);
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during analysis. Check the console for details.";
      setError(`Analysis Failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  }, [file]);

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setError(null);
    setAnalysisTime(null);
    setAppState(AppState.IDLE);
  };
  
  const ModeButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
        isActive
          ? 'border-brand-primary text-brand-primary dark:text-blue-400 dark:border-blue-400'
          : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-t-md'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <header className="bg-white dark:bg-slate-800/50 shadow-sm sticky top-0 z-10 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <HeaderIcon className="h-8 w-8 text-brand-primary" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                Speech Intelligence AI
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg h-full flex flex-col">
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <ModeButton
                  label="Upload File"
                  icon={<UploadIcon className="h-5 w-5" />}
                  isActive={inputMode === 'upload'}
                  onClick={() => {
                    handleReset();
                    setInputMode('upload');
                  }}
                />
                <ModeButton
                  label="Record Audio"
                  icon={<MicIcon className="h-5 w-5" />}
                  isActive={inputMode === 'record'}
                  onClick={() => {
                    handleReset();
                    setInputMode('record');
                  }}
                />
              </div>
              <div className="p-6 flex-grow">
                 <AudioUploader
                    file={file}
                    onFileChange={handleFileChange}
                    onAnalyze={handleAnalyze}
                    onReset={handleReset}
                    isLoading={appState === AppState.ANALYZING}
                    inputMode={inputMode}
                  />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {appState === AppState.ANALYZING && (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary"></div>
                <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300">Analyzing your speech...</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
              </div>
            )}

            {appState === AppState.ERROR && (
               <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 p-6 rounded-xl shadow-lg h-full min-h-[400px]">
                <ErrorIcon className="h-16 w-16 text-red-500 dark:text-red-400" />
                <p className="mt-4 text-lg font-bold text-red-700 dark:text-red-300">An Error Occurred</p>
                <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400 max-w-md">{error}</p>
             </div>
            )}

            {appState === AppState.SUCCESS && analysis && (
              <AnalysisDisplay analysis={analysis} analysisTime={analysisTime} />
            )}
             {(appState === AppState.IDLE && !analysis) && (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl h-full min-h-[400px]">
                <HeaderIcon className="h-24 w-24 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-300">Your analysis will appear here</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {inputMode === 'upload' ? 'Upload an audio file and click "Analyze" to begin.' : 'Record your speech and click "Analyze" to begin.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;