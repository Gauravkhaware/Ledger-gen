
import React, { useState, useEffect } from 'react';
import { CloseIcon, LockClosedIcon } from './icons';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    documentName: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit, documentName }) => {
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword(''); // Reset password on open
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            onSubmit(password);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl p-6 border border-accent-light dark:border-accent w-full max-w-sm m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-dark dark:text-light flex items-center">
                        <LockClosedIcon className="w-6 h-6 mr-2 text-orange-500"/>
                        Password Required
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors">
                        <CloseIcon className="w-6 h-6 text-dark dark:text-light" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    The document <span className="font-semibold text-dark dark:text-light truncate">{documentName}</span> is encrypted. Please enter the password to unlock it.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="password-input" className="sr-only">Password</label>
                        <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-accent/50 text-dark dark:text-light placeholder-gray-500 dark:placeholder-accent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-highlight-light dark:focus:ring-highlight"
                            placeholder="Enter document password"
                            autoFocus
                        />
                    </div>
                    <div className="flex space-x-2">
                         <button 
                            type="button"
                            onClick={onClose}
                            className="w-full bg-gray-300 dark:bg-accent text-dark dark:text-light p-2 rounded-lg hover:bg-gray-400 dark:hover:bg-accent/70 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!password}
                            className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                        >
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
