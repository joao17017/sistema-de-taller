import { NextResponse } from "next/server";
import { createBackupZip } from "@/lib/backup";

export async function GET() {
    try {
        const buffer = await createBackupZip();

        // Set headers for file download
        const headers = new Headers();
        headers.append("Content-Disposition", `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.zip"`);
        headers.append("Content-Type", "application/zip");
        headers.append("Content-Length", buffer.length.toString());

        return new NextResponse(new Uint8Array(buffer), {
            headers,
        });
    } catch (error) {
        console.error("[api/backup] Error creating backup:", error);
        return NextResponse.json({ error: "Error al crear respaldo" }, { status: 500 });
    }
}
