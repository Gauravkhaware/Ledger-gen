
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, SUGGESTIONS_INSTRUCTION, HEALTH_SCORE_INSTRUCTION, LOAN_ANALYSIS_INSTRUCTION, COMPLIANCE_CALENDAR_INSTRUCTION, SCENARIO_PLANNER_INSTRUCTION, PROFITABILITY_ANALYSIS_INSTRUCTION, REPORTS_INSTRUCTION, INVOICE_SCANNER_INSTRUCTION, EXCEL_ORGANIZER_INSTRUCTION, DOCUMENT_CLASSIFIER_INSTRUCTION, THREE_WAY_MATCH_INSTRUCTION, VENDOR_RISK_INSTRUCTION, FIX_SUGGESTION_INSTRUCTION, LITIGATION_ASSISTANT_INSTRUCTION, GST_RECONCILIATION_INSTRUCTION, BANK_RECONCILIATION_INSTRUCTION } from '../constants';
import type { DocumentData, Loan, ScenarioInput, ReportType, ExtractedInvoice, FileDownloadData, DocumentType, VendorRiskProfile, LitigationCase } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

// Constants to manage context size and prevent exceeding API token limits
const MAX_CHARS_PER_DOC = 8000; // Max characters to include from a single document
const MAX_TOTAL_CHARS_IN_PROMPT = 500000; // Max total characters for all documents in a prompt

const callGemini = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.3,
                topP: 0.95,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Error communicating with the AI model: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI model.");
    }
};

const buildPromptWithDocuments = (instruction: string, documents: DocumentData[]): string => {
    let fullPrompt = `${instruction}\n\n`;
    let totalChars = 0;
    let docsIncludedCount = 0;

    if (documents.length > 0) {
        fullPrompt += "Here is the data from the uploaded and classified documents for context:\n\n";
        
        for (const doc of documents) {
            let docContent = doc.content;
            const header = `--- START OF DOCUMENT (fileId: ${doc.id}, Type: ${doc.type}): ${doc.name} ---\n`;
            const footer = `\n--- END OF DOCUMENT: ${doc.name} ---\n\n`;

            // Truncate individual document if it's too long, preserving the start and end
            if (docContent.length > MAX_CHARS_PER_DOC) {
                const half = Math.floor(MAX_CHARS_PER_DOC / 2);
                docContent = `${docContent.substring(0, half)}\n\n... [Content Truncated for Brevity] ...\n\n${docContent.substring(docContent.length - half)}`;
            }
            
            const segmentLength = header.length + docContent.length + footer.length;

            // Check if adding this document would exceed the total prompt limit
            if (totalChars + segmentLength > MAX_TOTAL_CHARS_IN_PROMPT) {
                const remainingDocs = documents.length - docsIncludedCount;
                if (remainingDocs > 0) {
                    fullPrompt += `[... and ${remainingDocs} more document(s) not included in context due to size limit.]\n\n`;
                }
                break; // Stop adding more documents
            }

            fullPrompt += header + docContent + footer;
            totalChars += segmentLength;
            docsIncludedCount++;
        }
    }
    return fullPrompt;
};

export const classifyDocument = async (document: Pick<DocumentData, 'name' | 'content'>): Promise<DocumentType> => {
    try {
        const prompt = `
            ${DOCUMENT_CLASSIFIER_INSTRUCTION}

            File Name: ${document.name}
            File Content (first 500 characters):
            ---
            ${document.content.substring(0, 500)}
            ---
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING }
                    },
                    required: ["type"]
                }
            }
        });
        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString) as { type: DocumentType };
        return parsed.type;
    } catch (error) {
        console.error("Gemini API call for classification failed:", error);
        return 'Other'; // Fallback to 'Other' on error
    }
};

export const generateResponseStream = async (
    userPrompt: string,
    documents: DocumentData[],
    onChunk: (chunk: string) => void
): Promise<void> => {
    let fullPrompt = buildPromptWithDocuments(SYSTEM_INSTRUCTION, documents);
    if (documents.length === 0) {
        fullPrompt += "No documents have been uploaded. Please answer the user's query based on general knowledge or ask them to upload relevant documents.\n\n";
    }
    fullPrompt += `User Query: "${userPrompt}"\n\nAssistant Response:`;

    try {
        const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: fullPrompt,
            config: {
                temperature: 0.3,
                topP: 0.95,
            },
        });

        for await (const chunk of responseStream) {
            onChunk(chunk.text);
        }
    } catch (error) {
        console.error("Gemini API stream call failed:", error);
        const errorMessage = error instanceof Error 
            ? `Error communicating with the AI model: ${error.message}`
            : "An unknown error occurred while communicating with the AI model.";
        onChunk(`\n\n**Error:** ${errorMessage}`);
    }
};


export const generateSuggestions = async (documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to generate suggestions.";
    let fullPrompt = buildPromptWithDocuments(SUGGESTIONS_INSTRUCTION, documents);
    fullPrompt += `\n\nBased on the data, provide your analysis and suggestions:`;
    return await callGemini(fullPrompt);
};

export const organizeFile = async (file: DocumentData): Promise<{ summary: string; file: FileDownloadData }> => {
    try {
        const fullPrompt = `
            ${EXCEL_ORGANIZER_INSTRUCTION}

            Here is the content of the file to be cleaned and organized.
            File Name: ${file.name}

            --- FILE CONTENT START ---
            ${file.content}
            --- FILE CONTENT END ---

            Please process this file and provide the result in the specified format.
        `;

        const responseText = await callGemini(fullPrompt);

        // Parse the mixed response
        const downloadToken = '<<FILE_DOWNLOAD>>';
        const endToken = '<<END>>';

        const downloadStartIndex = responseText.indexOf(downloadToken);
        const endTokenIndex = responseText.indexOf(endToken, downloadStartIndex);

        if (downloadStartIndex === -1 || endTokenIndex === -1) {
            throw new Error("AI response did not contain a valid file download block.");
        }

        const summary = responseText.substring(0, downloadStartIndex).trim();
        const jsonString = responseText.substring(downloadStartIndex + downloadToken.length, endTokenIndex).trim();

        const fileData = JSON.parse(jsonString) as FileDownloadData;

        return { summary, file: fileData };

    } catch (error) {
        console.error("Gemini API call for file organization failed:", error);
        if (error instanceof Error) {
            throw new Error(`Error organizing file: ${error.message}`);
        }
        throw new Error("An unknown error occurred while organizing the file.");
    }
};


export const generateHealthScore = async (documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to calculate a health score.";
    let fullPrompt = buildPromptWithDocuments(HEALTH_SCORE_INSTRUCTION, documents);
    fullPrompt += `\n\nBased on the data, provide your analysis and the Business Health Score:`;
    return await callGemini(fullPrompt);
};

export const generateLoanAnalysis = async (loans: Loan[], documents: DocumentData[]): Promise<string> => {
    if (loans.length === 0) return "Please add at least one loan to generate an analysis.";
    
    let fullPrompt = buildPromptWithDocuments(LOAN_ANALYSIS_INSTRUCTION, documents);

    fullPrompt += "Here are the loan details provided by the user:\n\n";
    loans.forEach(loan => {
        fullPrompt += `Loan Name: ${loan.name}\n`;
        fullPrompt += `Principal Amount: ${loan.principal}\n`;
        fullPrompt += `Annual Interest Rate: ${loan.interestRate}%\n`;
        fullPrompt += `Loan Tenure: ${loan.tenure} years\n\n`;
    });

    fullPrompt += `\n\nBased on the loan data and any provided financial documents, provide your analysis and advice:`;
    return await callGemini(fullPrompt);
};

export const generateComplianceCalendar = async (documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to generate a personalized compliance calendar.";
    let fullPrompt = buildPromptWithDocuments(COMPLIANCE_CALENDAR_INSTRUCTION, documents);
    fullPrompt += `\n\nBased on the data, provide a personalized list of upcoming compliance deadlines:`;
    return await callGemini(fullPrompt);
};

export const generateScenarioAnalysis = async (scenario: ScenarioInput, documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to run a scenario analysis.";
    let fullPrompt = buildPromptWithDocuments(SCENARIO_PLANNER_INSTRUCTION, documents);
    
    const valueString = scenario.valueType === 'Percentage' ? `${scenario.value}%` : `₹${scenario.value}`;
    fullPrompt += `Here is the "What-If" scenario to analyze:\n\n`;
    fullPrompt += `Scenario: ${scenario.changeType} ${scenario.metric} by ${valueString}.\n\n`;
    
    fullPrompt += `\n\nBased on this scenario and the provided financial documents, provide your analysis:`;
    return await callGemini(fullPrompt);
};

export const generateProfitabilityAnalysis = async (documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to analyze profitability.";
    let fullPrompt = buildPromptWithDocuments(PROFITABILITY_ANALYSIS_INSTRUCTION, documents);
    fullPrompt += `\n\nBased on the data, provide your profitability analysis:`;
    return await callGemini(fullPrompt);
};

export const generateReport = async (reportType: ReportType, documents: DocumentData[]): Promise<string> => {
    if (documents.length === 0) return "Please upload documents to generate a report.";
    let fullPrompt = buildPromptWithDocuments(REPORTS_INSTRUCTION, documents);
    fullPrompt += `The user has requested a "${reportType}" report.\n\n`;
    fullPrompt += `\n\nPlease generate the ${reportType} report based on the provided documents:`;
    return await callGemini(fullPrompt);
};

export const extractInvoiceData = async (base64Image: string, mimeType: string): Promise<ExtractedInvoice> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };
        const textPart = { text: INVOICE_SCANNER_INSTRUCTION };

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vendor_name: { type: Type.STRING },
                        invoice_number: { type: Type.STRING },
                        invoice_date: { type: Type.STRING },
                        total_amount: { type: Type.NUMBER },
                        tax_amount: { type: Type.NUMBER },
                        currency: { type: Type.STRING },
                        line_items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    item: { type: Type.STRING },
                                    quantity: { type: Type.NUMBER },
                                    unit_price: { type: Type.NUMBER },
                                    tax_rate: { type: Type.NUMBER },
                                    total: { type: Type.NUMBER },
                                },
                                required: ["item", "quantity", "unit_price", "tax_rate", "total"]
                            }
                        }
                    },
                    required: ["vendor_name", "invoice_number", "invoice_date", "total_amount", "tax_amount", "currency", "line_items"]
                }
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as ExtractedInvoice;

    } catch (error) {
        console.error("Gemini API call for invoice extraction failed:", error);
        if (error instanceof Error) {
            throw new Error(`Error extracting data from image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while extracting data from the image.");
    }
};

export const generateThreeWayMatch = async (po: DocumentData, grn: DocumentData, invoice: DocumentData): Promise<string> => {
    const prompt = `
        ${THREE_WAY_MATCH_INSTRUCTION}

        Here are the documents to match:

        --- START OF PURCHASE ORDER (fileId: ${po.id}) ---
        ${po.content}
        --- END OF PURCHASE ORDER ---

        --- START OF GOODS RECEIPT NOTE (fileId: ${grn.id}) ---
        ${grn.content}
        --- END OF GOODS RECEIPT NOTE ---

        --- START OF INVOICE (fileId: ${invoice.id}) ---
        ${invoice.content}
        --- END OF INVOICE ---

        Please perform the three-way match analysis.
    `;
    return await callGemini(prompt);
};

export const generateVendorRiskAnalysis = async (documents: DocumentData[]): Promise<VendorRiskProfile> => {
    const prompt = buildPromptWithDocuments(VENDOR_RISK_INSTRUCTION, documents);
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        vendorName: { type: Type.STRING },
                        riskScore: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        positiveFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        negativeFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["vendorName", "riskScore", "summary", "positiveFactors", "negativeFactors"]
                }
            }
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as VendorRiskProfile;
    } catch (error) {
        console.error("Gemini API call for vendor risk analysis failed:", error);
        if (error instanceof Error) {
            throw new Error(`Error analyzing vendor risk: ${error.message}`);
        }
        throw new Error("An unknown error occurred during vendor risk analysis.");
    }
};

export const generateFixSuggestion = async (document: DocumentData): Promise<string> => {
    const prompt = `
        ${FIX_SUGGESTION_INSTRUCTION}

        ## Document Context
        - **File Name:** ${document.name}
        - **Document Type:** ${document.type}
        - **Exception Reason:** ${document.exceptionReason}

        ## Document Content (first 500 characters)
        ---
        ${document.content.substring(0, 500)}
        ---

        Please provide your fix suggestion checklist based on the information above.
    `;
    return await callGemini(prompt);
};

export const generateLitigationDraft = async (caseDetails: LitigationCase, documents: DocumentData[]): Promise<string> => {
    let prompt = buildPromptWithDocuments(LITIGATION_ASSISTANT_INSTRUCTION, documents);
    prompt += `
        ## Case Details
        - **Case/Notice Name:** ${caseDetails.caseName}
        - **Issuing Authority:** ${caseDetails.authority}
        - **Notice Date:** ${caseDetails.noticeDate}
        - **Summary of Issue:** ${caseDetails.details}

        Based on the case details and the provided document context, please generate a professional draft response.
    `;
    return await callGemini(prompt);
};

export const generateGstReconciliation = async (purchaseRegister: DocumentData, gstr2b: DocumentData): Promise<string> => {
    const prompt = `
        ${GST_RECONCILIATION_INSTRUCTION}

        Here are the two documents to reconcile:

        --- START OF PURCHASE REGISTER (fileId: ${purchaseRegister.id}) ---
        ${purchaseRegister.content}
        --- END OF PURCHASE REGISTER ---

        --- START OF GSTR-2B (fileId: ${gstr2b.id}) ---
        ${gstr2b.content}
        --- END OF GSTR-2B ---

        Please perform the GST reconciliation and generate the report as specified.
    `;
    return await callGemini(prompt);
};

export const generateBankReconciliation = async (bankStatement: DocumentData, books: DocumentData): Promise<string> => {
    const prompt = `
        ${BANK_RECONCILIATION_INSTRUCTION}

        Here are the two documents to reconcile:

        --- START OF BANK STATEMENT (fileId: ${bankStatement.id}) ---
        ${bankStatement.content}
        --- END OF BANK STATEMENT ---

        --- START OF COMPANY BOOKS (fileId: ${books.id}) ---
        ${books.content}
        --- END OF COMPANY BOOKS ---

        Please perform the Bank Reconciliation and generate the report as specified.
    `;
    return await callGemini(prompt);
};
