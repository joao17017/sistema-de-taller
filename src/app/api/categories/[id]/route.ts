import { NextRequest, NextResponse } from "next/server";
import { deleteCategory } from "@/lib/storage";

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const deleted = await deleteCategory(params.id);
        if (!deleted) {
            return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
    }
}
