import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { format } from 'date-fns';

const backupDir = path.join(process.cwd(), 'backups');
const dbName = process.env.DATABASE_NAME || 'sore_dev';
const dbUser = process.env.DATABASE_USER || 'user';
const dbPassword = process.env.DATABASE_PASSWORD || 'password';
const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbPort = process.env.DATABASE_PORT || '5432';

async function createBackupDir() {
  try {
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`Directory di backup creata: ${backupDir}`);
  } catch (error) {
    console.error('Errore nella creazione della directory di backup:', error);
    throw error;
  }
}

async function runPgDump(): Promise<string> {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const backupFile = path.join(backupDir, `sore-db-backup-${timestamp}.sql`);
  
  const command = `pg_dump -U ${dbUser} -h ${dbHost} -p ${dbPort} -d ${dbName} -F c -b -v -f "${backupFile}"`;

  console.log('Esecuzione del comando di backup...');

  return new Promise<string>((resolve, reject) => {
    exec(command, { env: { ...process.env, PGPASSWORD: dbPassword } }, (error, stdout, stderr) => {
      if (error) {
        console.error('Errore durante l\'esecuzione di pg_dump:', stderr);
        reject(error);
        return;
      }
      console.log('Output di pg_dump:', stdout);
      console.log(`Backup del database creato con successo: ${backupFile}`);
      resolve(backupFile);
    });
  });
}

async function main() {
  try {
    console.log('Inizio del processo di backup del database...');
    await createBackupDir();
    await runPgDump();
    console.log('Processo di backup completato con successo.');
  } catch (error) {
    console.error('Il processo di backup è fallito.');
    process.exit(1);
  }
}

main(); 