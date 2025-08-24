import React, { useState } from 'react';
import { ExcelMappingManager } from './ExcelMappingManager';
import { ChatHistory } from './ChatHistory';
import { LedgerSettings } from './LedgerSettings';
import { MapIcon, BookOpenIcon, SaveIcon } from './icons';

type SettingsTab = 'mappings' | 'ledger' | 'history';

export const SettingsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('ledger');

    const renderContent = () => {
        switch (activeTab) {
            case 'mappings':
                return <ExcelMappingManager />;
            case 'ledger':
                return <LedgerSettings />;
            case 'history':
                return <ChatHistory />;
            default:
                return null;
        }
    };
    
    const TabButton: React.FC<{ tab: SettingsTab; label: string; icon: React.ReactNode }> = ({ tab, label, icon }) => (
         <button 
            onClick={() => setActiveTab(tab)}
            className={`flex items-center space-x-2 p-2 rounded-md text-sm w-full justify-center ${activeTab === tab ? 'bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight' : 'hover:bg-accent-light/50 dark:hover:bg-accent/30'}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 p-2 bg-primary-light dark:bg-primary rounded-lg">
                <TabButton tab="ledger" label="Ledger" icon={<BookOpenIcon className="w-4 h-4"/>} />
                <TabButton tab="mappings" label="Mappings" icon={<MapIcon className="w-4 h-4"/>} />
                <TabButton tab="history" label="History" icon={<SaveIcon className="w-4 h-4"/>} />
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};