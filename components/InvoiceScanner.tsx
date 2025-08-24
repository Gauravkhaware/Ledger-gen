
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CameraIcon, CloseIcon } from './icons';
import type { ExtractedInvoice } from '../types';

interface InvoiceScannerProps {}

const CameraModal: React.FC<{ onClose: () => void; onCapture: (dataUrl: string) => void }> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                 alert("Camera access was denied. To use the scanner, please grant camera permissions in your browser's site settings.");
            } else {
                alert("Could not access camera. Please ensure it is connected and permissions are granted in your browser settings.");
            }
            onClose();
        }
    }, [onClose]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
                onClose();
            }
        }
    };
    
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-2xl p-4 border border-accent w-full max-w-2xl m-4 relative" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-light mb-2 text-center">Scan Document</h3>
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-black"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="mt-4 flex justify-center">
                    <button 
                        onClick={handleCapture} 
                        className="bg-highlight-light dark:bg-highlight text-white p-4 rounded-full shadow-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-transform transform hover:scale-110"
                        aria-label="Capture image"
                    >
                        <CameraIcon className="w-8 h-8" />
                    </button>
                </div>
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                    aria-label="Close camera view"
                >
                    <CloseIcon className="w-6 h-6 text-light" />
                </button>
            </div>
        </div>
    );
};

export const InvoiceScanner: React.FC<InvoiceScannerProps> = () => {
    const { invoiceData, activeAiModule, scanInvoice } = useAppStore(state => ({
        invoiceData: state.invoiceData,
        activeAiModule: state.activeAiModule,
        scanInvoice: state.scanInvoice,
    }));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const isLoading = activeAiModule === 'scanner';

    const handleCapture = (imageDataUrl: string) => {
        scanInvoice(imageDataUrl);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
    }
    
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-dark dark:text-light">Invoice Scanner</h2>
            <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg">
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={activeAiModule !== null}
                    className="w-full bg-highlight-light/20 dark:bg-highlight/20 text-highlight-light dark:text-highlight border-2 border-dashed border-highlight-light dark:border-highlight p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-highlight-light/30 dark:hover:bg-highlight/30 transition-colors flex items-center justify-center space-x-2"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span>{isLoading ? 'Scanning...' : 'Scan Invoice/Receipt'}</span>
                </button>
                
                {isModalOpen && <CameraModal onClose={() => setIsModalOpen(false)} onCapture={handleCapture} />}
                
                <div className="mt-4 min-h-[6rem] flex items-center justify-center">
                    {isLoading && (
                         <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-highlight-light dark:bg-highlight rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    )}
                    {!isLoading && invoiceData && (
                        <div className="w-full flex items-start space-x-4 p-2 bg-primary-light dark:bg-primary rounded-md">
                            <img src={invoiceData.image} alt="Scanned invoice" className="w-20 h-20 rounded-md object-cover border border-accent"/>
                            <div className="text-xs space-y-1 text-dark dark:text-light overflow-hidden">
                                <p className="font-bold truncate" title={invoiceData.data.vendor_name}>{invoiceData.data.vendor_name}</p>
                                <p><strong>Inv #:</strong> {invoiceData.data.invoice_number}</p>
                                <p><strong>Date:</strong> {invoiceData.data.invoice_date}</p>
                                <p><strong>Total:</strong> {formatCurrency(invoiceData.data.total_amount)}</p>
                                <p className="italic text-gray-500 dark:text-accent">Added to document context.</p>
                            </div>
                        </div>
                    )}
                    {!isLoading && !invoiceData && (
                        <p className="text-center text-gray-500 dark:text-accent text-sm">Use the camera to scan and automatically add document data.</p>
                    )}
                </div>
            </div>
        </div>
    );
};