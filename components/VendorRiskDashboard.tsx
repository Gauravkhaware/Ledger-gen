
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ShieldCheckIcon } from './icons';
import type { VendorRiskProfile } from '../types';

export const VendorRiskDashboard: React.FC = () => {
    const { documents, profile, activeAiModule, generateVendorRiskAnalysis } = useAppStore(state => ({
        documents: state.documents,
        profile: state.vendorRiskProfile,
        activeAiModule: state.activeAiModule,
        generateVendorRiskAnalysis: state.generateVendorRiskAnalysis,
    }));
    
    // Simple logic to find unique vendors from documents
    const vendors = useMemo(() => {
        const vendorNames = new Set<string>();
        documents.forEach(doc => {
            if(doc.type === 'Purchase Register' || doc.type === 'Invoice') {
                 // A real app would extract vendor name from structured data. Here we simulate from filename.
                 const name = doc.name.split(/[-_ ]/)[0].trim();
                 if(name && !/invoice|bill/i.test(name)) vendorNames.add(name);
            }
        });
        return Array.from(vendorNames);
    }, [documents]);

    const [selectedVendor, setSelectedVendor] = useState('');
    const isLoading = activeAiModule === 'vendorRisk';
    const canRun = selectedVendor && !isLoading && (activeAiModule === null);

    const handleRunAnalysis = () => {
        if (canRun) {
            // Find all docs related to this vendor to pass to the AI
            const vendorDocs = documents.filter(d => d.name.toLowerCase().includes(selectedVendor.toLowerCase()));
            generateVendorRiskAnalysis(vendorDocs.map(d => d.id));
        }
    };
    
    const getScoreColor = (value: number | null) => {
        if (value === null) return 'text-gray-500';
        if (value >= 80) return 'text-green-400';
        if (value >= 60) return 'text-lime-400';
        if (value >= 40) return 'text-yellow-400';
        if (value >= 20) return 'text-orange-400';
        return 'text-red-500';
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <ShieldCheckIcon className="w-6 h-6"/>
                <span>Vendor Risk</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Vendor</label>
                    <select
                        value={selectedVendor}
                        onChange={e => setSelectedVendor(e.target.value)}
                        className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 p-2 rounded-md text-sm border-gray-300 dark:border-accent shadow-sm focus:ring-highlight-light focus:border-highlight-light dark:focus:ring-highlight dark:focus:border-highlight"
                        disabled={vendors.length === 0}
                    >
                         <option value="">{vendors.length > 0 ? `Select a vendor...` : `Upload purchase data`}</option>
                         {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleRunAnalysis}
                    disabled={!canRun}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Analyzing...' : 'Analyze Vendor Risk'}</span>
                </button>

                <div className="mt-4 min-h-[6rem]">
                    {isLoading && (
                        <div className="flex items-center justify-center space-x-2">
                           <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                           <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                       </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && profile && profile.vendorName === selectedVendor ? 'opacity-100' : 'opacity-0'}`}>
                        {profile && profile.vendorName === selectedVendor && (
                            <div>
                                <div className="text-center mb-4">
                                <span className={`text-6xl font-bold ${getScoreColor(profile.riskScore)}`}>{profile.riskScore}</span>
                                <span className="text-xl font-semibold text-gray-500 dark:text-accent">/100</span>
                                <p className="font-semibold text-dark dark:text-light">{profile.vendorName}</p>
                            </div>
                            <p className="text-sm italic text-gray-600 dark:text-gray-400">{profile.summary}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                                    <div>
                                        <h4 className="font-bold text-green-500 mb-1">Positive Factors</h4>
                                        <ul className="list-disc pl-4 space-y-1 text-dark dark:text-light">
                                            {profile.positiveFactors.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-500 mb-1">Risk Factors</h4>
                                        <ul className="list-disc pl-4 space-y-1 text-dark dark:text-light">
                                            {profile.negativeFactors.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                     {!isLoading && (!profile || profile.vendorName !== selectedVendor) && <p className="text-center text-sm text-gray-500 dark:text-accent">Select a vendor to analyze.</p>}
                </div>
            </div>
        </div>
    );
};
