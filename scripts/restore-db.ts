import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

// --- Configurazione ---
const backupDir = path.join(process.cwd(), 'backups');
const dbUser = process.env.DATABASE_USER || 'user';
const dbPassword = process.env.DATABASE_PASSWORD || 'password';
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbPort = process.env.DATABASE_PORT || '5432';
const dbName = process.env.DATABASE_NAME || 'sore_dev';
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askConfirmation(question: string): Promise<boolean> {
  return new Promise(resolve => {
    rl.question(question + ' (s/n): ', answer => {
      resolve(answer.toLowerCase() === 's');
    });
  });
}

async function main() {
    try {
        const backupFile = await getLatestBackup();

        console.warn('--- ATTENZIONE ---');
        console.warn(`Stai per ripristinare il database '${dbName}' dal backup:`);
        console.warn(backupFile);
        console.warn('Questa operazione CANCELLERÀ TUTTI I DATI ATTUALI nel database.');
        
        const confirmed = await askConfirmation('Sei sicuro di voler procedere?');

        if (!confirmed) {
            console.log('Ripristino annullato dall\'utente.');
            rl.close();
            return;
        }
        
        rl.close();

        console.log('--- Fase 1: Chiusura di tutte le connessioni al database ---');
        // Questo comando potrebbe fallire se non si hanno i permessi sufficienti, ma è un best effort.
        try {
            const killConnectionsCommand = `psql -U ${dbUser} -h ${dbHost} -p ${dbPort} -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}' AND pid <> pg_backend_pid();"`;
            runCommand(killConnectionsCommand);
        } catch (error) {
            console.warn('Non è stato possibile chiudere tutte le connessioni. Il ripristino potrebbe fallire se ci sono connessioni attive.');
        }

        console.log(`--- Fase 2: Ripristino del backup nel database '${dbName}' ---`);
        const restoreCommand = `pg_restore -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} --clean --if-exists -v "${backupFile}"`;
        runCommand(restoreCommand);

        console.log('\n✅ Ripristino del database completato con successo!');

    } catch (error) {
        console.error('\n❌ Ripristino del database fallito.');
        process.exit(1);
    } finally {
        rl.close();
    }
}

main(); 