import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { BotIcon, KeyboardIcon, SunIcon, MoonIcon, PlusIcon, DocumentTextIcon, SparklesIcon } from './icons';

export const Header: React.FC = () => {
    const { 
        theme, 
        toggleTheme, 
        newChat, 
        setIsShortcutsModalOpen, 
        toggleLeftSidebar, 
        toggleRightSidebar 
    } = useAppStore(state => ({
        theme: state.theme,
        toggleTheme: state.toggleTheme,
        newChat: state.newChat,
        setIsShortcutsModalOpen: state.setIsShortcutsModalOpen,
        toggleLeftSidebar: state.toggleLeftSidebar,
        toggleRightSidebar: state.toggleRightSidebar,
    }));
    
    return (
        <header className="p-4 bg-secondary-light dark:bg-secondary shadow-md flex items-center justify-between border-b border-accent-light dark:border-accent transition-colors duration-300">
            <div className="flex items-center space-x-4">
                <BotIcon className="w-8 h-8 text-highlight-light dark:text-highlight" />
                <div>
                    <h1 className="text-xl font-bold text-dark dark:text-light">AI Accounting Assistant</h1>
                    <p className="text-sm text-gray-600 dark:text-highlight">Your smart partner for Excel & Tally data analysis</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                 <div className="flex items-center border-r border-accent-light dark:border-accent mr-2 pr-2 lg:hidden">
                    <button 
                        onClick={toggleLeftSidebar}
                        className="p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors"
                        aria-label="Toggle data panel"
                        title="Toggle Data Panel"
                    >
                        <DocumentTextIcon className="w-6 h-6 text-gray-700 dark:text-highlight" />
                    </button>
                    <button 
                        onClick={toggleRightSidebar}
                        className="p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors"
                        aria-label="Toggle AI tools"
                        title="Toggle AI Tools"
                    >
                        <SparklesIcon className="w-6 h-6 text-gray-700 dark:text-highlight" />
                    </button>
                </div>
                 <button 
                    onClick={newChat}
                    className="p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors"
                    aria-label="Start new chat"
                    title="New Chat"
                >
                    <PlusIcon className="w-6 h-6 text-gray-700 dark:text-highlight" />
                </button>
                 <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors"
                    aria-label="Toggle theme"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
                </button>
                <button 
                    onClick={() => setIsShortcutsModalOpen(true)} 
                    className="p-2 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors"
                    aria-label="Show keyboard shortcuts"
                    title="Keyboard Shortcuts"
                >
                    <KeyboardIcon className="w-6 h-6 text-gray-700 dark:text-highlight" />
                </button>
            </div>
        </header>
    );
};