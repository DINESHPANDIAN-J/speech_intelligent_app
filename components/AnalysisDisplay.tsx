import React, { useState } from 'react';
import { AnalysisResult, AnalysisTab } from '../types';
import { MicIcon, BookTextIcon, TargetIcon, SmileIcon, FileTextIcon, LightbulbIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from './Icons';

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
  analysisTime: number | null;
}

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-brand-primary text-white shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, analysisTime }) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>(AnalysisTab.TRANSCRIPT);

  const renderContent = () => {
    switch (activeTab) {
      case AnalysisTab.TRANSCRIPT:
        return (
            <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-white dark:bg-slate-800 rounded-b-lg">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><FileTextIcon className="w-5 h-5"/> Full Transcript</h3>
                <p className="whitespace-pre-wrap">{analysis.transcript}</p>
            </div>
        );
      case AnalysisTab.SUMMARY:
        return (
            <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-white dark:bg-slate-800 rounded-b-lg">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><BookTextIcon className="w-5 h-5"/> Summary</h3>
                <p>{analysis.summary}</p>
            </div>
        );
      case AnalysisTab.GRAMMAR:
        return (
          <div className="space-y-4 p-6 bg-white dark:bg-slate-800 rounded-b-lg">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4"><TargetIcon className="w-5 h-5"/> Grammar & Fluency Coach</h3>
            {analysis.grammarAnalysis.length === 0 ? (
                <div className="text-center py-8 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto"/>
                    <p className="mt-3 font-semibold text-green-700 dark:text-green-300">Excellent! No issues found.</p>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">Your speech was clear and fluent.</p>
                </div>
            ) : (
                analysis.grammarAnalysis.map((issue, index) => (
                    <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <blockquote className="border-l-4 border-red-500 pl-4 italic text-slate-600 dark:text-slate-400">
                            "{issue.original}"
                        </blockquote>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="flex items-center text-sm font-semibold text-red-600 dark:text-red-400"><XCircleIcon className="w-4 h-4 mr-2"/> Issue: {issue.issue}</h4>
                                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{issue.suggestion}</p>
                            </div>
                            <div>
                                <h4 className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400"><LightbulbIcon className="w-4 h-4 mr-2"/> Tip</h4>
                                <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">{issue.tip}</p>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        );
      case AnalysisTab.SENTIMENT:
        const sentimentColor = {
            Positive: 'text-green-500',
            Negative: 'text-red-500',
            Neutral: 'text-yellow-500',
            Mixed: 'text-purple-500',
        }[analysis.sentiment.label];
        return (
            <div className="p-6 bg-white dark:bg-slate-800 rounded-b-lg">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4"><SmileIcon className="w-5 h-5"/> Sentiment Analysis</h3>
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className={`text-3xl font-bold ${sentimentColor}`}>{analysis.sentiment.label}</p>
                    <p className="mt-3 text-center text-slate-600 dark:text-slate-300 max-w-md">{analysis.sentiment.explanation}</p>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="p-3 bg-slate-100 dark:bg-slate-900/50 rounded-t-xl flex justify-between items-center">
        <div className="flex space-x-2 overflow-x-auto">
          <TabButton icon={<MicIcon className="w-4 h-4" />} label={AnalysisTab.TRANSCRIPT} isActive={activeTab === AnalysisTab.TRANSCRIPT} onClick={() => setActiveTab(AnalysisTab.TRANSCRIPT)} />
          <TabButton icon={<BookTextIcon className="w-4 h-4" />} label={AnalysisTab.SUMMARY} isActive={activeTab === AnalysisTab.SUMMARY} onClick={() => setActiveTab(AnalysisTab.SUMMARY)} />
          <TabButton icon={<TargetIcon className="w-4 h-4" />} label={AnalysisTab.GRAMMAR} isActive={activeTab === AnalysisTab.GRAMMAR} onClick={() => setActiveTab(AnalysisTab.GRAMMAR)} />
          <TabButton icon={<SmileIcon className="w-4 h-4" />} label={AnalysisTab.SENTIMENT} isActive={activeTab === AnalysisTab.SENTIMENT} onClick={() => setActiveTab(AnalysisTab.SENTIMENT)} />
        </div>
        {analysisTime && (
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap pl-4">
                <ClockIcon className="w-3.5 h-3.5 mr-1.5" />
                <span>Analyzed in <span className="font-semibold text-slate-700 dark:text-slate-200">{(analysisTime / 1000).toFixed(1)}s</span></span>
            </div>
        )}
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default AnalysisDisplay;