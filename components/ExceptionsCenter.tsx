
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldExclamationIcon, EyeIcon, TrashIcon, WrenchScrewdriverIcon } from './icons';
import type { DocumentData } from '../types';

export const ExceptionsCenter: React.FC = () => {
    const { documents, setViewerModalState, retryDocument, removeDocument, generateFixSuggestion, activeAiModule } = useAppStore(state => ({
        documents: state.documents.filter(d => ['Error', 'Review Required'].includes(d.status)),
        setViewerModalState: state.setViewerModalState,
        retryDocument: state.retryDocument,
        removeDocument: state.removeDocument,
        generateFixSuggestion: state.generateFixSuggestion,
        activeAiModule: state.activeAiModule,
    }));

    const handleRetry = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        retryDocument(docId);
    };

    const handleRemove = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to remove this document?')) {
            removeDocument(docId);
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <ShieldExclamationIcon className="w-6 h-6" />
                <span>Exceptions Center</span>
            </h2>
             {documents.length > 0 ? (
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {documents.map(doc => (
                        <div key={doc.id} className="p-3 bg-secondary-light dark:bg-secondary rounded-lg border border-yellow-500/50 dark:border-yellow-400/50">
                            <div className="flex justify-between items-start">
                                <div className="overflow-hidden">
                                    <p className="font-semibold text-dark dark:text-light truncate" title={doc.name}>{doc.name}</p>
                                    <p className={`text-sm font-bold ${doc.status === 'Error' ? 'text-red-500' : 'text-yellow-500'}`}>{doc.status}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center space-x-1">
                                    <button onClick={() => setViewerModalState({ isOpen: true, doc })} title="View Document" className="p-1 rounded-full hover:bg-accent-light/50 dark:hover:bg-accent/50">
                                        <EyeIcon className="w-5 h-5"/>
                                    </button>
                                     <button onClick={(e) => handleRemove(e, doc.id)} title="Remove Document" className="p-1 rounded-full hover:bg-accent-light/50 dark:hover:bg-accent/50">
                                        <TrashIcon className="w-5 h-5 text-red-500"/>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-primary-light dark:bg-primary/50 p-2 rounded-md">
                                <p className="font-semibold">Reason:</p>
                                <p>{doc.exceptionReason || 'No specific reason provided.'}</p>
                            </div>
                            
                            <div className="mt-2 space-y-2">
                               {doc.fixSuggestion && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-900/10 dark:bg-blue-900/30 p-2 rounded-md prose prose-xs dark:prose-invert">
                                       <p className="font-semibold text-blue-800 dark:text-blue-300">Suggested Fix:</p>
                                       <div dangerouslySetInnerHTML={{ __html: doc.fixSuggestion.replace(/\[ \]/g, '<li>').replace(/\n/g, '<br/>') }} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => generateFixSuggestion(doc.id)}
                                        disabled={activeAiModule === 'fixSuggestion'}
                                        className="w-full text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 flex items-center justify-center space-x-1 disabled:bg-gray-400"
                                    >
                                        <WrenchScrewdriverIcon className="w-3 h-3"/>
                                        <span>{activeAiModule === 'fixSuggestion' ? 'Thinking...' : 'Suggest Fix'}</span>
                                    </button>
                                    {doc.status === 'Error' && (
                                        <button onClick={(e) => handleRetry(e, doc.id)} className="w-full text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                                            Retry Processing
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="text-center text-sm text-gray-500 dark:text-accent py-10 bg-secondary-light dark:bg-secondary rounded-lg">
                    <p>No exceptions found.</p>
                    <p className="text-xs mt-1">All documents have been processed successfully.</p>
                </div>
             )}
        </div>
    );
};
