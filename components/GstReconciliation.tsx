
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ArrowsRightLeftIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const GstReconciliation: React.FC = () => {
    const { documents, result, activeAiModule, generateGstReconciliation } = useAppStore(state => ({
        documents: state.documents,
        result: state.gstReconciliationResult,
        activeAiModule: state.activeAiModule,
        generateGstReconciliation: state.generateGstReconciliation,
    }));

    const [purchaseRegisterId, setPurchaseRegisterId] = useState('');
    const [gstr2bId, setGstr2bId] = useState('');

    const purchaseDocs = useMemo(() => documents.filter(d => d.type === 'Purchase Register'), [documents]);
    const gstr2bDocs = useMemo(() => documents.filter(d => d.type === 'GSTR-2B'), [documents]);

    // Effect to pre-select if only one option is available
    useEffect(() => {
        if (purchaseDocs.length === 1 && !purchaseRegisterId) setPurchaseRegisterId(purchaseDocs[0].id);
    }, [purchaseDocs, purchaseRegisterId]);
    useEffect(() => {
        if (gstr2bDocs.length === 1 && !gstr2bId) setGstr2bId(gstr2bDocs[0].id);
    }, [gstr2bDocs, gstr2bId]);

    const isLoading = activeAiModule === 'gstReconciliation';
    const canRun = purchaseRegisterId && gstr2bId && !isLoading && (activeAiModule === null);

    const handleRunReconciliation = () => {
        if (canRun) {
            generateGstReconciliation(purchaseRegisterId, gstr2bId);
        }
    };

    const SelectDropdown: React.FC<{ label: string; value: string; onChange: (val: string) => void; docs: any[] }> = ({ label, value, onChange, docs }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 p-2 rounded-md text-sm border-gray-300 dark:border-accent shadow-sm focus:ring-highlight-light focus:border-highlight-light dark:focus:ring-highlight dark:focus:border-highlight"
                disabled={docs.length === 0}
            >
                <option value="">{docs.length > 0 ? `Select a document...` : `Upload a ${label}`}</option>
                {docs.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
            </select>
        </div>
    );

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <ArrowsRightLeftIcon className="w-6 h-6" />
                <span>GST Reconciliation</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                <SelectDropdown label="Purchase Register" value={purchaseRegisterId} onChange={setPurchaseRegisterId} docs={purchaseDocs} />
                <SelectDropdown label="GSTR-2B" value={gstr2bId} onChange={setGstr2bId} docs={gstr2bDocs} />

                <button
                    onClick={handleRunReconciliation}
                    disabled={!canRun}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <ArrowsRightLeftIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Reconciling...' : 'Run GSTR-2B Reconciliation'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && result ? 'opacity-100' : 'opacity-0'}`}>
                        {result && (
                            <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                    {!isLoading && !result && <p className="text-center text-sm text-gray-500 dark:text-accent">Select your Purchase Register and GSTR-2B to begin.</p>}
                </div>
            </div>
        </div>
    );
};
