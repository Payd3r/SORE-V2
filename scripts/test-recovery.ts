import { exec, execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// --- Configurazione ---
const backupDir = path.join(process.cwd(), 'backups');
const dbUser = process.env.DATABASE_USER || 'user';
const dbPassword = process.env.DATABASE_PASSWORD || 'password';
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbPort = process.env.DATABASE_PORT || '5432';
const mainDbName = process.env.DATABASE_NAME || 'sore_dev';
const testDbName = `test_recovery_${Date.now()}`;
// --- Fine Configurazione ---

const execOptions = {
    env: { ...process.env, PGPASSWORD: dbPassword },
    stdio: 'inherit' as const,
};

function runCommand(command: string) {
    console.log(`Esecuzione: ${command}`);
    try {
        execSync(command, execOptions);
    } catch (error) {
        console.error(`Fallimento del comando: ${command}`);
        throw error;
    }
}

async function getLatestBackup(): Promise<string> {
    const files = await fs.readdir(backupDir);
    const backupFiles = files
        .filter(f => f.startsWith('sore-db-backup-') && f.endsWith('.sql'))
        .sort()
        .reverse();

    if (backupFiles.length === 0) {
        throw new Error('Nessun file di backup trovato nella directory dei backup.');
    }
    const latestBackup = path.join(backupDir, backupFiles[0]);
    console.log(`Trovato l'ultimo backup: ${latestBackup}`);
    return latestBackup;
}

async function main() {
    let testDbCreated = false;
    try {
        // 1. Esegui il backup del DB principale per assicurarti di avere un backup recente
        console.log('--- Fase 1: Creazione di un nuovo backup ---');
        runCommand('npm run backup:db');
        const backupFile = await getLatestBackup();

        // 2. Crea un DB di test temporaneo
        console.log(`--- Fase 2: Creazione del database di test (${testDbName}) ---`);
        runCommand(`createdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${testDbName}`);
        testDbCreated = true;

        // 3. Ripristina il backup nel DB di test
        console.log(`--- Fase 3: Ripristino del backup nel database di test ---`);
        const restoreCommand = `pg_restore -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${testDbName} --clean --if-exists -v "${backupFile}"`;
        runCommand(restoreCommand);

        // 4. Esegui una query di verifica
        console.log('--- Fase 4: Verifica del ripristino ---');
        const checkCommand = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${testDbName} -c "SELECT COUNT(*) FROM "Memory";"`;
        runCommand(checkCommand);
        
        console.log('\n✅ Test di ripristino completato con successo!');

    } catch (error) {
        console.error('\n❌ Test di ripristino fallito.');
        process.exit(1);
    } finally {
        // 5. Pulisci: elimina il DB di test
        if (testDbCreated) {
            console.log(`--- Fase 5: Pulizia - Eliminazione del database di test (${testDbName}) ---`);
            runCommand(`dropdb -U ${dbUser} -h ${dbHost} -p ${dbPort} ${testDbName}`);
        }
    }
}

main(); 