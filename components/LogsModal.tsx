import React from 'react';
import { CloseIcon, ClipboardListIcon } from './icons';
import type { DocumentData } from '../types';

interface LogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: DocumentData | null;
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, document }) => {
    if (!isOpen || !document) return null;

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl p-6 border border-accent-light dark:border-accent w-full max-w-lg m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-dark dark:text-light flex items-center space-x-2">
                        <ClipboardListIcon className="w-6 h-6" />
                        <span>Processing Logs</span>
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors">
                        <CloseIcon className="w-6 h-6 text-dark dark:text-light" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-shrink-0">
                    File: <span className="font-semibold text-dark dark:text-light truncate">{document.name}</span>
                </p>
                <div className="bg-primary-light dark:bg-primary/70 p-3 rounded-md overflow-y-auto max-h-96">
                    <ul className="space-y-2 text-sm font-mono">
                        {document.logs.map((log, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-gray-500 dark:text-accent mr-3 flex-shrink-0">[{formatTimestamp(log.timestamp)}]</span>
                                <span className="text-dark dark:text-light break-words">{log.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
