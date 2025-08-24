import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { DocumentData } from '../types';
import { CloseIcon, ZoomInIcon, ZoomOutIcon, RotateIcon, ScissorsIcon, ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon, SparklesIcon } from './icons';

// @ts-ignore - Ensure worker is available
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: DocumentData | null;
    file: File | null;
    onSplit: (originalDoc: DocumentData, fromPage: number, toPage: number, newName: string) => Promise<void>;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document, file, onSplit }) => {
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1.5);
    const [rotation, setRotation] = useState(0);
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitFrom, setSplitFrom] = useState('');
    const [splitTo, setSplitTo] = useState('');
    const [splitNewName, setSplitNewName] = useState('');
    const [isProcessingSplit, setIsProcessingSplit] = useState(false);
    const [activeTab, setActiveTab] = useState<'view' | 'evidence'>('view');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isPdf = file?.type === 'application/pdf';

    const resetState = useCallback(() => {
        setPdf(null);
        setNumPages(0);
        setCurrentPage(1);
        setZoom(1.5);
        setRotation(0);
        setIsSplitting(false);
        setSplitFrom('');
        setSplitTo('');
        setSplitNewName('');
        setActiveTab('view');
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetState();
            return;
        }

        if (file && isPdf) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result as ArrayBuffer;
                    const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
                    setPdf(pdfDoc);
                    setNumPages(pdfDoc.numPages);
                } catch (error) {
                    console.error("Failed to load PDF", error);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, [isOpen, file, isPdf, resetState]);

    const renderPage = useCallback(async () => {
        if (!pdf || !canvasRef.current) return;
        try {
            const page = await pdf.getPage(currentPage);
            const viewport = page.getViewport({ scale: zoom, rotation });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvas, canvasContext: context, viewport }).promise;
            }
        } catch (error) {
            console.error("Failed to render page", error);
        }
    }, [pdf, currentPage, zoom, rotation]);

    useEffect(() => {
        if (isPdf) {
            renderPage();
        }
    }, [isPdf, renderPage]);

    const handleSplitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!document) return;
        const from = parseInt(splitFrom);
        const to = parseInt(splitTo);
        if (isNaN(from) || isNaN(to) || !splitNewName.trim()) {
            alert("Please fill all fields for splitting.");
            return;
        }
        setIsProcessingSplit(true);
        await onSplit(document, from, to, splitNewName);
        setIsProcessingSplit(false);
    };
    
    const handleEvidenceClick = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        setActiveTab('view');
    }

    if (!isOpen || !document) return null;

    const ControlButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode, isActive?: boolean }> = ({ onClick, title, children, isActive }) => (
        <button onClick={onClick} title={title} className={`p-2 rounded-full transition-colors ${isActive ? 'bg-highlight-light/80 dark:bg-highlight/80 text-white' : 'hover:bg-white/20'}`}>
            {children}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-lg shadow-2xl border border-accent-light dark:border-accent w-full max-w-7xl h-[95vh] m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className="flex-shrink-0 p-3 bg-primary-light dark:bg-primary/50 flex items-center justify-between border-b border-accent-light dark:border-accent rounded-t-lg">
                    <h2 className="text-lg font-bold text-dark dark:text-light truncate" title={document.name}>{document.name}</h2>
                    <div className="flex items-center space-x-2 text-dark dark:text-light">
                        <ControlButton onClick={() => setActiveTab('view')} title="Document View" isActive={activeTab === 'view'}><DocumentTextIcon className="w-6 h-6" /></ControlButton>
                        <ControlButton onClick={() => setActiveTab('evidence')} title="Extracted Evidence" isActive={activeTab === 'evidence'}><SparklesIcon className="w-6 h-6" /></ControlButton>
                        <div className="w-px h-6 bg-accent-light dark:bg-accent mx-2"></div>
                        {isPdf && activeTab === 'view' && (
                            <>
                                <ControlButton onClick={() => setZoom(z => z * 1.2)} title="Zoom In"><ZoomInIcon className="w-6 h-6" /></ControlButton>
                                <ControlButton onClick={() => setZoom(z => z / 1.2)} title="Zoom Out"><ZoomOutIcon className="w-6 h-6" /></ControlButton>
                                <ControlButton onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate"><RotateIcon className="w-6 h-6" /></ControlButton>
                                <ControlButton onClick={() => setIsSplitting(!isSplitting)} title="Split Document" isActive={isSplitting}><ScissorsIcon className="w-6 h-6" /></ControlButton>
                            </>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent/50 transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Body */}
                <main className="flex-grow p-2 overflow-auto bg-gray-200 dark:bg-primary flex items-center justify-center relative">
                    {activeTab === 'view' ? (
                        isPdf ? (
                            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain rounded shadow-lg" />
                        ) : (
                            <pre className="whitespace-pre-wrap p-4 text-sm bg-white dark:bg-secondary text-dark dark:text-light w-full h-full rounded">{document.content || "No text content available."}</pre>
                        )
                    ) : (
                         <div className="w-full h-full bg-white dark:bg-secondary text-dark dark:text-light rounded p-4 overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4">Extracted Evidence</h3>
                            {document.evidence && document.evidence.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-primary-light dark:bg-primary/50">
                                        <tr>
                                            <th className="p-2">Field</th>
                                            <th className="p-2">Value</th>
                                            <th className="p-2">Location</th>
                                            <th className="p-2">Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {document.evidence.map(field => (
                                        <tr key={field.id} className="border-b border-accent-light dark:border-accent hover:bg-accent-light/30 dark:hover:bg-accent/30 cursor-pointer" onClick={() => handleEvidenceClick(field.page)}>
                                            <td className="p-2 font-semibold">{field.key}</td>
                                            <td className="p-2 truncate" title={String(field.value)}>{String(field.value)}</td>
                                            <td className="p-2 font-mono">
                                                Pg {field.page}
                                                {field.cell && ` / Cell ${field.cell}`}
                                                {field.bbox && ` / BBox`}
                                            </td>
                                            <td className="p-2">{(field.confidence * 100).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-500">No structured evidence has been extracted for this document yet.</p>
                            )}
                        </div>
                    )}
                </main>

                {/* Footer and Split UI */}
                <footer className="flex-shrink-0">
                    {isSplitting && isPdf && (
                        <div className="p-3 bg-highlight-light/10 dark:bg-highlight/10 border-t border-accent-light dark:border-accent">
                            <form onSubmit={handleSplitSubmit} className="flex items-end gap-3 text-sm">
                                <h3 className="font-semibold text-dark dark:text-light whitespace-nowrap">Split PDF:</h3>
                                <div>
                                    <label htmlFor="fromPage" className="block text-xs font-medium text-gray-700 dark:text-gray-300">From Page</label>
                                    <input type="number" id="fromPage" value={splitFrom} onChange={e => setSplitFrom(e.target.value)} min="1" max={numPages} placeholder="e.g., 1" className="w-20 mt-1 p-1 rounded bg-white dark:bg-accent text-dark dark:text-light" />
                                </div>
                                <div>
                                    <label htmlFor="toPage" className="block text-xs font-medium text-gray-700 dark:text-gray-300">To Page</label>
                                    <input type="number" id="toPage" value={splitTo} onChange={e => setSplitTo(e.target.value)} min="1" max={numPages} placeholder={`e.g., ${numPages}`} className="w-20 mt-1 p-1 rounded bg-white dark:bg-accent text-dark dark:text-light" />
                                </div>
                                <div className="flex-grow">
                                    <label htmlFor="newName" className="block text-xs font-medium text-gray-700 dark:text-gray-300">New Document Name</label>
                                    <input type="text" id="newName" value={splitNewName} onChange={e => setSplitNewName(e.target.value)} placeholder="e.g., Split Invoice" className="w-full mt-1 p-1 rounded bg-white dark:bg-accent text-dark dark:text-light" />
                                </div>
                                <button type="submit" disabled={isProcessingSplit} className="px-4 py-1.5 bg-highlight-light dark:bg-highlight text-white rounded hover:bg-blue-600 dark:hover:bg-blue-500 disabled:bg-gray-400 dark:disabled:bg-accent">
                                    {isProcessingSplit ? 'Splitting...' : 'Create'}
                                </button>
                            </form>
                        </div>
                    )}
                    {isPdf && activeTab === 'view' && (
                        <div className="flex items-center justify-center p-2 text-dark dark:text-light border-t border-accent-light dark:border-accent bg-primary-light dark:bg-primary/50">
                            <ControlButton onClick={() => setCurrentPage(p => Math.max(1, p - 1))} title="Previous Page"><ChevronLeftIcon className="w-6 h-6" /></ControlButton>
                            <span className="font-mono text-sm">Page {currentPage} of {numPages}</span>
                            <ControlButton onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} title="Next Page"><ChevronRightIcon className="w-6 h-6" /></ControlButton>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};