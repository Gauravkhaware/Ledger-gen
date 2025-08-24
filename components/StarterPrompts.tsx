import React from 'react';

interface StarterPromptsProps {
    onPromptClick: (prompt: string) => void;
    filesUploaded: boolean;
}

const prompts = [
    "What were the total sales last month?",
    "Generate a Profit & Loss statement.",
    "Show me a breakdown of my top 5 expenses.",
    "Are there any unusual transactions I should look at?",
];

export const StarterPrompts: React.FC<StarterPromptsProps> = ({ onPromptClick, filesUploaded }) => {
    const title = filesUploaded 
        ? "Try these examples:" 
        : "Upload a file to get started, then try these examples:";

    return (
        <div className="px-4 pb-2 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {prompts.map(prompt => (
                    <button
                        key={prompt}
                        onClick={() => onPromptClick(prompt)}
                        disabled={!filesUploaded}
                        className="p-2 text-sm text-left bg-secondary-light dark:bg-secondary rounded-lg border border-accent-light dark:border-accent hover:bg-accent-light/50 dark:hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
};