
import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { DocumentData, FileDownloadData } from '../types';
import { TableCellsIcon, DownloadIcon } from './icons';
import { downloadFileFromBase64 } from '../utils/fileUtils';

export const ExcelOrganizer: React.FC = () => {
    const { files, result, activeAiModule, organizeFile } = useAppStore(state => ({
        files: state.documents,
        result: state.organizedFileResult,
        activeAiModule: state.activeAiModule,
        organizeFile: state.organizeFile,
    }));

    const excelFiles = files.filter(f => f.mimeType.includes('sheet') || f.mimeType.includes('csv'));
    const [selectedFileId, setSelectedFileId] = useState<string>('');
    const isLoading = activeAiModule === 'organizer';
    const isButtonDisabled = !selectedFileId || (activeAiModule !== null && !isLoading);


    React.useEffect(() => {
        // If no file is selected but there are files available, select the first one
        if (!selectedFileId && excelFiles.length > 0) {
            setSelectedFileId(excelFiles[0].id);
        }
        // If the selected file is no longer in the list (e.g., it was removed), update selection
        if (selectedFileId && !excelFiles.some(f => f.id === selectedFileId)) {
             setSelectedFileId(excelFiles.length > 0 ? excelFiles[0].id : '');
        }
        // If there are no excel files, clear selection
        if (excelFiles.length === 0) {
            setSelectedFileId('');
        }
    }, [files, excelFiles, selectedFileId]);

    const handleGenerateClick = () => {
        const fileToOrganize = excelFiles.find(f => f.id === selectedFileId);
        if (fileToOrganize) {
            organizeFile(fileToOrganize);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        
        const mimeType = result.file.file_type === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        downloadFileFromBase64(result.file.content, result.file.file_name, mimeType);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Excel & CSV Organizer</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg space-y-4">
                
                <div>
                    <label htmlFor="fileSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select a file to clean</label>
                    <select 
                        id="fileSelect" 
                        value={selectedFileId}
                        onChange={(e) => setSelectedFileId(e.target.value)}
                        className="mt-1 block w-full bg-gray-200 dark:bg-accent/50 border-gray-300 dark:border-accent rounded-md shadow-sm p-2 text-sm"
                        disabled={excelFiles.length === 0}
                    >
                        {excelFiles.length > 0 ? (
                            excelFiles.map(file => (
                                <option key={file.id} value={file.id}>{file.name}</option>
                            ))
                        ) : (
                            <option>Upload an Excel/CSV file</option>
                        )}
                    </select>
                </div>

                <button
                    onClick={handleGenerateClick}
                    disabled={isButtonDisabled || isLoading}
                    className="w-full bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2"
                >
                    <TableCellsIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Organizing...' : 'Clean & Organize File'}</span>
                </button>

                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                     <div className={`transition-opacity duration-500 w-full ${!isLoading && result ? 'opacity-100' : 'opacity-0'}`}>
                        {result && (
                            <div className="w-full text-left space-y-3">
                                <div className="prose prose-sm max-w-none w-full dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                                   {result.summary}
                                </div>
                                 <button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span className="truncate">{result.file.file_name}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    {!isLoading && !result && (
                         <p className="text-center text-gray-500 dark:text-accent text-sm">
                            {excelFiles.length > 0 
                                ? "Select a file and click the button to clean and reformat it."
                                : "Upload an Excel or CSV file to enable this feature."
                            }
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
