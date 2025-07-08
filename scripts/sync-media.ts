import { promises as fs } from 'fs';
import path from 'path';

const sourceDir = path.join(process.cwd(), 'public', 'uploads');
const backupBaseDir = path.join(process.cwd(), 'backups');
const mediaBackupDir = path.join(backupBaseDir, 'media');

async function ensureBackupDirExists() {
  try {
    await fs.mkdir(mediaBackupDir, { recursive: true });
    console.log(`Directory di backup per i media creata o già esistente: ${mediaBackupDir}`);
  } catch (error) {
    console.error('Errore nella creazione della directory di backup per i media:', error);
    throw error;
  }
}

async function runLocalSync() {
  console.log(`Inizio la sincronizzazione da "${sourceDir}" a "${mediaBackupDir}"...`);
  
  try {
    // Usiamo fs.cp per una copia ricorsiva. L'opzione 'force: false' previene la sovrascrittura se la destinazione esiste.
    // In questo caso, vogliamo una vera e propria sincronizzazione, quindi l'approccio migliore è
    // prima svuotare la destinazione e poi copiare, simile a rsync --delete.
    // Per semplicità e sicurezza, copieremo semplicemente sopra, ma un'implementazione più avanzata
    // userebbe chokidar o un'utility di sync più complessa.
    // Per questo caso d'uso, una copia ricorsiva è sufficiente.
    await fs.cp(sourceDir, mediaBackupDir, { recursive: true, force: true });
    console.log('Sincronizzazione dei file multimediali completata con successo.');
  } catch (error) {
    console.error('Errore durante la sincronizzazione locale dei media:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Inizio del processo di backup dei file multimediali...');
    await ensureBackupDirExists();
    await runLocalSync();
    console.log('Processo di backup dei media completato con successo.');
  } catch (error)
 {
    console.error('Il processo di backup dei media è fallito.', error);
    process.exit(1);
  }
}

main(); 