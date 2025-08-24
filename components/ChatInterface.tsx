// --- Web Speech API Type Definitions for TypeScript ---
// This is to fix errors since the API is not standard across all TS DOM library versions.
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
  
interface SpeechRecognitionResult {
    readonly [index:number]: SpeechRecognitionAlternative;
    readonly length: number;
    readonly isFinal: boolean;
}
  
interface SpeechRecognitionResultList {
    readonly [index:number]: SpeechRecognitionResult;
    readonly length: number;
}
  
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start(): void;
    stop(): void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition; };
        webkitSpeechRecognition: { new(): SpeechRecognition; };
    }
}
// --- End of Type Definitions ---

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage, ChartData, FileDownloadData } from '../types';
import { SendIcon, UserIcon, BotIcon, MicrophoneIcon, BookOpenIcon } from './icons';
import { ChartComponent } from './ChartComponent';
import { FileDownloadComponent } from './FileDownloadComponent';
import { StarterPrompts } from './StarterPrompts';

interface ChatInterfaceProps {}

const isChartData = (content: any): content is ChartData => {
    return typeof content === 'object' && content !== null && 'type' in content && 'datasets' in content;
}

const isFileDownloadData = (content: any): content is FileDownloadData => {
    return typeof content === 'object' && content !== null && 'file_name' in content && 'file_type' in content;
}


const ChatMessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const store = useAppStore();
    const isUser = message.role === 'user';
    const bubbleClasses = isUser
        ? 'bg-highlight-light text-white'
        : 'bg-secondary-light dark:bg-secondary';
    const icon = isUser ? <UserIcon className="w-6 h-6 text-white" /> : <BotIcon className="w-6 h-6 text-dark dark:text-light" />;
    const iconContainerClasses = isUser ? 'bg-highlight-light' : 'bg-accent-light dark:bg-accent';
    const containerClasses = isUser
        ? 'flex-row-reverse'
        : 'flex-row';

    const getFileIdFromContent = (content: string): string | null => {
        const match = content.match(/fileId: '([^']+)'/);
        return match ? match[1] : null;
    };
    
    const fileId = typeof message.content === 'string' ? getFileIdFromContent(message.content) : null;
    const evidenceDoc = fileId ? store.documents.find(d => d.id === fileId) : null;

    const renderContent = () => {
        if (typeof message.content === 'string') {
            return (
                <div className="prose prose-sm max-w-none dark:prose-invert" style={{ whiteSpace: 'pre-wrap' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content + (message.isStreaming ? '▍' : '')}
                    </ReactMarkdown>
                    {evidenceDoc && (
                         <button 
                            onClick={() => store.setViewerModalState({ isOpen: true, doc: evidenceDoc })}
                            className="mt-2 text-xs bg-accent-light dark:bg-accent text-dark dark:text-light px-2 py-1 rounded-md flex items-center space-x-1 hover:opacity-80"
                         >
                            <BookOpenIcon className="w-4 h-4" />
                            <span>Open Evidence</span>
                         </button>
                    )}
                </div>
            );
        }
        if (isChartData(message.content)) {
            return <ChartComponent chartData={message.content} theme={store.theme} />;
        }
        if (isFileDownloadData(message.content)) {
            return <FileDownloadComponent fileData={message.content} />;
        }
        return null;
    };

    return (
        <div className={`flex items-start gap-3 my-2 ${containerClasses}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${iconContainerClasses}`}>
                {icon}
            </div>
            <div
                className={`max-w-xl rounded-lg p-3 ${bubbleClasses} ${typeof message.content === 'object' ? 'w-full' : ''}`}
            >
                {renderContent()}
            </div>
        </div>
    );
};

export const ChatInterface = forwardRef<HTMLInputElement, ChatInterfaceProps>(
    ({}, ref) => {
    const { messages, sendMessage, isLoading, theme, documents } = useAppStore(state => ({
        messages: state.messages,
        sendMessage: state.sendMessage,
        isLoading: state.isLoading,
        theme: state.theme,
        documents: state.documents,
    }));
    
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const filesUploaded = documents.length > 0;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput('');
        }
    };
    
    const handlePromptClick = (prompt: string) => {
        setInput(prompt);
        if (ref && 'current' in ref && ref.current) {
            ref.current.focus();
        }
    };


    const handleVoiceCommand = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support speech recognition.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
            setIsListening(true);
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                sendMessage(transcript);
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognitionRef.current.start();
    };


    return (
        <div className="flex flex-col h-full bg-primary-light dark:bg-primary transition-colors duration-300">
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <ChatMessageBubble key={index} message={msg} />
                    ))}
                    {messages.length <= 1 && !isLoading && (
                        <StarterPrompts onPromptClick={handlePromptClick} filesUploaded={filesUploaded} />
                    )}
                    {isLoading && !messages[messages.length-1].isStreaming && (
                        <div className="flex items-start gap-3 my-2 flex-row">
                             <div className="w-8 h-8 rounded-full bg-accent-light dark:bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                                <BotIcon className="w-6 h-6 text-dark dark:text-light" />
                            </div>
                            <div className="bg-secondary-light dark:bg-secondary rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 border-t border-accent-light dark:border-accent bg-secondary-light dark:bg-secondary transition-colors duration-300">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        ref={ref}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask about your financial data... (Ctrl+F to focus)"}
                        className="flex-grow bg-gray-200 dark:bg-accent/50 text-dark dark:text-light placeholder-gray-500 dark:placeholder-accent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-highlight-light dark:focus:ring-highlight"
                        disabled={isLoading || isListening}
                    />
                     <button
                        type="button"
                        onClick={handleVoiceCommand}
                        disabled={isLoading}
                        className={`p-2 rounded-lg disabled:opacity-50 transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-accent-light dark:hover:bg-accent'}`}
                        aria-label="Use voice command"
                        title="Use Voice Command"
                    >
                        <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'text-white' : 'text-dark dark:text-light'}`} />
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || isListening}
                        className="bg-highlight-light dark:bg-highlight text-white p-2 rounded-lg disabled:bg-gray-400 dark:disabled:bg-accent disabled:cursor-not-allowed hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
});