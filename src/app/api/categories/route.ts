import { NextRequest, NextResponse } from "next/server";
import { getCategories, saveCategory, Category } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
    try {
        const categories = getCategories();
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.name) {
            return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
        }

        const category: Category = {
            id: uuidv4(),
            name: body.name.trim(),
        };

        const saved = await saveCategory(category);
        return NextResponse.json(saved, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
    }
}
