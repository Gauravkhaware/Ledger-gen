import React from 'react';
import { CloseIcon } from './icons';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: 'F1', action: 'Upload Excel / Tally Data' },
    { key: 'F2', action: 'Generate P&L Report' },
    { key: 'F3', action: 'Reconcile Bank' },
    { key: 'F4', action: 'Generate GST Summary' },
    { key: 'F5', action: 'Search Transaction (Focus Chat)' },
    { key: 'F6', action: 'Ask to Export to Excel/PDF' },
    { key: 'Ctrl + R', action: 'Refresh Reports' },
    { key: 'Ctrl + N', action: 'Ask for New Journal Entry' },
    { key: 'Ctrl + F', action: 'Quick Find (Focus Chat)' },
    { key: 'Esc', action: 'Close this window' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl p-6 border border-accent-light dark:border-accent w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-dark dark:text-light">Keyboard Shortcuts</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors">
                        <CloseIcon className="w-6 h-6 text-dark dark:text-light" />
                    </button>
                </div>
                <div className="space-y-2">
                    {shortcuts.map(({ key, action }) => (
                        <div key={key} className="flex justify-between items-center p-2 rounded-md bg-primary-light/50 dark:bg-primary/50">
                            <span className="text-dark dark:text-light">{action}</span>
                            <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                                {key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};