
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CalendarDaysIcon } from './icons';

interface ComplianceCalendarProps {}

const commonDeadlines = [
    { name: 'GSTR-1 Filing', day: '11th', frequency: 'of next month' },
    { name: 'GSTR-3B Filing', day: '20th', frequency: 'of next month' },
    { name: 'TDS Payment', day: '7th', frequency: 'of next month' },
    { name: 'Advance Tax (Quarterly)', day: '15th', frequency: 'of Jun, Sep, Dec, Mar' },
];

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = () => {
    const { files, deadlines, activeAiModule, generateComplianceDeadlines } = useAppStore(state => ({
        files: state.documents,
        deadlines: state.complianceDeadlines,
        activeAiModule: state.activeAiModule,
        generateComplianceDeadlines: state.generateComplianceDeadlines,
    }));

    const isLoading = activeAiModule === 'compliance';
    const isButtonDisabled = files.length === 0 || (activeAiModule !== null && !isLoading);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Compliance Calendar</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Common Due Dates</h3>
                    <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                        {commonDeadlines.map(d => (
                           <li key={d.name} className="flex justify-between">
                               <span>{d.name}</span>
                               <span className="font-mono">{d.day} {d.frequency}</span>
                           </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={generateComplianceDeadlines}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <CalendarDaysIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Generating...' : 'Generate Personalized Deadlines'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && deadlines ? 'opacity-100' : 'opacity-0'}`}>
                        {deadlines && (
                            <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               {deadlines}
                            </div>
                        )}
                    </div>
                    {!isLoading && !deadlines && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {files.length > 0
                                ? "Click to generate deadlines based on your uploaded files."
                                : "Upload documents to get personalized deadlines."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};