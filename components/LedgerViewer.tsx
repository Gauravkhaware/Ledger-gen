
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { EyeIcon } from './icons';

export const LedgerViewer: React.FC = () => {
    const { ledger, setViewerModalState, documents } = useAppStore(state => ({
        ledger: state.ledger,
        setViewerModalState: state.setViewerModalState,
        documents: state.documents,
    }));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };
    
    const handleEvidenceClick = (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (doc) {
            setViewerModalState({ isOpen: true, doc: doc });
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Journal Ledger</h2>
            <div className="bg-secondary-light dark:bg-secondary p-2 rounded-lg">
                {ledger.length > 0 ? (
                    <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary-light dark:bg-primary/50 sticky top-0">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Narration</th>
                                    <th className="p-2">Debit</th>
                                    <th className="p-2">Credit</th>
                                    <th className="p-2 text-right">Amount</th>
                                    <th className="p-2 text-center">Evidence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map(entry => (
                                    <tr key={entry.id} className="border-b border-accent-light dark:border-accent hover:bg-accent-light/30 dark:hover:bg-accent/30">
                                        <td className="p-2 whitespace-nowrap">{entry.date}</td>
                                        <td className="p-2">{entry.narration}</td>
                                        <td className="p-2">{entry.debitAccount}</td>
                                        <td className="p-2">{entry.creditAccount}</td>
                                        <td className="p-2 text-right font-mono">{formatCurrency(entry.amount)}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleEvidenceClick(entry.sourceDocumentId)} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent" title="View Source Document">
                                                <EyeIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-accent py-10">
                        <p>No transactions posted to the ledger yet.</p>
                        <p className="text-xs mt-1">Validate documents in the inbox and use the "Post to Ledger" action.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
