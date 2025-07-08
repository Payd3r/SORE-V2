import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

const sourceDir = path.join(process.cwd(), 'backups', 'media');
const destinationDir = path.join(process.cwd(), 'public', 'uploads');

async function checkBackupDirExists() {
  try {
    await fs.access(sourceDir);
  } catch (error) {
    console.error(`Errore: La directory di backup dei media non esiste: ${sourceDir}`);
    throw error;
  }
}

async function runLocalRestore() {
  console.log(`Inizio il ripristino da "${sourceDir}" a "${destinationDir}"...`);
  
  try {
    // Copia ricorsiva dalla sorgente di backup alla destinazione pubblica.
    // L'opzione force: true assicura che i file esistenti vengano sovrascritti.
    await fs.cp(sourceDir, destinationDir, { recursive: true, force: true });
    console.log('Ripristino dei file multimediali completato con successo.');
  } catch (error) {
    console.error('Errore durante il ripristino locale dei media:', error);
    throw error;
  }
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
    await checkBackupDirExists();
    
    console.warn('--- ATTENZIONE ---');
    console.warn(`Stai per ripristinare i file multimediali da '${sourceDir}' a '${destinationDir}'.`);
    console.warn('Questa operazione SOVRASCRIVERÀ tutti i file esistenti nella directory di destinazione.');

    const confirmed = await askConfirmation('Sei sicuro di voler procedere?');
    if (!confirmed) {
        console.log('Ripristino annullato dall\'utente.');
        rl.close();
        return;
    }
    rl.close();

    await runLocalRestore();
    console.log('Processo di ripristino dei media completato con successo.');
  } catch (error) {
    console.error('Il processo di ripristino dei media è fallito.', error);
    process.exit(1);
  } finally {
      rl.close();
  }
}

main(); 