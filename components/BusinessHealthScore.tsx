
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { SparklesIcon } from './icons';

export const BusinessHealthScore: React.FC = () => {
    const { files, score, activeAiModule, generateHealthScore } = useAppStore(state => ({
        files: state.documents,
        score: state.healthScore,
        activeAiModule: state.activeAiModule,
        generateHealthScore: state.generateHealthScore,
    }));

    const isLoading = activeAiModule === 'healthScore';
    const isButtonDisabled = files.length === 0 || (activeAiModule !== null && !isLoading);
    
    const parseScore = (text: string | null) => {
        if (!text) return { numeric: null, analysis: null };
        const scoreMatch = text.match(/Score: (\d+)\/100/);
        const numeric = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
        const analysis = text.replace(/Score: \d+\/100\n*/, '');
        return { numeric, analysis };
    };

    const { numeric, analysis } = parseScore(score);

    const getScoreColor = (value: number | null) => {
        if (value === null) return 'text-gray-500';
        if (value >= 90) return 'text-green-400';
        if (value >= 75) return 'text-lime-400';
        if (value >= 60) return 'text-yellow-400';
        if (value >= 40) return 'text-orange-400';
        return 'text-red-500';
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Business Health Score</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                <button
                    onClick={generateHealthScore}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Calculating...' : 'Calculate Health Score'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center text-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                     <div className={`transition-opacity duration-500 w-full ${!isLoading && score ? 'opacity-100' : 'opacity-0'}`}>
                        {score && (
                           <div className="w-full">
                               {numeric !== null && (
                                   <div className="mb-2">
                                       <span className={`text-6xl font-bold ${getScoreColor(numeric)}`}>{numeric}</span>
                                       <span className="text-xl font-semibold text-gray-500 dark:text-accent">/100</span>
                                   </div>
                               )}
                               <div className="prose prose-sm max-w-none w-full dark:prose-invert text-left" style={{ whiteSpace: 'pre-wrap' }}>
                                   {analysis}
                               </div>
                           </div>
                        )}
                    </div>
                    {!isLoading && !score && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {files.length > 0
                                ? "Click the button to calculate the financial health score."
                                : "Upload documents to enable score calculation."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};