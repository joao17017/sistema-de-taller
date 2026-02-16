import { NextRequest, NextResponse } from "next/server";
import { getOrders, saveOrder, generateOrderNumber } from "@/lib/storage";
import { ServiceOrder } from "@/types/order";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const orders = getOrders();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const total = orders.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = orders.slice(start, start + limit);

    return NextResponse.json({
      orders: paginated,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("[api/orders] GET error:", error);
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customerName?.trim()) {
      return NextResponse.json({ error: "El nombre del cliente es requerido" }, { status: 400 });
    }
    if (!body.customerPhone?.trim()) {
      return NextResponse.json({ error: "El teléfono del cliente es requerido" }, { status: 400 });
    }
    if (!body.deviceType?.trim()) {
      return NextResponse.json({ error: "El tipo de equipo es requerido" }, { status: 400 });
    }
    if (!body.problemDescription?.trim()) {
      return NextResponse.json({ error: "La descripción del problema es requerida" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const order: ServiceOrder = {
      id: uuidv4(),
      orderNumber: generateOrderNumber(),
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      customerEmail: body.customerEmail?.trim() || "",
      deviceType: body.deviceType.trim(),
      deviceBrand: body.deviceBrand?.trim() || "",
      deviceModel: body.deviceModel?.trim() || "",
      serialNumber: body.serialNumber?.trim() || "",
      accessories: body.accessories?.trim() || "",
      problemDescription: body.problemDescription.trim(),
      diagnosis: body.diagnosis?.trim() || "",
      estimatedCost: body.estimatedCost || 0,
      partsCost: body.partsCost || 0,
      estimatedDelivery: body.estimatedDelivery || "",
      signature: body.signature || "",
      devicePhotos: body.devicePhotos || [],
      usedParts: body.usedParts || [],
      selectedServices: body.selectedServices || [],
      status: "recibido",
      statusHistory: [],
      internalNotes: body.internalNotes || [],
      budgetStatus: "none",
      createdAt: now,
      updatedAt: now,
    };

    const saved = await saveOrder(order);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("[api/orders] POST error:", error);
    return NextResponse.json({ error: "Error al crear orden" }, { status: 500 });
  }
}
