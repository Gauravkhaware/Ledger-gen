
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ChartPieIcon } from './icons';

export const ProfitabilityAnalysis: React.FC = () => {
    const { files, analysis, activeAiModule, generateProfitabilityAnalysis } = useAppStore(state => ({
        files: state.documents,
        analysis: state.profitabilityAnalysis,
        activeAiModule: state.activeAiModule,
        generateProfitabilityAnalysis: state.generateProfitabilityAnalysis,
    }));

    const isLoading = activeAiModule === 'profitability';
    const isButtonDisabled = files.length === 0 || (activeAiModule !== null && !isLoading);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Profitability Analysis</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                <button
                    onClick={generateProfitabilityAnalysis}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <ChartPieIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Analyzing...' : 'Analyze by Customer/Product'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && analysis ? 'opacity-100' : 'opacity-0'}`}>
                        {analysis && (
                            <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               {analysis}
                            </div>
                        )}
                    </div>
                    {!isLoading && !analysis && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {files.length > 0 
                                ? "Click the button to analyze profitability from your documents."
                                : "Upload sales data to enable profitability analysis."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};