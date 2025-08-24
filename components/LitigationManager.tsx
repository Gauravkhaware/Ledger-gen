
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GavelIcon, PlusIcon, TrashIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const LitigationManager: React.FC = () => {
    const {
        documents,
        cases,
        draft,
        activeAiModule,
        addLitigationCase,
        removeLitigationCase,
        generateLitigationDraft
    } = useAppStore(state => ({
        documents: state.documents,
        cases: state.litigationCases,
        draft: state.litigationDraft,
        activeAiModule: state.activeAiModule,
        addLitigationCase: state.addLitigationCase,
        removeLitigationCase: state.removeLitigationCase,
        generateLitigationDraft: state.generateLitigationDraft,
    }));
    
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formState, setFormState] = useState({ caseName: '', authority: '', noticeDate: '', details: '', relevantDocIds: [] as string[] });
    const isLoading = activeAiModule === 'litigation';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleDocSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
        setFormState({ ...formState, relevantDocIds: selectedIds });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLitigationCase(formState);
        setFormState({ caseName: '', authority: '', noticeDate: '', details: '', relevantDocIds: [] });
        setIsFormVisible(false);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <GavelIcon className="w-6 h-6" />
                <span>Litigation Manager</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                {cases.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {cases.map(caseItem => (
                            <div key={caseItem.id} className="p-2 bg-primary-light dark:bg-primary rounded-md text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-medium truncate" title={caseItem.caseName}>{caseItem.caseName}</span>
                                        <span className="text-xs text-gray-500 dark:text-accent">{caseItem.authority} - {caseItem.noticeDate}</span>
                                    </div>
                                    <button onClick={() => removeLitigationCase(caseItem.id)} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors flex-shrink-0">
                                        <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => generateLitigationDraft(caseItem.id)}
                                    disabled={isLoading}
                                    className="w-full text-xs mt-2 bg-highlight-light dark:bg-highlight text-white p-1 rounded-md hover:opacity-80 disabled:opacity-50"
                                >
                                    {isLoading ? 'Drafting...' : 'Generate Draft Response'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isFormVisible && (
                     <button 
                        onClick={() => setIsFormVisible(true)}
                        className="w-full text-sm border-2 border-dashed border-accent-light dark:border-accent p-2 rounded-lg hover:bg-accent-light/50 dark:hover:bg-accent/20 transition-colors text-gray-600 dark:text-highlight flex items-center justify-center space-x-1"
                     >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add New Case/Notice</span>
                    </button>
                )}
                
                {isFormVisible && (
                    <form onSubmit={handleSubmit} className="space-y-3 p-2 border border-accent-light dark:border-accent rounded-md">
                        <input type="text" name="caseName" value={formState.caseName} onChange={handleInputChange} placeholder="Case Name / Subject" className="w-full text-sm p-1 rounded bg-gray-200 dark:bg-accent/50" required/>
                        <input type="text" name="authority" value={formState.authority} onChange={handleInputChange} placeholder="Issuing Authority" className="w-full text-sm p-1 rounded bg-gray-200 dark:bg-accent/50" required/>
                        <input type="date" name="noticeDate" value={formState.noticeDate} onChange={handleInputChange} className="w-full text-sm p-1 rounded bg-gray-200 dark:bg-accent/50" required/>
                        <textarea name="details" value={formState.details} onChange={handleInputChange} placeholder="Summary of the issue..." rows={3} className="w-full text-sm p-1 rounded bg-gray-200 dark:bg-accent/50" required/>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Relevant Documents</label>
                             <select multiple name="relevantDocIds" value={formState.relevantDocIds} onChange={handleDocSelectChange} className="w-full text-sm p-1 rounded bg-gray-200 dark:bg-accent/50 h-24">
                                {documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button type="submit" className="w-full bg-blue-600 text-white p-2 text-sm rounded-md hover:bg-blue-700">Add Case</button>
                            <button type="button" onClick={() => setIsFormVisible(false)} className="w-full bg-gray-300 dark:bg-accent text-sm p-2 rounded-md hover:bg-gray-400 dark:hover:bg-accent/70">Cancel</button>
                        </div>
                    </form>
                )}
               
                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && draft ? 'opacity-100' : 'opacity-0'}`}>
                        {draft && (
                            <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               <h4 className="font-bold">Draft Response:</h4>
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                    {!isLoading && !draft && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                           {cases.length > 0 ? "Select a case to generate a draft response." : "Add a case to get started."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
