"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    toast: (props: Omit<Toast, "id">) => void;
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((props: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { ...props, id };
        setToasts((prev) => [...prev, toast]);

        if (props.duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, props.duration || 3000);
        }
    }, [removeToast]);

    const value = {
        toast: addToast,
        success: (message: string, title?: string) => addToast({ type: "success", message, title }),
        error: (message: string, title?: string) => addToast({ type: "error", message, title }),
        info: (message: string, title?: string) => addToast({ type: "info", message, title }),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-start w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-lg border border-gray-100 ring-1 ring-black/5 transform transition-all duration-300 ease-in-out translate-y-0 opacity-100 p-4`}
                        role="alert"
                    >
                        <div className="flex-shrink-0 mr-3">
                            {t.type === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                            {t.type === "info" && <Info className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div className="w-full  pt-0.5">
                            {t.title && <p className="text-sm font-medium text-gray-900 mb-1">{t.title}</p>}
                            <p className="text-sm text-gray-500 leading-snug">{t.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
