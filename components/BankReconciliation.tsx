
import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BankReconciliationIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const BankReconciliation: React.FC = () => {
    const { documents, result, activeAiModule, generateBankReconciliation } = useAppStore(state => ({
        documents: state.documents,
        result: state.bankReconciliationResult,
        activeAiModule: state.activeAiModule,
        generateBankReconciliation: state.generateBankReconciliation,
    }));

    const [bankStatementId, setBankStatementId] = useState('');
    const [booksId, setBooksId] = useState('');

    const bankStatementDocs = useMemo(() => documents.filter(d => d.type === 'Bank Statement'), [documents]);
    const bookDocs = useMemo(() => documents.filter(d => ['Sales Register', 'Purchase Register', 'Invoice'].includes(d.type)), [documents]);

    useEffect(() => {
        if (bankStatementDocs.length === 1 && !bankStatementId) setBankStatementId(bankStatementDocs[0].id);
    }, [bankStatementDocs, bankStatementId]);
    useEffect(() => {
        if (bookDocs.length === 1 && !booksId) setBooksId(bookDocs[0].id);
    }, [bookDocs, booksId]);

    const isLoading = activeAiModule === 'bankReconciliation';
    const canRun = bankStatementId && booksId && !isLoading && (activeAiModule === null);

    const handleRunReconciliation = () => {
        if (canRun) {
            generateBankReconciliation(bankStatementId, booksId);
        }
    };

    const SelectDropdown: React.FC<{ label: string; value: string; onChange: (val: string) => void; docs: any[] }> = ({ label, value, onChange, docs }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 p-2 rounded-md text-sm border-gray-300 dark:border-accent shadow-sm"
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
                <BankReconciliationIcon className="w-6 h-6" />
                <span>Bank Reconciliation</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                <SelectDropdown label="Bank Statement" value={bankStatementId} onChange={setBankStatementId} docs={bankStatementDocs} />
                <SelectDropdown label="Company Books (Ledger/Register)" value={booksId} onChange={setBooksId} docs={bookDocs} />

                <button
                    onClick={handleRunReconciliation}
                    disabled={!canRun}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <BankReconciliationIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Reconciling...' : 'Reconcile Bank Statement'}</span>
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
                    {!isLoading && !result && <p className="text-center text-sm text-gray-500 dark:text-accent">Select your Bank Statement and Books to begin.</p>}
                </div>
            </div>
        </div>
    );
};
