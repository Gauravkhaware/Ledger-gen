
import React, { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { DocumentData } from '../types';
import { UploadIcon, TrashIcon, InvoiceIcon, BankStatementIcon, TaxDocumentIcon, PayrollIcon, ContractIcon, FileQuestionIcon, LockClosedIcon, ClipboardListIcon, EyeIcon, BookOpenIcon } from './icons';

const getDocumentIcon = (doc: DocumentData) => {
    const commonClass = "w-5 h-5 flex-shrink-0";
    if (['Awaiting Password', 'Invalid Password'].includes(doc.status)) return <LockClosedIcon className={`${commonClass} text-orange-500`} />;
    
    const spinningIcon = <div className="w-4 h-4 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-full animate-spin"></div>;
    if (['Scanning', 'Unlocking', 'Extracting Text', 'Classifying', 'Validating'].includes(doc.status)) return spinningIcon;

    switch(doc.type) {
        case 'Invoice': return <InvoiceIcon className={`${commonClass} text-blue-500`} />;
        case 'Bank Statement': return <BankStatementIcon className={`${commonClass} text-green-500`} />;
        case 'GST Filing':
        case 'TDS Certificate': return <TaxDocumentIcon className={`${commonClass} text-red-500`} />;
        case 'Payroll Register': return <PayrollIcon className={`${commonClass} text-purple-500`} />;
        case 'Contract/Agreement': return <ContractIcon className={`${commonClass} text-yellow-500`} />;
        case 'Sales Register':
        case 'Purchase Register': return <InvoiceIcon className={`${commonClass} text-indigo-500`} />;
        case 'Classifying...': return spinningIcon;
        default: return <FileQuestionIcon className={`${commonClass} text-gray-500`} />;
    }
}

const BatchActions: React.FC = () => {
    const { documents, batchUnlock, createEvidenceBundle, reprocessFailedDocuments } = useAppStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [batchPassword, setBatchPassword] = useState('');

    const encryptedCount = useMemo(() => documents.filter(d => ['Awaiting Password', 'Invalid Password'].includes(d.status)).length, [documents]);
    const failedCount = useMemo(() => documents.filter(d => d.status === 'Error').length, [documents]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(documents.map(d => d.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const selectedDocs = useMemo(() => documents.filter(d => selectedIds.has(d.id)), [documents, selectedIds]);
    const canReprocess = selectedDocs.some(d => d.status === 'Error');


    const handleBatchUnlock = () => {
        if (batchPassword) {
            batchUnlock(batchPassword);
            setBatchPassword('');
        }
    };

    const handleCreateBundle = () => {
        createEvidenceBundle(Array.from(selectedIds));
        setSelectedIds(new Set());
    };
    
    const handleReprocess = () => {
        reprocessFailedDocuments(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    return (
        <div>
            {documents.length > 0 && (
                <div className="p-2 bg-primary-light dark:bg-primary rounded-md space-y-2">
                    <div className="flex items-center">
                        <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === documents.length && documents.length > 0} className="mr-2" />
                        <span className="text-xs font-semibold">Select All ({selectedIds.size} selected)</span>
                    </div>
                    {selectedIds.size > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={handleCreateBundle} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 w-full">Evidence Bundle</button>
                             <button onClick={handleReprocess} disabled={!canReprocess} className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 w-full disabled:bg-gray-400">Reprocess Failed</button>
                        </div>
                    )}
                    {encryptedCount > 0 && (
                         <div className="flex items-center space-x-2">
                            <input
                                type="password"
                                value={batchPassword}
                                onChange={(e) => setBatchPassword(e.target.value)}
                                placeholder={`Password for ${encryptedCount} file(s)`}
                                className="w-full text-xs p-1 rounded bg-gray-200 dark:bg-accent/50"
                            />
                            <button onClick={handleBatchUnlock} disabled={!batchPassword} className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600 disabled:bg-gray-400">Unlock</button>
                        </div>
                    )}
                </div>
            )}
            <DocumentList selectedIds={selectedIds} onSelect={(id) => setSelectedIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            })} />
        </div>
    );
};

export const DocumentInbox: React.FC = () => {
    const { addNewDocuments } = useAppStore();
    const [isDragging, setIsDragging] = useState(false);

    const handleFileProcessing = useCallback((fileList: FileList) => {
        const files = Array.from(fileList);
        if (files.length > 0) {
            addNewDocuments(files);
        }
    }, [addNewDocuments]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcessing(e.dataTransfer.files);
        }
    }, [handleFileProcessing]);

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(false);
    };
    
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileProcessing(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Document Inbox</h2>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragEvents}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
                    isDragging
                        ? 'border-highlight-light dark:border-highlight bg-highlight-light/10 dark:bg-highlight/10'
                        : 'border-accent-light dark:border-accent hover:border-highlight-light dark:hover:border-highlight'
                }`}
            >
                <input type="file" multiple onChange={handleFileInputChange} className="hidden" id="file-upload" accept=".pdf,.xlsx,.xls,.csv,.txt,.xml,.json,.eml,.msg" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <UploadIcon className="w-12 h-12 text-gray-400 dark:text-accent" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-highlight-light dark:text-highlight">Drop any document</span> or click to upload
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">PDF, Excel, Images, Email, etc.</p>
                </label>
            </div>
            <BatchActions />
        </div>
    );
};

const DocumentList: React.FC<{ selectedIds: Set<string>, onSelect: (docId: string) => void }> = ({ selectedIds, onSelect }) => {
    const store = useAppStore();
    const { documents, removeDocument, setLogsModalState, setViewerModalState, retryDocument, submitPassword, postDocument, fileObjects } = store;
    
    const [filter, setFilter] = useState('All');
    const [sort, setSort] = useState('date-desc');
    const [inlinePassword, setInlinePassword] = useState<Record<string, string>>({});
    
    const counts = useMemo(() => ({
        encrypted: documents.filter(d => ['Awaiting Password', 'Invalid Password'].includes(d.status)).length,
        errors: documents.filter(d => d.status === 'Error').length,
        review: documents.filter(d => d.status === 'Review Required').length,
    }), [documents]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const getStatusText = (doc: DocumentData) => {
        if (['Validated', 'Posted'].includes(doc.status)) return doc.type;
        return doc.status;
    };
    
    const filteredAndSortedDocuments = useMemo(() => {
        const filtered = documents.filter(doc => {
            if (filter === 'All') return true;
            if (filter === 'Encrypted') return ['Awaiting Password', 'Invalid Password'].includes(doc.status);
            if (filter === 'Errors') return doc.status === 'Error';
            if (filter === 'Review') return doc.status === 'Review Required';
            if (filter === 'Posted') return doc.status === 'Posted';
            return true;
        });

        return filtered.sort((a, b) => {
            if (sort === 'name-asc') return a.name.localeCompare(b.name);
            if (sort === 'name-desc') return b.name.localeCompare(a.name);
            if (sort === 'date-asc') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
            return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        });
    }, [documents, filter, sort]);

    const handleInlinePasswordSubmit = (docId: string) => {
        if (inlinePassword[docId]) {
            submitPassword(inlinePassword[docId], docId);
            setInlinePassword(prev => ({...prev, [docId]: ''}));
        }
    };
    
    const FilterChip: React.FC<{ value: string; label: string; count: number }> = ({ value, label, count }) => (
        <button 
            onClick={() => setFilter(value)}
            disabled={count === 0 && value !== 'All'}
            className={`px-2 py-0.5 text-xs rounded-full disabled:opacity-50 transition-colors ${filter === value ? 'bg-highlight-light text-white' : 'bg-gray-200 dark:bg-accent/50 hover:bg-gray-300 dark:hover:bg-accent'}`}
        >
            {label} {count > 0 && `(${count})`}
        </button>
    );

    return (
        <div>
            {documents.length > 0 && (
                <div>
                    <div className="flex items-center space-x-2 mt-2 text-sm flex-wrap gap-y-1">
                        <FilterChip value="All" label="All" count={documents.length} />
                        <FilterChip value="Encrypted" label="Encrypted" count={counts.encrypted} />
                        <FilterChip value="Errors" label="Errors" count={counts.errors} />
                        <FilterChip value="Review" label="Review" count={counts.review} />
                        <FilterChip value="Posted" label="Posted" count={documents.filter(d=>d.status === 'Posted').length} />
                        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-gray-200 dark:bg-accent/50 p-1 rounded-md text-xs ml-auto">
                            <option value="date-desc">Sort: Newest</option>
                            <option value="date-asc">Sort: Oldest</option>
                            <option value="name-asc">Sort: Name (A-Z)</option>
                            <option value="name-desc">Sort: Name (Z-A)</option>
                        </select>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 mt-2">
                        {filteredAndSortedDocuments.map((doc) => {
                            const hasFileObject = !!fileObjects[doc.id];
                            return (
                                <div key={doc.id} className="p-2 bg-primary-light dark:bg-primary rounded-md text-sm group">
                                    <div className="flex items-center justify-between">
                                        <input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => onSelect(doc.id)} className="mr-3" />
                                        <div className="flex items-center space-x-3 overflow-hidden flex-grow">
                                            {getDocumentIcon(doc)}
                                            <div className="flex flex-col overflow-hidden">
                                              <span className="truncate font-medium text-dark dark:text-light" title={doc.name}>{doc.name}</span>
                                              <span className={`text-xs ${doc.status === 'Invalid Password' || doc.status === 'Error' ? 'text-red-500' : 'text-gray-500 dark:text-accent'}`}>
                                                {getStatusText(doc)} &bull; {formatFileSize(doc.size)}
                                              </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-shrink-0">
                                            <button onClick={() => setViewerModalState({isOpen: true, doc})} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors opacity-0 group-hover:opacity-100" title="View Document">
                                                <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                            </button>
                                            <button onClick={() => setLogsModalState({isOpen: true, doc})} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors opacity-0 group-hover:opacity-100" title="View Logs">
                                                <ClipboardListIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                            </button>
                                            <button onClick={() => removeDocument(doc.id)} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent transition-colors" title="Remove Document">
                                                <TrashIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                    {doc.status === 'Validated' && (
                                         <div className="mt-2">
                                            <button onClick={() => postDocument(doc.id)} className="w-full text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 flex items-center justify-center space-x-1">
                                                <BookOpenIcon className="w-3 h-3" />
                                                <span>Post to Ledger</span>
                                            </button>
                                        </div>
                                    )}
                                    {doc.status === 'Error' && (
                                        <div className="mt-2">
                                            <button 
                                                onClick={() => retryDocument(doc.id)} 
                                                className="w-full text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!hasFileObject}
                                                title={hasFileObject ? 'Retry processing this file' : 'Original file not available in this session. Please re-upload.'}
                                            >
                                                Retry Processing
                                            </button>
                                        </div>
                                    )}
                                    {['Awaiting Password', 'Invalid Password'].includes(doc.status) && (
                                        <div className="mt-2 flex items-center space-x-2">
                                            <input
                                                type="password"
                                                value={inlinePassword[doc.id] || ''}
                                                onChange={(e) => setInlinePassword(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                                placeholder="Enter Password"
                                                className="w-full text-xs p-1 rounded bg-gray-200 dark:bg-accent/50"
                                                onKeyDown={(e) => e.key === 'Enter' && handleInlinePasswordSubmit(doc.id)}
                                            />
                                            <button onClick={() => handleInlinePasswordSubmit(doc.id)} className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600">Unlock</button>
                                        </div>
                                    )}
                                    {doc.isDuplicate && (
                                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md text-yellow-800 dark:text-yellow-300 text-xs">
                                            <p>This might be a duplicate of <span className="font-semibold">{doc.duplicateOf}</span>.</p>
                                            <div className="flex space-x-2 mt-1">
                                                <button className="hover:underline">Keep This</button>
                                                <button className="hover:underline">Remove This</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
