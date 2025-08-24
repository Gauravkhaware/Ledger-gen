import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SaveIcon, TrashIcon, EditIcon } from './icons';
import type { ChatHistoryItem } from '../types';

export const ChatHistory: React.FC = () => {
    const { histories, saveChat, loadChat, deleteChat, renameChat } = useAppStore(state => ({
        histories: Object.values(state.chatHistories)
            .sort((a: ChatHistoryItem, b: ChatHistoryItem) => parseInt(b.id) - parseInt(a.id)),
        saveChat: state.saveChat,
        loadChat: state.loadChat,
        deleteChat: state.deleteChat,
        renameChat: state.renameChat,
    }));
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    const handleSaveClick = () => {
        const defaultName = `Chat - ${new Date().toLocaleString()}`;
        const name = prompt("Enter a name for this chat:", defaultName);
        if (name) {
            saveChat(name);
        }
    };
    
    const handleRenameStart = (id: string, currentName: string) => {
        setEditingId(id);
        setNewName(currentName);
    };

    const handleRenameSubmit = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (newName.trim()) {
            renameChat(id, newName.trim());
            setEditingId(null);
            setNewName('');
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Chat History</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                <button
                    onClick={handleSaveClick}
                    className="w-full bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight border-2 border-dashed border-highlight-light dark:border-highlight p-2 rounded-lg hover:bg-highlight-light/30 dark:hover:bg-highlight/30 transition-colors flex items-center justify-center space-x-2"
                >
                    <SaveIcon className="w-5 h-5" />
                    <span>Save Current Chat</span>
                </button>
                
                {histories.length > 0 && (
                    <div className="mt-4">
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {histories.map((history) => (
                                <li 
                                    key={history.id} 
                                    className="flex items-center justify-between p-2 bg-primary-light dark:bg-primary rounded-md text-sm group cursor-pointer"
                                    onClick={() => editingId !== history.id && loadChat(history.id)}
                                >
                                    {editingId === history.id ? (
                                        <form onSubmit={(e) => handleRenameSubmit(e, history.id)} className="w-full">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onBlur={() => setEditingId(null)}
                                                autoFocus
                                                className="w-full bg-transparent border-b border-highlight focus:outline-none"
                                            />
                                        </form>
                                    ) : (
                                        <>
                                            <span className="truncate font-medium text-dark dark:text-light" title={history.name}>
                                                {history.name}
                                            </span>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleRenameStart(history.id, history.name); }} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent" title="Rename">
                                                    <EditIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Are you sure you want to delete this chat?')) { deleteChat(history.id); } }} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent" title="Delete">
                                                    <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {histories.length === 0 && (
                     <p className="text-center text-gray-500 dark:text-accent text-sm mt-4">No saved chats yet.</p>
                )}
            </div>
        </div>
    );
};