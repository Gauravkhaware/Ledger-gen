import type { DocumentData, ChatHistoryItem, Loan, ExcelMapping, LedgerEntry, LedgerMapping, LitigationCase } from '../types';

const STORAGE_KEYS = {
    DOCUMENTS: 'ledgerGenie_documents',
    CHAT_HISTORIES: 'ledgerGenie_chatHistories',
    LOANS: 'ledgerGenie_loans',
    EXCEL_MAPPINGS: 'ledgerGenie_excelMappings',
    LEDGER: 'ledgerGenie_ledger',
    LEDGER_MAPPINGS: 'ledgerGenie_ledgerMappings',
    LITIGATION_CASES: 'ledgerGenie_litigationCases',
};

// Helper to safely get items from localStorage
const get = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper to safely set items in localStorage
const set = (key: string, value: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

export const storageService = {
    // --- Documents ---
    getDocuments: (): DocumentData[] => {
        // The stored documents are missing 'content' and 'evidence' to save space.
        const storedDocs = get<Omit<DocumentData, 'content' | 'evidence'>[]>(STORAGE_KEYS.DOCUMENTS, []);
        
        // Rehydrate the documents to match the full DocumentData type.
        // On reload, content is lost, which is consistent with fileObjects not being persisted.
        return storedDocs.map(doc => ({
            ...doc,
            content: '',
            evidence: [],
        }));
    },
    saveDocuments: (documents: DocumentData[]) => {
        // Omit large fields to avoid exceeding localStorage quota.
        const documentsForStorage = documents.map(({ content, evidence, ...rest }) => {
            return rest;
        });
        set(STORAGE_KEYS.DOCUMENTS, documentsForStorage);
    },

    // --- Chat Histories ---
    getChatHistories: (): Record<string, ChatHistoryItem> => get(STORAGE_KEYS.CHAT_HISTORIES, {}),
    saveChatHistories: (histories: Record<string, ChatHistoryItem>) => set(STORAGE_KEYS.CHAT_HISTORIES, histories),
    
    // --- Loans ---
    getLoans: (): Loan[] => get(STORAGE_KEYS.LOANS, []),
    saveLoans: (loans: Loan[]) => set(STORAGE_KEYS.LOANS, loans),

    // --- Excel Mappings ---
    getExcelMappings: (): ExcelMapping[] => get(STORAGE_KEYS.EXCEL_MAPPINGS, []),
    saveExcelMappings: (mappings: ExcelMapping[]) => set(STORAGE_KEYS.EXCEL_MAPPINGS, mappings),

    // --- Ledger ---
    getLedger: (): LedgerEntry[] => get(STORAGE_KEYS.LEDGER, []),
    saveLedger: (ledger: LedgerEntry[]) => set(STORAGE_KEYS.LEDGER, ledger),

    // --- Ledger Mappings ---
    getLedgerMappings: (): LedgerMapping[] => get(STORAGE_KEYS.LEDGER_MAPPINGS, []),
    saveLedgerMappings: (mappings: LedgerMapping[]) => set(STORAGE_KEYS.LEDGER_MAPPINGS, mappings),

    // --- Litigation Cases ---
    getLitigationCases: (): LitigationCase[] => get(STORAGE_KEYS.LITIGATION_CASES, []),
    saveLitigationCases: (cases: LitigationCase[]) => set(STORAGE_KEYS.LITIGATION_CASES, cases),
};