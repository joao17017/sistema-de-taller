"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                <h2 className="text-xl font-bold text-red-700 mb-2">
                    Algo salió mal
                </h2>
                <p className="text-sm text-red-600 mb-4">
                    Ocurrió un error inesperado. Intenta de nuevo.
                </p>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                    Reintentar
                </button>
            </div>
        </div>
    );
}
