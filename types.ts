
export type DocumentType =
  'Invoice' | 'Bank Statement' | 'GST Filing' | 'TDS Certificate' |
  'Payroll Register' | 'Contract/Agreement' | 'Sales Register' | 'Purchase Register' |
  'Purchase Order' | 'Goods Receipt Note' | 'GSTR-2B' | 'Journal & Ledger' | 'Other' | 'Classifying...';

export type DocumentStatus = 
  'Uploaded' | 
  'Scanning' |
  'Classified' |
  'Awaiting Password' | 
  'Unlocking' | 
  'Invalid Password' |
  'Extracting Text' |
  'Classifying' |
  'Review Required' | 
  'Validating' |
  'Validated' |
  'Posted' |
  'Error';

export interface LogEntry {
    timestamp: string;
    message: string;
}

export interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface ExtractedField {
    id: string;
    key: string; // e.g., "invoice_number", "total_amount"
    value: string | number;
    normalizedValue?: string | number;
    page: number;
    bbox?: BoundingBox; // For PDFs/images
    cell?: string; // For spreadsheets, e.g., "A1"
    confidence: number;
    validatorFlags?: string[]; // e.g., ["checksum_failed", "date_out_of_range"]
}

export interface EvidenceLink {
    entryId: string; // Link to a ledger entry
    fieldId: string; // Link to a specific extracted field
}

export interface DocumentData {
    id: string; // Unique ID, e.g., a hash of content + name
    name: string;
    content: string; // Extracted text content
    size: number;
    mimeType: string;
    sha256: string; // For integrity checks
    uploadedAt: string;
    type: DocumentType;
    status: DocumentStatus;
    logs: LogEntry[];
    version: number;
    source: 'upload' | 'email' | 'scan' | 'split';
    folderContext?: string; // e.g., "FY24-25/Q2/Purchases"
    evidence?: ExtractedField[];
    evidenceLinks?: EvidenceLink[];
    isDuplicate?: boolean;
    duplicateOf?: string; // ID of the document it's a duplicate of
    reviewNotes?: string[];
    exceptionReason?: string | null; // Reason for Error or Review status
    fixSuggestion?: string; // AI-generated suggestion to fix the exception
    postedLedgerEntryIds?: string[]; // Link to ledger entries
}

export interface LedgerEntry {
    id: string; // Unique ID for the ledger entry
    date: string; // YYYY-MM-DD
    narration: string;
    debitAccount: string; // Mapped ledger code
    creditAccount: string; // Mapped ledger code
    amount: number;
    sourceDocumentId: string;
}

export interface LedgerMapping {
    account: 'Sales' | 'Purchases' | 'IGST Payable' | 'CGST Payable' | 'SGST Payable' | 'Accounts Receivable' | 'Accounts Payable';
    ledgerCode: string;
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie';
    title: string;
    labels: string[];
    datasets: ChartDataset[];
}

export interface FileDownloadData {
    file_name: string;
    file_type: 'excel' | 'pdf' | 'csv' | 'json' | 'xml';
    content: string; // base64 encoded string
    schemaVersion?: string; // e.g., "GSTR-1 v2.3"
    rulesetDate?: string; // e.g., "2024-05-15"
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string | ChartData | FileDownloadData;
    isStreaming?: boolean;
}

export interface Loan {
    id: string;
    name: string;
    principal: number;
    interestRate: number;
    tenure: number; // in years
}

export interface ScenarioInput {
    metric: string; 
    changeType: 'Increase' | 'Decrease';
    valueType: 'Percentage' | 'Amount';
    value: number;
}

export type ReportType = 
    'Profit & Loss' | 
    'Balance Sheet' | 
    'Cash Flow Statement' | 
    'Trial Balance' |
    'Journal & Ledger' |
    'GST Summary' |
    'GSTR-1' |
    'GSTR-3B' |
    'TDS Return (26Q)' |
    'Payroll Summary' |
    'Fixed Asset Register' |
    'Form 3CEB (Transfer Pricing)' |
    'FDI/FEMA Compliance Report' |
    'Litigation Response Draft' |
    'CSR Report';

export interface ExtractedInvoiceLineItem {
    item: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total: number;
}

export interface ExtractedInvoice {
    vendor_name: string;
    invoice_number: string;
    invoice_date: string; // YYYY-MM-DD
    total_amount: number;
    tax_amount: number;
    currency: 'INR';
    line_items: ExtractedInvoiceLineItem[];
}

export interface ChatHistoryItem {
    id: string;
    name: string;
    messages: ChatMessage[];
}

export interface ExcelMapping {
    id: string; // e.g., hash of filename or a user-given name
    fileNamePattern: string; // e.g., "monthly_sales_report_*.xlsx"
    lastUsed: string;
    headers: Record<string, string>; // { "Invoice No": "invoiceNumber", "Dt.": "date" }
}

export interface VendorRiskProfile {
    vendorName: string;
    riskScore: number; // 0-100
    summary: string;
    positiveFactors: string[];
    negativeFactors: string[];
}

export interface LitigationCase {
    id: string;
    caseName: string;
    authority: string; // e.g., "GST Department", "Income Tax"
    noticeDate: string; // YYYY-MM-DD
    details: string;
    relevantDocIds: string[];
}