import { NextRequest, NextResponse } from "next/server";
import { getOrderById, saveOrder, deleteOrder, reducePartStock, restorePartStock } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("[api/orders/[id]] GET error:", error);
    return NextResponse.json({ error: "Error al obtener orden" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const now = new Date().toISOString();

    // Block advancing to reparando/listo/entregado if budget not approved
    const blockedStatuses = ["reparando", "listo", "entregado"];
    if (body.status && body.status !== order.status && blockedStatuses.includes(body.status)) {
      const bs = order.budgetStatus || "none";
      if (bs === "pending" || bs === "rejected") {
        return NextResponse.json({ error: "No se puede avanzar sin aprobación del presupuesto" }, { status: 400 });
      }
    }

    // Track status changes in history
    let statusHistory = order.statusHistory || [];
    if (body.status && body.status !== order.status) {
      statusHistory = [
        ...statusHistory,
        {
          from: order.status,
          to: body.status,
          date: now,
          note: body.statusChangeNote || undefined,
        },
      ];
    }

    // ─── Stock management for parts ───
    const oldParts = order.usedParts || [];
    let newParts = body.usedParts;

    // If selectedServices is updated, recalculate usedParts from it
    // This ensures that adding a service automatically reserves the part
    if (body.selectedServices) {
      const partsMap: Record<string, { quantity: number; name?: string; cost?: number }> = {};

      for (const svc of body.selectedServices) {
        if (svc.linkedPartId) {
          if (!partsMap[svc.linkedPartId]) {
            partsMap[svc.linkedPartId] = {
              quantity: 0,
              name: svc.linkedPartName,
              cost: svc.linkedPartCost
            };
          }
          partsMap[svc.linkedPartId].quantity += 1;
        }
      }

      newParts = Object.entries(partsMap).map(([partId, data]) => ({
        partId,
        partName: data.name || "Pieza", // Fallback if name missing
        quantity: data.quantity,
        unitCost: data.cost || 0
      }));
    }

    // If newParts is still undefined (no services update sent), use oldParts to assume no change
    // unless explicit empty array was sent (which means clear parts)
    if (newParts === undefined) {
      newParts = oldParts;
    }

    for (const np of newParts) {
      const op = oldParts.find((p: { partId: string }) => p.partId === np.partId);
      const oldQty = op ? op.quantity : 0;
      const diff = np.quantity - oldQty;
      if (diff > 0) {
        // More parts used — reduce stock
        reducePartStock(np.partId, diff);
      } else if (diff < 0) {
        // Fewer parts used — restore stock
        restorePartStock(np.partId, Math.abs(diff));
      }
    }

    // Parts that were completely removed — restore their full quantity
    for (const op of oldParts) {
      const stillExists = newParts.find((p: { partId: string }) => p.partId === op.partId);
      if (!stillExists) {
        restorePartStock(op.partId, op.quantity);
      }
    }

    const updated = {
      ...order,
      ...body,
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      statusHistory,
      internalNotes: body.internalNotes || order.internalNotes || [],
      usedParts: newParts,
      devicePhotos: body.devicePhotos || order.devicePhotos || [],
      updatedAt: now,
    };

    const saved = await saveOrder(updated);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[api/orders/[id]] PUT error:", error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteOrder(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ message: "Orden eliminada" });
  } catch (error) {
    console.error("[api/orders/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Error al eliminar orden" }, { status: 500 });
  }
}
