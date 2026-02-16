import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-2">404</h1>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Página no encontrada
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    La página que buscas no existe o fue movida.
                </p>
                <Link
                    href="/"
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
