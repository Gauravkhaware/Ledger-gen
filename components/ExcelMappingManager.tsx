import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { MapIcon, TrashIcon } from './icons';

export const ExcelMappingManager: React.FC = () => {
    const { mappings, deleteMapping } = useAppStore(state => ({
        mappings: state.excelMappings,
        deleteMapping: state.deleteMapping,
    }));
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light flex items-center space-x-2">
                <MapIcon className="w-6 h-6" />
                <span>Saved Mappings</span>
            </h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                 {mappings.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {mappings.map(mapping => (
                            <div key={mapping.id} className="p-2 bg-primary-light dark:bg-primary rounded-md text-sm">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate text-dark dark:text-light" title={mapping.fileNamePattern}>
                                        {mapping.fileNamePattern}
                                    </p>
                                    <button onClick={() => deleteMapping(mapping.id)} className="p-1 rounded-full hover:bg-accent-light dark:hover:bg-accent">
                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-accent mt-1">
                                    {Object.keys(mapping.headers).length} fields mapped. Last used: {new Date(mapping.lastUsed).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-accent py-4">
                        <p>No mappings saved yet.</p>
                        <p className="text-xs mt-1">Process an Excel or CSV file to save its column mapping for future use.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};
