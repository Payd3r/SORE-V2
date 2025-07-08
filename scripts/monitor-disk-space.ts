import { promises as fs } from 'fs';
import path from 'path';

const backupsDir = path.join(process.cwd(), 'backups');
// Soglia in GB, configurabile tramite variabile d'ambiente
const sizeThresholdGB = parseInt(process.env.BACKUP_SIZE_THRESHOLD_GB || '10', 10);
const sizeThresholdBytes = sizeThresholdGB * 1024 * 1024 * 1024;

async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    try {
        const files = await fs.readdir(dirPath, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                totalSize += await getDirectorySize(filePath);
            } else {
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
            }
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log(`La directory ${dirPath} non esiste ancora, dimensione 0.`);
            return 0;
        }
        throw error;
    }
    return totalSize;
}

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


async function main() {
    try {
        console.log(`Controllo la dimensione della directory di backup: ${backupsDir}`);
        const totalSize = await getDirectorySize(backupsDir);
        const formattedSize = formatBytes(totalSize);
        
        console.log(`Dimensione totale dei backup: ${formattedSize}`);

        if (totalSize > sizeThresholdBytes) {
            console.warn('--- ATTENZIONE: SOGLIA DI DIMENSIONE SUPERATA ---');
            console.warn(`La dimensione dei backup (${formattedSize}) ha superato la soglia di ${sizeThresholdGB} GB.`);
            console.warn('Si consiglia di archiviare o eliminare i backup più vecchi.');
        } else {
            console.log('La dimensione dei backup è entro la soglia definita.');
        }

    } catch (error) {
        console.error('Errore durante il monitoraggio dello spazio su disco:', error);
        process.exit(1);
    }
}

main(); 