
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { LightbulbIcon } from './icons';

export const SmartSuggestions: React.FC = () => {
    const { files, suggestions, activeAiModule, generateSuggestions } = useAppStore(state => ({
        files: state.documents,
        suggestions: state.suggestions,
        activeAiModule: state.activeAiModule,
        generateSuggestions: state.generateSuggestions,
    }));

    const isLoading = activeAiModule === 'suggestions';
    const isButtonDisabled = files.length === 0 || (activeAiModule !== null && !isLoading);
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Smart Suggestions & Insights</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                <button
                    onClick={generateSuggestions}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <LightbulbIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Generating...' : 'Generate Suggestions'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && suggestions ? 'opacity-100' : 'opacity-0'}`}>
                        {suggestions && (
                            <div className="prose prose-sm max-w-none dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               {suggestions}
                            </div>
                        )}
                    </div>
                    {!isLoading && !suggestions && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {files.length > 0 
                                ? "Click the button to generate insights from your documents."
                                : "Upload documents to enable suggestions."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};