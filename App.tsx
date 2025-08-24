
import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { DocumentInbox } from './components/DocumentInbox';
import { ChatInterface } from './components/ChatInterface';
import { SmartSuggestions } from './components/SmartSuggestions';
import { ShortcutsModal } from './components/ShortcutsModal';
import { BusinessHealthScore } from './components/BusinessHealthScore';
import { LoanManager } from './components/LoanManager';
import { ComplianceCalendar } from './components/ComplianceCalendar';
import { ScenarioPlanner } from './components/ScenarioPlanner';
import { ProfitabilityAnalysis } from './components/ProfitabilityAnalysis';
import { ReportsGenerator } from './components/ReportsGenerator';
import { ExcelOrganizer } from './components/ExcelOrganizer';
import { PasswordModal } from './components/PasswordModal';
import { LogsModal } from './components/LogsModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { ExceptionsCenter } from './components/ExceptionsCenter';
import { SettingsManager } from './components/SettingsManager';
import { ThreeWayMatch } from './components/ThreeWayMatch';
import { VendorRiskDashboard } from './components/VendorRiskDashboard';
import { InvoiceScanner } from './components/InvoiceScanner';
import { LitigationManager } from './components/LitigationManager';
import { GstReconciliation } from './components/GstReconciliation';
import { BankReconciliation } from './components/BankReconciliation';
import { DocumentTextIcon, ShieldExclamationIcon, CogIcon, ClipboardDocumentListIcon } from './components/icons';
import { LedgerViewer } from './components/LedgerViewer';

const App: React.FC = () => {
    const store = useAppStore();
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [leftSidebarTab, setLeftSidebarTab] = useState<'inbox' | 'journal' | 'exceptions' | 'settings'>('inbox');
    const [rightSidebarTab, setRightSidebarTab] = useState<'core' | 'compliance' | 'analysis' | 'advisory'>('core');

    // Effect to initialize the app state from storage
    useEffect(() => {
        store.initialize();
    }, []);

    // Effect to handle theme changes
    useEffect(() => {
        if (store.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [store.theme]);
    
    // Effect for keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'f') {
                event.preventDefault();
                chatInputRef.current?.focus();
            }
            if (event.key === 'Escape') {
                store.setIsShortcutsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [store]);

    const closeSidebars = useCallback(() => {
        if (store.setIsLeftSidebarOpen) store.setIsLeftSidebarOpen(false);
        if (store.setIsRightSidebarOpen) store.setIsRightSidebarOpen(false);
    }, [store]);

    const currentPasswordDoc = store.passwordModalState.docId 
        ? store.documents.find(d => d.id === store.passwordModalState.docId) 
        : null;
        
    const viewerDocFile = store.viewerModalState.doc
        ? store.fileObjects[store.viewerModalState.doc.id]
        : null;

    const renderLeftSidebarContent = () => {
        switch (leftSidebarTab) {
            case 'inbox':
                return (
                    <>
                        <DocumentInbox />
                        <hr className="border-accent-light dark:border-accent" />
                        <InvoiceScanner />
                    </>
                );
            case 'journal':
                return <LedgerViewer />;
            case 'exceptions':
                return <ExceptionsCenter />;
            case 'settings':
                return <SettingsManager />;
            default:
                return null;
        }
    };

    const renderRightSidebarContent = () => {
        switch (rightSidebarTab) {
            case 'core':
                return (
                    <>
                        <BankReconciliation />
                        <hr className="border-accent-light dark:border-accent" />
                        <ThreeWayMatch />
                        <hr className="border-accent-light dark:border-accent" />
                        <ExcelOrganizer />
                        <hr className="border-accent-light dark:border-accent" />
                        <ReportsGenerator />
                    </>
                );
            case 'compliance':
                return (
                    <>
                        <GstReconciliation />
                        <hr className="border-accent-light dark:border-accent" />
                        <VendorRiskDashboard />
                        <hr className="border-accent-light dark:border-accent" />
                        <ComplianceCalendar />
                    </>
                );
            case 'analysis':
                 return (
                    <>
                        <BusinessHealthScore />
                        <hr className="border-accent-light dark:border-accent" />
                        <ProfitabilityAnalysis />
                        <hr className="border-accent-light dark:border-accent" />
                        <ScenarioPlanner />
                        <hr className="border-accent-light dark:border-accent" />
                        <LoanManager />
                    </>
                );
            case 'advisory':
                return <LitigationManager />;
            default: return null;
        }
    }


    return (
        <div className={`flex flex-col h-screen font-sans bg-primary-light dark:bg-primary text-dark dark:text-light transition-colors duration-300 ${store.theme}`}>
            <Header />
            
            {(store.isLeftSidebarOpen || store.isRightSidebarOpen) && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={closeSidebars}
                    aria-hidden="true"
                />
            )}

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
                {/* Left Sidebar: Data Input */}
                <aside className={`bg-secondary-light dark:bg-secondary rounded-lg shadow-lg flex flex-col transition-transform duration-300 ease-in-out fixed lg:static inset-y-0 left-0 z-40 w-4/5 max-w-sm lg:col-span-1 lg:w-auto lg:max-w-none lg:translate-x-0 ${store.isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex-shrink-0 p-4 border-b border-accent-light dark:border-accent">
                        <div className="flex space-x-2">
                           <button onClick={() => setLeftSidebarTab('inbox')} className={`w-full p-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 ${leftSidebarTab === 'inbox' ? 'bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight' : 'hover:bg-accent-light/50 dark:hover:bg-accent/30'}`}>
                                <DocumentTextIcon className="w-5 h-5" />
                                <span>Inbox</span>
                           </button>
                           <button onClick={() => setLeftSidebarTab('journal')} className={`w-full p-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 ${leftSidebarTab === 'journal' ? 'bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight' : 'hover:bg-accent-light/50 dark:hover:bg-accent/30'}`}>
                                <ClipboardDocumentListIcon className="w-5 h-5" />
                                <span>Journal</span>
                           </button>
                           <button onClick={() => setLeftSidebarTab('exceptions')} className={`w-full p-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 ${leftSidebarTab === 'exceptions' ? 'bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight' : 'hover:bg-accent-light/50 dark:hover:bg-accent/30'}`}>
                                <ShieldExclamationIcon className="w-5 h-5" />
                                <span>Exceptions</span>
                           </button>
                           <button onClick={() => setLeftSidebarTab('settings')} className={`w-full p-2 rounded-md text-sm font-semibold flex items-center justify-center space-x-2 ${leftSidebarTab === 'settings' ? 'bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight' : 'hover:bg-accent-light/50 dark:hover:bg-accent/30'}`}>
                                <CogIcon className="w-5 h-5" />
                                <span>Settings</span>
                           </button>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-6 flex-grow">
                        {renderLeftSidebarContent()}
                    </div>
                </aside>
                
                {/* Main Chat Interface */}
                <div className="lg:col-span-2 h-full flex flex-col rounded-lg shadow-lg overflow-hidden border border-accent-light dark:border-accent">
                    <ChatInterface ref={chatInputRef} />
                </div>
                
                {/* Right Sidebar: AI Modules */}
                <aside className={`bg-secondary-light dark:bg-secondary rounded-lg shadow-lg flex flex-col transition-transform duration-300 ease-in-out fixed lg:static inset-y-0 right-0 z-40 w-4/5 max-w-sm lg:col-span-1 lg:w-auto lg:max-w-none lg:translate-x-0 ${store.isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-4 space-y-4">
                        <SmartSuggestions />
                    </div>
                    <hr className="border-accent-light dark:border-accent" />
                     <div className="flex-shrink-0 px-4 pt-4">
                        <div className="flex space-x-1 p-1 bg-primary-light dark:bg-primary rounded-lg">
                           <button onClick={() => setRightSidebarTab('core')} className={`w-full text-xs p-1 rounded ${rightSidebarTab === 'core' ? 'bg-white dark:bg-accent shadow' : ''}`}>Core</button>
                           <button onClick={() => setRightSidebarTab('compliance')} className={`w-full text-xs p-1 rounded ${rightSidebarTab === 'compliance' ? 'bg-white dark:bg-accent shadow' : ''}`}>Compliance</button>
                           <button onClick={() => setRightSidebarTab('analysis')} className={`w-full text-xs p-1 rounded ${rightSidebarTab === 'analysis' ? 'bg-white dark:bg-accent shadow' : ''}`}>Analysis</button>
                           <button onClick={() => setRightSidebarTab('advisory')} className={`w-full text-xs p-1 rounded ${rightSidebarTab === 'advisory' ? 'bg-white dark:bg-accent shadow' : ''}`}>Advisory</button>
                        </div>
                    </div>
                    <div className="p-4 overflow-y-auto space-y-6 flex-grow">
                        {renderRightSidebarContent()}
                    </div>
                </aside>
            </main>
            
            {store.error && (
                <div 
                    className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg transition-opacity duration-300"
                    role="alert"
                >
                    {store.error}
                    <button onClick={() => store.setError(null)} className="ml-4 font-bold">X</button>
                </div>
            )}
            
            <ShortcutsModal 
                isOpen={store.isShortcutsModalOpen} 
                onClose={() => store.setIsShortcutsModalOpen(false)} 
            />
            <PasswordModal
                isOpen={store.passwordModalState.isOpen}
                onClose={() => store.setPasswordModalState({ isOpen: false, docId: null })}
                onSubmit={(password) => {
                    if (store.passwordModalState.docId) {
                        store.submitPassword(password, store.passwordModalState.docId);
                    }
                }}
                documentName={currentPasswordDoc?.name || ''}
            />
            <LogsModal
                isOpen={store.logsModalState.isOpen}
                onClose={() => store.setLogsModalState({ isOpen: false, doc: null })}
                document={store.logsModalState.doc}
            />
            <DocumentViewerModal
                isOpen={store.viewerModalState.isOpen}
                onClose={() => store.setViewerModalState({ isOpen: false, doc: null })}
                document={store.viewerModalState.doc}
                file={viewerDocFile}
                onSplit={store.splitDocument}
            />
        </div>
    );
};

export default App;
