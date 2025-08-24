import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { LedgerMapping } from '../types';
import { BookOpenIcon } from './icons';

export const LedgerSettings: React.FC = () => {
    const { mappings, updateLedgerMapping } = useAppStore(state => ({
        mappings: state.ledgerMappings,
        updateLedgerMapping: state.updateLedgerMapping,
    }));

    const handleCodeChange = (account: LedgerMapping['account'], value: string) => {
        updateLedgerMapping(account, value);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <BookOpenIcon className="w-6 h-6" />
                <span>Ledger Mappings</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Map your internal chart of accounts to standard categories. The AI will use these codes when creating journal entries.
                </p>
                {mappings.map(mapping => (
                    <div key={mapping.account} className="flex items-center justify-between">
                        <label htmlFor={`ledger-${mapping.account}`} className="text-sm text-dark dark:text-light">
                            {mapping.account}
                        </label>
                        <input
                            type="text"
                            id={`ledger-${mapping.account}`}
                            value={mapping.ledgerCode}
                            onChange={(e) => handleCodeChange(mapping.account, e.target.value)}
                            className="w-24 bg-gray-200 dark:bg-accent/50 text-dark dark:text-light placeholder-gray-500 dark:placeholder-accent rounded-md p-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-highlight-light dark:focus:ring-highlight"
                            placeholder="e.g., 4001"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};