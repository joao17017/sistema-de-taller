import { NextRequest, NextResponse } from "next/server";
import { getServices, saveService, deleteService } from "@/lib/storage";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const services = getServices();
    const existing = services.find((s) => s.id === params.id);
    if (!existing) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const updated = {
      ...existing,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      category: body.category ?? existing.category,
      basePrice: body.basePrice ?? existing.basePrice,
      linkedPartId: body.linkedPartId ?? existing.linkedPartId,
      linkedPartName: body.linkedPartName ?? existing.linkedPartName,
      linkedPartCost: body.linkedPartCost ?? existing.linkedPartCost,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveService(updated);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar servicio" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteService(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar servicio" }, { status: 500 });
  }
}
