"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { formatMoney } from "@/lib/currencies";

interface CurrencyContextType {
    currency: string;
    formatPrice: (amount: number) => string;
    loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState("MXN");
    // Optional: Add loading state if we want to block rendering until settings are loaded
    // For now we default to MXN and update quickly to avoid blocking
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/settings")
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error("Failed to load settings");
            })
            .then((data) => {
                if (data.currency) setCurrency(data.currency);
            })
            .catch((err) => {
                console.error("Failed to load currency settings:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const formatPrice = (amount: number) => {
        return formatMoney(amount, currency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, formatPrice, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
