
export const calculateFileHash = async (file: Blob): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};

/**
 * Masks sensitive identifiers like PAN, Aadhaar, Bank Account numbers.
 * Keeps the last 4 characters visible.
 * @param value The string value to mask.
 * @returns The masked string.
 */
export const maskPII = (value: string): string => {
    if (typeof value !== 'string' || value.length <= 4) {
        return value;
    }
    const visiblePart = value.slice(-4);
    const maskedPart = '*'.repeat(value.length - 4);
    return maskedPart + visiblePart;
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

export const downloadFileFromBase64 = (base64Content: string, fileName: string, mimeType: string) => {
    try {
        const blob = base64ToBlob(base64Content, mimeType);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to decode or download the file:", error);
        alert("Sorry, there was an error downloading the file. The data may be corrupted.");
    }
};
