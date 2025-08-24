
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { TrendingUpIcon } from './icons';

export const ScenarioPlanner: React.FC = () => {
    const { 
        files, 
        scenario, 
        setScenario, 
        analysis, 
        activeAiModule, 
        generateScenarioAnalysis 
    } = useAppStore(state => ({
        files: state.documents,
        scenario: state.scenario,
        setScenario: state.setScenario,
        analysis: state.scenarioAnalysis,
        activeAiModule: state.activeAiModule,
        generateScenarioAnalysis: state.generateScenarioAnalysis,
    }));
    
    const isLoading = activeAiModule === 'scenario';
    const isButtonDisabled = files.length === 0 || (activeAiModule !== null && !isLoading);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setScenario({
            ...scenario,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">"What-If" Scenario Planner</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="changeType" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Action</label>
                            <select id="changeType" name="changeType" value={scenario.changeType} onChange={handleInputChange} className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm">
                                <option>Increase</option>
                                <option>Decrease</option>
                            </select>
                        </div>
                        <div>
                             <label htmlFor="metric" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Metric</label>
                            <select id="metric" name="metric" value={scenario.metric} onChange={handleInputChange} className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm">
                                <option>Overall Revenue</option>
                                <option>Overall Expenses</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="value" className="block text-xs font-medium text-gray-700 dark:text-gray-300">By</label>
                            <input
                                type="number"
                                id="value"
                                name="value"
                                value={scenario.value}
                                onChange={handleInputChange}
                                className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="valueType" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Unit</label>
                            <select id="valueType" name="valueType" value={scenario.valueType} onChange={handleInputChange} className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm">
                                <option>Percentage</option>
                                <option>Amount</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={generateScenarioAnalysis}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <TrendingUpIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Analyzing...' : 'Run Scenario Analysis'}</span>
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
                                ? "Define a scenario and click the button to see its potential impact."
                                : "Upload documents to enable scenario planning."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};