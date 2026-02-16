"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="es">
            <body>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    fontFamily: "system-ui, sans-serif",
                    gap: "16px",
                }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#b91c1c" }}>
                        Error del Sistema
                    </h2>
                    <p style={{ color: "#666", fontSize: "14px" }}>
                        Ocurrió un error crítico. Por favor intenta de nuevo.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: "8px 20px",
                            backgroundColor: "#dc2626",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </body>
        </html>
    );
}
