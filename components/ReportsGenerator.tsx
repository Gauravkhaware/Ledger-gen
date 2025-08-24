
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ReportType, FileDownloadData } from '../types';
import { DocumentChartBarIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { FileDownloadComponent } from './FileDownloadComponent';

const reportTypes: ReportType[] = [
    'Profit & Loss', 
    'Balance Sheet', 
    'Cash Flow Statement',
    'Trial Balance',
    'Journal & Ledger',
    'GST Summary',
    'GSTR-1',
    'GSTR-3B',
    'TDS Return (26Q)',
    'Payroll Summary',
    'Fixed Asset Register',
];

// Filings that require specific file selection and pre-flight checks
const reportsNeedingFileSelection: ReportType[] = ['GSTR-1', 'GSTR-3B', 'TDS Return (26Q)'];
const GSTR1_REQUIRED_HEADERS = ['InvoiceNo', 'InvoiceDate', 'CustomerGSTIN', 'PlaceOfSupply', 'TaxableValue', 'Rate', 'IGST', 'CGST', 'SGST'];

const isFileDownloadData = (content: any): content is FileDownloadData => {
    return typeof content === 'object' && content !== null && 'file_name' in content && 'file_type' in content;
}

interface ValidationError {
    row: number;
    message: string;
}

export const ReportsGenerator: React.FC = () => {
    const { documents, report, activeAiModule, generateReport } = useAppStore(state => ({
        documents: state.documents,
        report: state.report,
        activeAiModule: state.activeAiModule,
        generateReport: state.generateReport,
    }));

    const [selectedReport, setSelectedReport] = useState<ReportType>('Profit & Loss');
    const [reportMode, setReportMode] = useState<'Books' | 'File'>('Books');
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const [validationResult, setValidationResult] = useState<{ status: 'pass' | 'fail'; errors: ValidationError[] } | null>(null);
    const isLoading = activeAiModule === 'report';

    const isFromFileMode = reportMode === 'File';
    const isComplianceFiling = reportsNeedingFileSelection.includes(selectedReport);
    
    // Reset selections and validation state when core options change
    useEffect(() => {
        setSelectedFileId('');
        setValidationResult(null);
    }, [selectedReport, reportMode]);

    // Auto-select the first file if one isn't already selected in "From File" mode
    useEffect(() => {
        if (isFromFileMode && documents.length > 0 && !selectedFileId) {
            setSelectedFileId(documents[0].id);
        }
    }, [documents, isFromFileMode, selectedFileId]);

    const isButtonDisabled = 
        isLoading ||
        (activeAiModule !== null && !isLoading) ||
        (isFromFileMode && !selectedFileId) ||
        (isFromFileMode && isComplianceFiling && validationResult?.status !== 'pass');

    const handleGenerateClick = () => {
        if (isButtonDisabled) return;
        generateReport(selectedReport, reportMode, isFromFileMode ? selectedFileId : undefined);
    };
    
    const validateGstr1Data = (content: string): ValidationError[] => {
        const errors: ValidationError[] = [];
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            errors.push({ row: 0, message: "File must contain a header and at least one data row." });
            return errors;
        }

        const headerLine = lines[0];
        const normalizeHeader = (h: string) => h.trim().replace(/"/g, '').toLowerCase().replace(/[\s_.-]/g, '');
        
        const headers = headerLine.split(/,|\t/).map(normalizeHeader);
        const required = GSTR1_REQUIRED_HEADERS.map(normalizeHeader);

        const missing = required.filter(reqHeader => !headers.includes(reqHeader));
        if (missing.length > 0) {
            // Find original header name for better error message
            const originalMissing = GSTR1_REQUIRED_HEADERS.filter(h => missing.includes(normalizeHeader(h)));
            errors.push({ row: 1, message: `Missing required headers: ${originalMissing.join(', ')}` });
            return errors;
        }

        const dateIndex = headers.indexOf(normalizeHeader('InvoiceDate'));
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(/,|\t/);
            if (row.length < headers.length) continue; // Skip malformed rows
            if (dateIndex !== -1 && !/^\d{4}-\d{2}-\d{2}$/.test(row[dateIndex]?.trim())) {
                errors.push({ row: i + 1, message: `Invalid date format. Expected YYYY-MM-DD.` });
            }
        }
        return errors;
    };

    const handlePreflightCheck = () => {
        const fileToValidate = documents.find(d => d.id === selectedFileId);
        if (!fileToValidate) {
            setValidationResult({ status: 'fail', errors: [{ row: 0, message: 'Please select a file to run the check.' }] });
            return;
        }

        let errors: ValidationError[] = [];
        if (selectedReport === 'GSTR-1') {
             errors = validateGstr1Data(fileToValidate.content);
        }
        // Placeholder for other filing validations
        
        setValidationResult(errors.length > 0 ? { status: 'fail', errors } : { status: 'pass', errors: [] });
    };

    const downloadTemplate = () => {
        const csvContent = GSTR1_REQUIRED_HEADERS.join(',') + '\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'GSTR1_Template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Financial Reports</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Report Type</label>
                        <select 
                            id="reportType" 
                            value={selectedReport}
                            onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                            className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm"
                        >
                            {reportTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Source</label>
                        <div className="flex mt-1 bg-gray-200 dark:bg-accent/50 rounded-md p-0.5">
                             <button onClick={() => setReportMode('Books')} className={`w-full text-xs p-1 rounded ${reportMode === 'Books' ? 'bg-white dark:bg-accent shadow' : ''}`}>From Books</button>
                             <button onClick={() => setReportMode('File')} className={`w-full text-xs p-1 rounded ${reportMode === 'File' ? 'bg-white dark:bg-accent shadow' : ''}`}>From File</button>
                        </div>
                    </div>
                </div>
                
                {isFromFileMode && (
                    <div className="space-y-2">
                        <label htmlFor="fileSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Source File</label>
                        <select
                            id="fileSelect"
                            value={selectedFileId}
                            onChange={(e) => setSelectedFileId(e.target.value)}
                            className="w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm"
                            disabled={documents.length === 0}
                        >
                            <option value="">-- {documents.length > 0 ? 'Select a file' : 'Upload a file first'} --</option>
                            {documents.map(file => (<option key={file.id} value={file.id}>{file.name}</option>))}
                        </select>
                        
                        {isComplianceFiling && (
                            <div className="p-2 border border-dashed border-accent-light dark:border-accent rounded-md space-y-2">
                                <div className="flex space-x-2">
                                    <button onClick={handlePreflightCheck} disabled={!selectedFileId} className="w-full text-sm bg-gray-500 text-white p-1 rounded hover:bg-gray-600 disabled:bg-gray-400">Run Pre-flight Check</button>
                                    <button onClick={downloadTemplate} className="w-full text-sm bg-gray-500 text-white p-1 rounded hover:bg-gray-600">Download Template</button>
                                </div>
                                {validationResult && (
                                    <div className={`text-xs p-2 rounded-md ${validationResult.status === 'pass' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                                        {validationResult.status === 'pass' 
                                            ? <div className="flex items-start space-x-2"><CheckCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" /><p className="font-semibold">Pre-flight check passed. Ready to generate.</p></div>
                                            : <div>
                                                <div className="flex items-start space-x-2 font-semibold"><XCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" /> <p>Pre-flight Check Failed:</p></div>
                                                <ul className="list-disc pl-5 mt-1 max-h-24 overflow-y-auto">
                                                {validationResult.errors.map((e, i) => <li key={i}>Row {e.row}: {e.message}</li>)}
                                                </ul>
                                            </div>
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleGenerateClick}
                    disabled={isButtonDisabled}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <DocumentChartBarIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Generating...' : `Generate Report`}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    <div className={`transition-opacity duration-500 w-full ${!isLoading && report ? 'opacity-100' : 'opacity-0'}`}>
                        {report && (
                            isFileDownloadData(report) ? (
                                <FileDownloadComponent fileData={report} />
                            ) : (
                                <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                                   {report}
                                </div>
                            )
                        )}
                    </div>
                    {!isLoading && !report && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {documents.length > 0 || reportMode === 'Books'
                                ? "Select a report type and click the button to generate it."
                                : "Upload documents to enable 'From File' report generation."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
