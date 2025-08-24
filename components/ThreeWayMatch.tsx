
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ScaleIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ThreeWayMatch: React.FC = () => {
    const { documents, result, activeAiModule, generateThreeWayMatch } = useAppStore(state => ({
        documents: state.documents,
        result: state.threeWayMatchResult,
        activeAiModule: state.activeAiModule,
        generateThreeWayMatch: state.generateThreeWayMatch,
    }));

    const [poId, setPoId] = useState('');
    const [grnId, setGrnId] = useState('');
    const [invoiceId, setInvoiceId] = useState('');

    const poDocs = useMemo(() => documents.filter(d => d.type === 'Purchase Order'), [documents]);
    const grnDocs = useMemo(() => documents.filter(d => d.type === 'Goods Receipt Note'), [documents]);
    const invoiceDocs = useMemo(() => documents.filter(d => d.type === 'Invoice'), [documents]);

    // Effect to pre-select if only one option is available
    useEffect(() => {
        if (poDocs.length === 1) setPoId(poDocs[0].id);
    }, [poDocs]);
    useEffect(() => {
        if (grnDocs.length === 1) setGrnId(grnDocs[0].id);
    }, [grnDocs]);
    useEffect(() => {
        if (invoiceDocs.length === 1) setInvoiceId(invoiceDocs[0].id);
    }, [invoiceDocs]);


    const isLoading = activeAiModule === 'threeWayMatch';
    const canRun = poId && grnId && invoiceId && !isLoading && (activeAiModule === null);

    const handleRunMatch = () => {
        if (canRun) {
            generateThreeWayMatch(poId, grnId, invoiceId);
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
                <ScaleIcon className="w-6 h-6" />
                <span>3-Way Match</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                <SelectDropdown label="Purchase Order" value={poId} onChange={setPoId} docs={poDocs} />
                <SelectDropdown label="Goods Receipt Note" value={grnId} onChange={setGrnId} docs={grnDocs} />
                <SelectDropdown label="Invoice" value={invoiceId} onChange={setInvoiceId} docs={invoiceDocs} />
                <button
                    onClick={handleRunMatch}
                    disabled={!canRun}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <ScaleIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Reconciling...' : 'Run Reconciliation'}</span>
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
                    {!isLoading && !result && <p className="text-center text-sm text-gray-500 dark:text-accent">Select documents to reconcile.</p>}
                </div>
            </div>
        </div>
    );
};
