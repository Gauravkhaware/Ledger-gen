
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { Loan } from '../types';
import { BanknotesIcon, TrashIcon } from './icons';

interface LoanManagerProps {}

const LoanInput: React.FC<{ label: string; name: string; type: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }> = 
({ label, name, type, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm focus:ring-highlight-light focus:border-highlight-light dark:focus:ring-highlight dark:focus:border-highlight sm:text-sm p-2"
            required
        />
    </div>
);


export const LoanManager: React.FC<LoanManagerProps> = () => {
    const { loans, addLoan, removeLoan, loanAnalysis, activeAiModule, generateLoanAnalysis } = useAppStore(state => ({
        loans: state.loans,
        addLoan: state.addLoan,
        removeLoan: state.removeLoan,
        loanAnalysis: state.loanAnalysis,
        activeAiModule: state.activeAiModule,
        generateLoanAnalysis: state.generateLoanAnalysis,
    }));

    const [formState, setFormState] = useState({ name: '', principal: '', interestRate: '', tenure: '' });
    const [isFormVisible, setIsFormVisible] = useState(false);
    const isLoading = activeAiModule === 'loan';
    const isButtonDisabled = loans.length === 0 || (activeAiModule !== null && !isLoading);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLoan({
            name: formState.name,
            principal: parseFloat(formState.principal),
            interestRate: parseFloat(formState.interestRate),
            tenure: parseInt(formState.tenure, 10),
        });
        setFormState({ name: '', principal: '', interestRate: '', tenure: '' });
        setIsFormVisible(false);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Loan & EMI Management</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                {loans.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {loans.map(loan => (
                             <div key={loan.id} className="flex items-center justify-between p-2 bg-primary-light dark:bg-primary rounded-md text-sm">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium truncate" title={loan.name}>{loan.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-accent">{formatCurrency(loan.principal)} @ {loan.interestRate}% for {loan.tenure} yrs</span>
                                </div>
                                <button onClick={() => removeLoan(loan.id)} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors flex-shrink-0">
                                    <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isFormVisible && (
                     <button 
                        onClick={() => setIsFormVisible(true)}
                        className="w-full text-sm border-2 border-dashed border-accent-light dark:border-accent p-2 rounded-lg hover:bg-accent-light/50 dark:hover:bg-accent/20 transition-colors text-gray-600 dark:text-highlight"
                     >
                        + Add New Loan
                    </button>
                )}
                
                {isFormVisible && (
                    <form onSubmit={handleSubmit} className="space-y-3 p-2 border border-accent-light dark:border-accent rounded-md">
                        <LoanInput label="Loan Name" name="name" type="text" value={formState.name} onChange={handleInputChange} placeholder="e.g., Working Capital Loan" />
                        <LoanInput label="Principal Amount (₹)" name="principal" type="number" value={formState.principal} onChange={handleInputChange} placeholder="e.g., 500000" />
                        <LoanInput label="Annual Interest Rate (%)" name="interestRate" type="number" value={formState.interestRate} onChange={handleInputChange} placeholder="e.g., 12.5" />
                        <LoanInput label="Loan Tenure (Years)" name="tenure" type="number" value={formState.tenure} onChange={handleInputChange} placeholder="e.g., 5" />
                        <div className="flex space-x-2">
                            <button type="submit" className="w-full bg-blue-600 text-white p-2 text-sm rounded-md hover:bg-blue-700">Add Loan</button>
                            <button type="button" onClick={() => setIsFormVisible(false)} className="w-full bg-gray-300 dark:bg-accent text-sm p-2 rounded-md hover:bg-gray-400 dark:hover:bg-accent/70">Cancel</button>
                        </div>
                    </form>
                )}
               
                <button
                    onClick={generateLoanAnalysis}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <BanknotesIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Analyzing...' : 'Generate EMI Schedule & Analysis'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && loanAnalysis ? 'opacity-100' : 'opacity-0'}`}>
                        {loanAnalysis && (
                            <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                               {loanAnalysis}
                            </div>
                        )}
                    </div>
                    {!isLoading && !loanAnalysis && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {loans.length > 0 
                                ? "Click the button to generate an analysis of your loans."
                                : "Add one or more loans to enable analysis."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};