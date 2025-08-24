
import { create } from 'zustand';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { storageService } from '../services/storageService';
import { 
    generateResponseStream, 
    generateSuggestions, 
    generateHealthScore, 
    generateLoanAnalysis, 
    generateComplianceCalendar, 
    generateScenarioAnalysis, 
    generateProfitabilityAnalysis, 
    generateReport as generateReportService, 
    extractInvoiceData, 
    organizeFile, 
    classifyDocument,
    generateThreeWayMatch,
    generateVendorRiskAnalysis,
    generateFixSuggestion,
    generateLitigationDraft,
    generateGstReconciliation,
    generateBankReconciliation
} from '../services/geminiService';
import { calculateFileHash } from '../utils/fileUtils';
import type { 
    DocumentData, ChatMessage, ChartData, Loan, ScenarioInput, ReportType, 
    ExtractedInvoice, FileDownloadData, ChatHistoryItem, DocumentStatus, ExcelMapping,
    LedgerEntry, LedgerMapping, VendorRiskProfile, LitigationCase
} from '../types';

// @ts-ignore - Ensure worker is available
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

// --- Custom Error Classes for File Processing ---
class PasswordRequiredError extends Error {
  constructor(message = 'This PDF is password-protected.') {
    super(message);
    this.name = 'PasswordRequiredError';
  }
}

class InvalidPasswordError extends Error {
  constructor(message = 'The provided password was incorrect.') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

// --- File Content Extraction Logic ---
const extractFileContent = async (file: File, password?: string): Promise<string> => {
    // ... implementation from original App.tsx, unchanged ...
        return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();

        reader.onerror = () => {
            reader.abort();
            reject(new DOMException(`Problem parsing input file: ${file.name}`));
        };

        if (extension === 'xlsx' || extension === 'xls' || file.type.includes('sheet')) {
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    let csvContent = '';
                    workbook.SheetNames.forEach(sheetName => {
                        csvContent += `--- SHEET: ${sheetName} ---\n`;
                        const worksheet = workbook.Sheets[sheetName];
                        csvContent += XLSX.utils.sheet_to_csv(worksheet) + '\n\n';
                    });
                    resolve(csvContent);
                } catch (err) { reject(err); }
            };
            reader.readAsArrayBuffer(file);
        } else if (extension === 'pdf' || file.type === 'application/pdf') {
            reader.onload = async (e) => {
                try {
                    const data = e.target?.result as ArrayBuffer;
                    const loadingTask = pdfjsLib.getDocument({ data, password });
                    const pdf = await loadingTask.promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map(item => (item as any).str).join(' ') + '\n\n';
                    }
                    resolve(textContent.trim());
                } catch (err) {
                    if ((err as any).name === 'PasswordException') {
                        if (password) {
                            reject(new InvalidPasswordError());
                        } else {
                            reject(new PasswordRequiredError());
                        }
                    } else {
                        reject(err);
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                try {
                    const textContent = e.target?.result as string;
                    resolve(textContent);
                } catch (err) { reject(err); }
            };
            reader.readAsText(file);
        }
    });
};


// --- Zustand Store Definition ---

type Theme = 'light' | 'dark';
type AiModule = 'suggestions' | 'organizer' | 'healthScore' | 'profitability' | 'scenario' | 'loan' | 'compliance' | 'report' | 'scanner' | 'threeWayMatch' | 'vendorRisk' | 'fixSuggestion' | 'litigation' | 'gstReconciliation' | 'bankReconciliation';

const defaultLedgerMappings: LedgerMapping[] = [
    { account: 'Sales', ledgerCode: '4000' },
    { account: 'Purchases', ledgerCode: '5000' },
    { account: 'IGST Payable', ledgerCode: '2101' },
    { account: 'CGST Payable', ledgerCode: '2102' },
    { account: 'SGST Payable', ledgerCode: '2103' },
    { account: 'Accounts Receivable', ledgerCode: '1200' },
    { account: 'Accounts Payable', ledgerCode: '2000' },
];


interface AppState {
    // Core Data
    documents: DocumentData[];
    fileObjects: Record<string, File>;
    messages: ChatMessage[];
    chatHistories: Record<string, ChatHistoryItem>;
    excelMappings: ExcelMapping[];
    ledger: LedgerEntry[];
    ledgerMappings: LedgerMapping[];
    litigationCases: LitigationCase[];
    
    // UI State
    theme: Theme;
    isLoading: boolean;
    error: string | null;
    activeAiModule: AiModule | null;
    isLeftSidebarOpen: boolean;
    isRightSidebarOpen: boolean;
    
    // Modal States
    passwordModalState: { isOpen: boolean; docId: string | null };
    logsModalState: { isOpen: boolean; doc: DocumentData | null };
    viewerModalState: { isOpen: boolean; doc: DocumentData | null };
    isShortcutsModalOpen: boolean;

    // AI Module Outputs
    suggestions: string | null;
    organizedFileResult: { summary: string; file: FileDownloadData } | null;
    healthScore: string | null;
    loans: Loan[];
    loanAnalysis: string | null;
    complianceDeadlines: string | null;
    scenario: ScenarioInput;
    scenarioAnalysis: string | null;
    profitabilityAnalysis: string | null;
    report: string | FileDownloadData | null;
    invoiceData: { data: ExtractedInvoice; image: string } | null;
    threeWayMatchResult: string | null;
    vendorRiskProfile: VendorRiskProfile | null;
    litigationDraft: string | null;
    gstReconciliationResult: string | null;
    bankReconciliationResult: string | null;

    // Actions
    initialize: () => void;
    toggleTheme: () => void;
    setError: (error: string | null) => void;
    
    // Document Actions
    addNewDocuments: (files: File[]) => Promise<void>;
    removeDocument: (docId: string) => void;
    addLog: (docId: string, message: string) => void;
    updateDocument: (docId: string, updates: Partial<DocumentData>) => void;
    processDocumentPipeline: (docId: string, password?: string) => Promise<void>;
    submitPassword: (password: string, docId: string) => Promise<void>;
    splitDocument: (originalDoc: DocumentData, fromPage: number, toPage: number, newName: string) => Promise<void>;
    retryDocument: (docId: string) => void;
    reprocessFailedDocuments: (docIds: string[]) => void;
    batchUnlock: (password: string) => void;
    createEvidenceBundle: (docIds: string[]) => void;
    postDocument: (docId: string) => void;
    
    // Mapping & Settings Actions
    deleteMapping: (mappingId: string) => void;
    updateLedgerMapping: (account: LedgerMapping['account'], ledgerCode: string) => void;

    // Chat Actions
    sendMessage: (message: string) => Promise<void>;
    newChat: () => void;
    saveChat: (name: string) => void;
    loadChat: (id: string) => void;
    deleteChat: (id: string) => void;
    renameChat: (id: string, newName: string) => void;
    
    // AI Module Actions
    generateSuggestions: () => Promise<void>;
    organizeFile: (fileToOrganize: DocumentData) => Promise<void>;
    generateHealthScore: () => Promise<void>;
    addLoan: (loan: Omit<Loan, 'id'>) => void;
    removeLoan: (id: string) => void;
    generateLoanAnalysis: () => Promise<void>;
    generateComplianceDeadlines: () => Promise<void>;
    setScenario: (scenario: ScenarioInput) => void;
    generateScenarioAnalysis: () => Promise<void>;
    generateProfitabilityAnalysis: () => Promise<void>;
    generateReport: (reportType: ReportType, mode: 'Books' | 'File', fileId?: string) => Promise<void>;
    scanInvoice: (imageDataUrl: string) => Promise<void>;
    generateThreeWayMatch: (poId: string, grnId: string, invoiceId: string) => Promise<void>;
    generateVendorRiskAnalysis: (docIds: string[]) => Promise<void>;
    generateFixSuggestion: (docId: string) => Promise<void>;
    addLitigationCase: (caseDetails: Omit<LitigationCase, 'id'>) => void;
    removeLitigationCase: (caseId: string) => void;
    generateLitigationDraft: (caseId: string) => Promise<void>;
    generateGstReconciliation: (purchaseRegisterId: string, gstr2bId: string) => Promise<void>;
    generateBankReconciliation: (bankStatementId: string, booksId: string) => Promise<void>;

    // UI Actions
    setIsLeftSidebarOpen: (isOpen: boolean) => void;
    setIsRightSidebarOpen: (isOpen: boolean) => void;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setIsShortcutsModalOpen: (isOpen: boolean) => void;
    setPasswordModalState: (state: { isOpen: boolean; docId: string | null }) => void;
    setLogsModalState: (state: { isOpen: boolean; doc: DocumentData | null }) => void;
    setViewerModalState: (state: { isOpen: boolean; doc: DocumentData | null }) => void;
}

const initialMessage: ChatMessage = {
    role: 'model',
    content: 'Hello! I am LedgerGenie v3.0. Please upload your financial documents. I will classify them and help you manage your accounting, tax, and compliance needs.'
};

const resetModuleOutputs = () => ({
    suggestions: null,
    organizedFileResult: null,
    healthScore: null,
    loanAnalysis: null,
    complianceDeadlines: null,
    scenarioAnalysis: null,
    profitabilityAnalysis: null,
    report: null,
    invoiceData: null,
    threeWayMatchResult: null,
    vendorRiskProfile: null,
    litigationDraft: null,
    gstReconciliationResult: null,
    bankReconciliationResult: null,
});

export const useAppStore = create<AppState>((set, get) => {
    // --- AI Module Actions (Generic Handler) ---
    const _runAiModule = async <T>(moduleName: AiModule, apiCall: () => Promise<T>, resultKey: keyof AppState, onComplete?: (result: T) => void) => {
        const { activeAiModule, setError } = get();
        if (activeAiModule) return;

        set({ activeAiModule: moduleName, error: null });
        if (resultKey) {
            set({ [resultKey as any]: null });
        }

        try {
            const result = await apiCall();
            if (onComplete) {
                onComplete(result);
            } else if (resultKey) {
                set({ [resultKey]: result } as Partial<AppState>);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to run ${moduleName}: ${errorMessage}`);
        } finally {
            set({ activeAiModule: null });
        }
    };
    
    return {
        // --- INITIAL STATE ---
        documents: [],
        fileObjects: {},
        messages: [initialMessage],
        chatHistories: {},
        excelMappings: [],
        ledger: [],
        ledgerMappings: defaultLedgerMappings,
        litigationCases: [],
        theme: 'dark',
        isLoading: false,
        error: null,
        activeAiModule: null,
        isLeftSidebarOpen: false,
        isRightSidebarOpen: false,
        passwordModalState: { isOpen: false, docId: null },
        logsModalState: { isOpen: false, doc: null },
        viewerModalState: { isOpen: false, doc: null },
        isShortcutsModalOpen: false,
        loans: [],
        scenario: { metric: 'Overall Revenue', changeType: 'Increase', valueType: 'Percentage', value: 10 },
        ...resetModuleOutputs(),

        // --- ACTIONS ---

        initialize: () => {
            const storedTheme = localStorage.getItem('theme') as Theme | null;
            const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const initialTheme = storedTheme || preferredTheme;

            set({
                theme: initialTheme,
                documents: storageService.getDocuments(),
                chatHistories: storageService.getChatHistories(),
                loans: storageService.getLoans(),
                excelMappings: storageService.getExcelMappings(),
                ledger: storageService.getLedger(),
                ledgerMappings: storageService.getLedgerMappings() || defaultLedgerMappings,
                litigationCases: storageService.getLitigationCases(),
            });
        },

        toggleTheme: () => {
            const newTheme = get().theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            set({ theme: newTheme });
        },
        
        setError: (error) => set({ error }),

        // --- DOCUMENT ACTIONS ---

        addLog: (docId, message) => {
            set(state => {
                const newDocs = state.documents.map(d =>
                    d.id === docId
                        ? { ...d, logs: [...(d.logs || []), { timestamp: new Date().toISOString(), message }] }
                        : d
                );
                storageService.saveDocuments(newDocs);
                return { documents: newDocs };
            });
        },
        
        updateDocument: (docId, updates) => {
            set(state => {
                const newDocs = state.documents.map(d => 
                    d.id === docId ? { ...d, ...updates } : d
                );
                storageService.saveDocuments(newDocs);
                return { documents: newDocs };
            });
        },

        processDocumentPipeline: async (docId, password) => {
            const { fileObjects, addLog, updateDocument, setError } = get();
            const file = fileObjects[docId];
            if (!file) return;

            try {
                // 1. Scanning / Text Extraction
                updateDocument(docId, { status: 'Extracting Text' });
                addLog(docId, 'Extracting content...');
                const content = await extractFileContent(file, password);
                updateDocument(docId, { content, exceptionReason: null });
                addLog(docId, 'Content extracted successfully.');

                // 2. Classification
                updateDocument(docId, { status: 'Classifying' });
                addLog(docId, 'Classifying document...');
                const classifiedType = await classifyDocument({ name: file.name, content });
                updateDocument(docId, { type: classifiedType, status: 'Classified' });
                addLog(docId, `Classification complete: ${classifiedType}`);

                // 3. Validation
                updateDocument(docId, { status: 'Validating' });
                addLog(docId, 'Validating data...');
                // Dummy validation logic
                if (content.length < 50) {
                     updateDocument(docId, { status: 'Review Required', exceptionReason: 'Low content detected, please verify.', reviewNotes: ['Low content detected, please verify.'] });
                     addLog(docId, `Validation flagged for review: Low content.`);
                } else {
                    updateDocument(docId, { status: 'Validated' });
                    addLog(docId, `Validation successful.`);
                }

            } catch (err) {
                const error = err as Error;
                const statusMap: Record<string, DocumentStatus> = {
                    PasswordRequiredError: 'Awaiting Password',
                    InvalidPasswordError: 'Invalid Password',
                };
                const status = statusMap[error.name] || 'Error';
                
                const exceptionReason = status === 'Error' ? `Processing failed: ${error.message}` : error.message;
                updateDocument(docId, { status, exceptionReason });
                addLog(docId, exceptionReason);

                if (status === 'Invalid Password') {
                    setError(`Incorrect password for ${file.name}.`);
                }
            }
        },

        addNewDocuments: async (files) => {
            const { processDocumentPipeline } = get();
            const newDocsData: DocumentData[] = [];
            const newFileObjects: Record<string, File> = {};

            const processingPromises = files.map(async (file) => {
                const hash = await calculateFileHash(file);
                const id = `${file.name}-${hash}`;
                
                const existingDoc = get().documents.find(d => d.sha256 === hash);
                if (existingDoc) {
                    const newDoc: DocumentData = {
                        id, name: file.name, content: '', size: file.size, mimeType: file.type, sha256: hash,
                        uploadedAt: new Date().toISOString(), type: 'Other', status: 'Review Required',
                        logs: [{ timestamp: new Date().toISOString(), message: 'File flagged as potential duplicate.' }],
                        version: 1, source: 'upload', isDuplicate: true, duplicateOf: existingDoc.name,
                        exceptionReason: 'Potential duplicate of existing file.',
                    };
                    newFileObjects[id] = file;
                    newDocsData.push(newDoc);
                    return;
                }

                newFileObjects[id] = file;
                newDocsData.push({
                    id, name: file.name, content: '', size: file.size, mimeType: file.type, sha256: hash,
                    uploadedAt: new Date().toISOString(), type: 'Other', status: 'Uploaded',
                    logs: [{ timestamp: new Date().toISOString(), message: 'File added to queue.' }],
                    version: 1, source: 'upload', exceptionReason: null,
                });
            });

            await Promise.all(processingPromises);
            
            if (newDocsData.length > 0) {
                set(state => {
                    const updatedDocs = [...state.documents, ...newDocsData];
                    storageService.saveDocuments(updatedDocs);
                    return {
                        documents: updatedDocs,
                        fileObjects: { ...state.fileObjects, ...newFileObjects },
                        error: null,
                    };
                });
                
                await Promise.all(newDocsData.filter(d => !d.isDuplicate).map(doc => processDocumentPipeline(doc.id)));
            }
        },
        
        removeDocument: (docId) => {
            set(state => {
                const newDocs = state.documents.filter(doc => doc.id !== docId);
                const newFileObjects = { ...state.fileObjects };
                delete newFileObjects[docId];
                storageService.saveDocuments(newDocs);
                return { documents: newDocs, fileObjects: newFileObjects };
            });
        },

        submitPassword: async (password, docId) => {
            const { addLog, updateDocument, processDocumentPipeline } = get();
            addLog(docId, 'Attempting to unlock with password...');
            updateDocument(docId, { status: 'Unlocking' });
            await processDocumentPipeline(docId, password);
        },
        
        retryDocument: (docId) => {
            const { addLog, processDocumentPipeline, updateDocument, fileObjects, setError } = get();
            if (!fileObjects[docId]) {
                setError("Cannot retry: The original file is not available in this session. Please re-upload the document to process it again.");
                return;
            }
            addLog(docId, "Retrying processing...");
            updateDocument(docId, { status: 'Uploaded' });
            processDocumentPipeline(docId);
        },

        reprocessFailedDocuments: (docIds) => {
            const { documents, retryDocument } = get();
            docIds.forEach(id => {
                const doc = documents.find(d => d.id === id);
                if (doc && doc.status === 'Error') {
                    retryDocument(id);
                }
            });
        },

        batchUnlock: (password) => {
            const { documents, submitPassword } = get();
            documents.forEach(doc => {
                if (['Awaiting Password', 'Invalid Password'].includes(doc.status)) {
                    submitPassword(password, doc.id);
                }
            });
        },

        createEvidenceBundle: async (docIds) => {
            const { documents, addLog } = get();
            const zip = new JSZip();
            const manifest: Record<string, any> = {};

            docIds.forEach(id => {
                const doc = documents.find(d => d.id === id);
                if (doc) {
                    zip.file(`${doc.name}.txt`, doc.content);
                    manifest[doc.id] = { name: doc.name, type: doc.type, size: doc.size, sha256: doc.sha256 };
                    addLog(id, 'Added to evidence bundle.');
                }
            });

            zip.file('manifest.json', JSON.stringify(manifest, null, 2));

            const content = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `Evidence_Bundle_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },
        
        postDocument: (docId) => {
            const { documents, ledgerMappings, updateDocument, addLog } = get();
            const doc = documents.find(d => d.id === docId);
            if (!doc || doc.status !== 'Validated') return;

            // Simplified posting logic
            const amount = 1000; // Dummy amount
            const entry: LedgerEntry = {
                id: `entry-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                narration: `Posted from ${doc.name}`,
                debitAccount: ledgerMappings.find(m => m.account === 'Accounts Receivable')?.ledgerCode || '1200',
                creditAccount: ledgerMappings.find(m => m.account === 'Sales')?.ledgerCode || '4000',
                amount: amount,
                sourceDocumentId: doc.id
            };

            set(state => {
                const newLedger = [...state.ledger, entry];
                storageService.saveLedger(newLedger);
                return { ledger: newLedger };
            });

            updateDocument(docId, { status: 'Posted', postedLedgerEntryIds: [entry.id] });
            addLog(docId, `Transaction posted to ledger with entry ID ${entry.id}.`);
        },

        splitDocument: async (originalDoc, fromPage, toPage, newName) => {
            const { fileObjects, setError, addLog, addNewDocuments } = get();
            const file = fileObjects[originalDoc.id];
            if (!file || !file.type.includes('pdf')) {
                setError("Splitting is only supported for PDF files.");
                return;
            }
        
            addLog(originalDoc.id, `Splitting pages ${fromPage}-${toPage} into "${newName}"`);
        
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
                if (fromPage < 1 || toPage > pdfDoc.numPages || fromPage > toPage) {
                    setError(`Invalid page range for "${originalDoc.name}".`);
                    return;
                }
        
                const newPdf = new jsPDF();
                newPdf.deletePage(1);
        
                for (let i = fromPage; i <= toPage; i++) {
                    const page = await pdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 }); 
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
        
                    if (context) {
                        await page.render({ canvas, canvasContext: context, viewport: viewport }).promise;
                        const imgData = canvas.toDataURL('image/jpeg', 0.9);
                        const orientation = viewport.width > viewport.height ? 'l' : 'p';
                        newPdf.addPage([viewport.width, viewport.height], orientation);
                        newPdf.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
                    }
                }
        
                const pdfBlob = newPdf.output('blob');
                const newFileName = newName.endsWith('.pdf') ? newName : `${newName}.pdf`;
                const newFile = new File([pdfBlob], newFileName, { type: 'application/pdf' });
                
                await addNewDocuments([newFile]);
                addLog(originalDoc.id, `Successfully created "${newFileName}"`);
                set({ viewerModalState: { isOpen: false, doc: null } });
        
            } catch (err) {
                 const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                 setError(`Failed to split PDF: ${errorMessage}`);
                 addLog(originalDoc.id, `Splitting failed: ${errorMessage}`);
            }
        },

        // --- MAPPING & SETTINGS ACTIONS ---
        deleteMapping: (mappingId) => {
            set(state => {
                const newMappings = state.excelMappings.filter(m => m.id !== mappingId);
                storageService.saveExcelMappings(newMappings);
                return { excelMappings: newMappings };
            });
        },
        
        updateLedgerMapping: (account, ledgerCode) => {
            set(state => {
                const newMappings = state.ledgerMappings.map(m => m.account === account ? { ...m, ledgerCode } : m);
                storageService.saveLedgerMappings(newMappings);
                return { ledgerMappings: newMappings };
            });
        },


        // --- CHAT ACTIONS ---
        sendMessage: async (message) => {
            if (!message.trim() || get().isLoading) return;

            const userMessage: ChatMessage = { role: 'user', content: message };
            set(state => ({ messages: [...state.messages, userMessage], isLoading: true, error: null }));

            const modelMessage: ChatMessage = { role: 'model', content: '', isStreaming: true };
            set(state => ({ messages: [...state.messages, modelMessage] }));

            await generateResponseStream(message, get().documents, (chunk) => {
                set(state => {
                    const lastMessage = state.messages[state.messages.length - 1];
                    if (lastMessage && lastMessage.role === 'model') {
                        const updatedContent = (typeof lastMessage.content === 'string' ? lastMessage.content : '') + chunk;
                        const updatedMessages = [...state.messages.slice(0, -1), { ...lastMessage, content: updatedContent }];
                        return { messages: updatedMessages };
                    }
                    return state;
                });
            });

            // Finalize the message
            set(state => {
                const lastMessage = state.messages[state.messages.length - 1];
                let finalContent: string | ChartData | FileDownloadData = typeof lastMessage.content === 'string' ? lastMessage.content : '';

                if (typeof lastMessage.content === 'string') {
                    const finalContentStr = lastMessage.content;
                    const chartRegex = /<<CHART_JSON>>(.*?)<<END>>/s;
                    const fileRegex = /<<FILE_DOWNLOAD>>(.*?)<<END>>/s;
            
                    const chartMatch = finalContentStr.match(chartRegex);
                    const fileMatch = finalContentStr.match(fileRegex);
            
                    let jsonString: string | null = null;
            
                    if (chartMatch?.[1]) {
                        jsonString = chartMatch[1].trim();
                    } else if (fileMatch?.[1]) {
                        jsonString = fileMatch[1].trim();
                    }
            
                    if (jsonString) {
                        try {
                            finalContent = JSON.parse(jsonString);
                        } catch (e) {
                            console.error("Failed to parse JSON from AI response:", e);
                            finalContent = `Error: The AI returned invalid structured data.`;
                        }
                    }
                }

                const finalModelMessage: ChatMessage = { role: 'model', content: finalContent, isStreaming: false };
                const updatedMessages = [...state.messages.slice(0, -1), finalModelMessage];
                
                const currentHistoryId = Object.keys(get().chatHistories).find(id => get().chatHistories[id].messages === get().messages);
                if (currentHistoryId) {
                    const newHistories = { ...get().chatHistories, [currentHistoryId]: { ...get().chatHistories[currentHistoryId], messages: updatedMessages }};
                    storageService.saveChatHistories(newHistories);
                    return { messages: updatedMessages, isLoading: false, chatHistories: newHistories };
                }

                return { messages: updatedMessages, isLoading: false };
            });
        },

        newChat: () => {
             set({ 
                messages: [initialMessage], 
                documents: [],
                fileObjects: {},
                ...resetModuleOutputs() 
            });
            storageService.saveDocuments([]);
        },

        saveChat: (name) => {
            const id = Date.now().toString();
            set(state => {
                const newHistories = { ...state.chatHistories, [id]: { id, name, messages: state.messages } };
                storageService.saveChatHistories(newHistories);
                return { chatHistories: newHistories };
            });
        },

        loadChat: (id) => {
            const chat = get().chatHistories[id];
            if (chat) {
                set({ messages: chat.messages, ...resetModuleOutputs() });
            }
        },
        
        deleteChat: (id) => {
             set(state => {
                const newHistories = { ...state.chatHistories };
                delete newHistories[id];
                storageService.saveChatHistories(newHistories);
                if(state.messages === state.chatHistories[id]?.messages) {
                     return { chatHistories: newHistories, messages: [initialMessage] };
                }
                return { chatHistories: newHistories };
            });
        },

        renameChat: (id, newName) => {
            set(state => {
                if (state.chatHistories[id]) {
                    const newHistories = { ...state.chatHistories, [id]: { ...state.chatHistories[id], name: newName }};
                    storageService.saveChatHistories(newHistories);
                    return { chatHistories: newHistories };
                }
                return state;
            });
        },
        
        // AI Module Actions
        generateSuggestions: () => _runAiModule('suggestions', () => generateSuggestions(get().documents), 'suggestions'),
        organizeFile: (file) => _runAiModule('organizer', () => organizeFile(file), 'organizedFileResult'),
        generateHealthScore: () => _runAiModule('healthScore', () => generateHealthScore(get().documents), 'healthScore'),
        addLoan: (loan) => set(state => {
            const newLoans = [...state.loans, { ...loan, id: Date.now().toString() }];
            storageService.saveLoans(newLoans);
            return { loans: newLoans };
        }),
        removeLoan: (id) => set(state => {
            const newLoans = state.loans.filter(l => l.id !== id);
            storageService.saveLoans(newLoans);
            return { loans: newLoans };
        }),
        generateLoanAnalysis: () => _runAiModule('loan', () => generateLoanAnalysis(get().loans, get().documents), 'loanAnalysis'),
        generateComplianceDeadlines: () => _runAiModule('compliance', () => generateComplianceCalendar(get().documents), 'complianceDeadlines'),
        setScenario: (scenario) => set({ scenario }),
        generateScenarioAnalysis: () => _runAiModule('scenario', () => generateScenarioAnalysis(get().scenario, get().documents), 'scenarioAnalysis'),
        generateProfitabilityAnalysis: () => _runAiModule('profitability', () => generateProfitabilityAnalysis(get().documents), 'profitabilityAnalysis'),
        generateReport: (reportType, mode, fileId) => {
            const { documents, ledger, setError } = get();
            let contextDocs: DocumentData[];

            if (mode === 'Books') {
                if (ledger.length === 0) {
                    setError("Cannot generate 'From Books' report: No transactions have been posted to the ledger.");
                    return Promise.resolve();
                }
                const ledgerContent = "Date,Narration,Debit Account,Credit Account,Amount\n" + 
                    ledger.map(e => `"${e.date}","${e.narration}","${e.debitAccount}","${e.creditAccount}",${e.amount}`).join('\n');
                
                contextDocs = [{
                    id: 'ledger-data-for-report',
                    name: 'Internal Company Ledger',
                    content: ledgerContent,
                    type: 'Journal & Ledger',
                    size: ledgerContent.length,
                    mimeType: 'text/csv',
                    sha256: '', // Not relevant for this pseudo-doc
                    uploadedAt: new Date().toISOString(),
                    status: 'Posted',
                    logs: [],
                    version: 1,
                    source: 'scan' // using 'scan' as a generic internal source
                }];
            } else { // 'File' mode
                if (!fileId) {
                    setError("Please select a file to generate a report from.");
                    return Promise.resolve();
                }
                const doc = documents.find(d => d.id === fileId);
                if (!doc) {
                    setError("Selected file not found.");
                    return Promise.resolve();
                }
                contextDocs = [doc];
            }

            return _runAiModule('report', () => generateReportService(reportType, contextDocs), 'report');
        },
        scanInvoice: (img) => _runAiModule('scanner', async () => {
            const mimeType = img.substring(img.indexOf(':') + 1, img.indexOf(';'));
            const base64Image = img.split(',')[1];
            const data = await extractInvoiceData(base64Image, mimeType);
            
            const invoiceTextContent = `Scanned Invoice: ${JSON.stringify(data, null, 2)}`;
            const hash = await calculateFileHash(new Blob([invoiceTextContent]));
            const docId = `scanned-${hash}`;
            const newDoc: DocumentData = {
                id: docId,
                name: `scanned-invoice-${data.invoice_number || new Date().toISOString()}.txt`,
                content: invoiceTextContent,
                size: invoiceTextContent.length,
                mimeType: 'text/plain',
                sha256: hash,
                uploadedAt: new Date().toISOString(),
                type: 'Invoice',
                status: 'Validated',
                logs: [
                    { timestamp: new Date().toISOString(), message: 'File created from invoice scan.' },
                    { timestamp: new Date().toISOString(), message: `Classification complete. Type: Invoice` }
                ],
                version: 1,
                source: 'scan'
            };
            set(state => ({ documents: [...state.documents, newDoc] }));

            return { data, image: img };
        }, 'invoiceData'),
        generateThreeWayMatch: (poId, grnId, invoiceId) => {
            const { documents } = get();
            const po = documents.find(d => d.id === poId);
            const grn = documents.find(d => d.id === grnId);
            const invoice = documents.find(d => d.id === invoiceId);
            if (!po || !grn || !invoice) return Promise.resolve();
            return _runAiModule('threeWayMatch', () => generateThreeWayMatch(po, grn, invoice), 'threeWayMatchResult');
        },
        generateVendorRiskAnalysis: (docIds) => {
            const docs = get().documents.filter(d => docIds.includes(d.id));
            if (docs.length === 0) return Promise.resolve();
            return _runAiModule('vendorRisk', () => generateVendorRiskAnalysis(docs), 'vendorRiskProfile');
        },
        generateFixSuggestion: (docId: string) => {
            const doc = get().documents.find(d => d.id === docId);
            if (!doc) return Promise.resolve();
            return _runAiModule('fixSuggestion', () => generateFixSuggestion(doc), null, (suggestion) => {
                get().updateDocument(docId, { fixSuggestion: suggestion });
            });
        },
        addLitigationCase: (caseDetails) => {
            const newCase: LitigationCase = { ...caseDetails, id: Date.now().toString() };
            set(state => {
                const newCases = [...state.litigationCases, newCase];
                storageService.saveLitigationCases(newCases);
                return { litigationCases: newCases };
            });
        },
        removeLitigationCase: (caseId) => {
            set(state => {
                const newCases = state.litigationCases.filter(c => c.id !== caseId);
                storageService.saveLitigationCases(newCases);
                return { litigationCases: newCases };
            });
        },
        generateLitigationDraft: (caseId) => {
            const { litigationCases, documents } = get();
            const caseDetails = litigationCases.find(c => c.id === caseId);
            if (!caseDetails) return Promise.resolve();
            const relevantDocs = documents.filter(d => caseDetails.relevantDocIds.includes(d.id));
            return _runAiModule('litigation', () => generateLitigationDraft(caseDetails, relevantDocs), 'litigationDraft');
        },
        generateGstReconciliation: (purchaseRegisterId: string, gstr2bId: string) => {
            const { documents } = get();
            const purchaseRegister = documents.find(d => d.id === purchaseRegisterId);
            const gstr2b = documents.find(d => d.id === gstr2bId);
            if (!purchaseRegister || !gstr2b) return Promise.resolve();
            return _runAiModule('gstReconciliation', () => generateGstReconciliation(purchaseRegister, gstr2b), 'gstReconciliationResult');
        },
        generateBankReconciliation: (bankStatementId: string, booksId: string) => {
            const { documents } = get();
            const bankStatement = documents.find(d => d.id === bankStatementId);
            const books = documents.find(d => d.id === booksId);
            if (!bankStatement || !books) return Promise.resolve();
            return _runAiModule('bankReconciliation', () => generateBankReconciliation(bankStatement, books), 'bankReconciliationResult');
        },

        // UI Actions
        setIsLeftSidebarOpen: (isOpen) => set({ isLeftSidebarOpen: isOpen }),
        setIsRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
        toggleLeftSidebar: () => set(state => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen, isRightSidebarOpen: false })),
        toggleRightSidebar: () => set(state => ({ isRightSidebarOpen: !state.isRightSidebarOpen, isLeftSidebarOpen: false })),
        setIsShortcutsModalOpen: (isOpen) => set({ isShortcutsModalOpen: isOpen }),
        setPasswordModalState: (state) => set({ passwordModalState: state }),
        setLogsModalState: (state) => set({ logsModalState: state }),
        setViewerModalState: (state) => set({ viewerModalState: state }),
    };
});
