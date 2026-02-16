import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const DATA_DIR = path.join(process.cwd(), "data");

export async function createBackupZip(): Promise<Buffer> {
    const zip = new AdmZip();

    // Add all JSON files from data directory
    if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR);
        files.forEach((file) => {
            if (file.endsWith(".json")) {
                const filePath = path.join(DATA_DIR, file);
                zip.addLocalFile(filePath);
            }
        });
    }

    return zip.toBuffer();
}
