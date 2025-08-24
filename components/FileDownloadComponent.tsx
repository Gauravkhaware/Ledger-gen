
import React from 'react';
import type { FileDownloadData } from '../types';
import { DownloadIcon } from './icons';
import { downloadFileFromBase64 } from '../utils/fileUtils';

interface FileDownloadComponentProps {
    fileData: FileDownloadData;
}

export const FileDownloadComponent: React.FC<FileDownloadComponentProps> = ({ fileData }) => {
    
    const handleDownload = () => {
        let mimeType = '';
        switch(fileData.file_type) {
            case 'excel':
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'pdf':
                mimeType = 'application/pdf';
                break;
            case 'csv':
                mimeType = 'text/csv';
                break;
            case 'json':
                mimeType = 'application/json';
                break;
            case 'xml':
                mimeType = 'application/xml';
                break;
            default:
                mimeType = 'application/octet-stream';
        }

        downloadFileFromBase64(fileData.content, fileData.file_name, mimeType);
    };

    return (
        <div className="w-full p-2 bg-primary-light/50 dark:bg-primary/50 rounded-lg">
            <p className="text-sm font-semibold mb-2 text-dark dark:text-light">
                Your file is ready to download:
            </p>
            <button
                onClick={handleDownload}
                className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
            >
                <DownloadIcon className="w-5 h-5" />
                <span className="truncate">{fileData.file_name}</span>
            </button>
        </div>
    );
};
