import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const exportDir = path.join(process.cwd(), 'exports');

async function ensureExportDirExists() {
  try {
    await fs.mkdir(exportDir, { recursive: true });
    console.log(`Directory di esportazione creata o già esistente: ${exportDir}`);
  } catch (error) {
    console.error('Errore nella creazione della directory di esportazione:', error);
    throw error;
  }
}

async function exportUserData(userEmail: string) {
  console.log(`Inizio l'esportazione dei dati per l'utente: ${userEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      accounts: true,
      sessions: true,
      couple: {
        include: {
          memories: { where: { authorId: { equals: undefined } } }, // Simplified, needs user ID on memory
          ideas: { where: { authorId: { equals: undefined } } }, // Simplified
        },
      },
      images: true,
      memories: true,
      ideas: true,
      notifications: true,
      momentsInitiated: true,
      momentsParticipated: true,
      analyticsEvents: true,
    },
  });

  if (!user) {
    throw new Error(`Nessun utente trovato con l'email: ${userEmail}`);
  }
  
  // Rimuoviamo dati sensibili che non dovrebbero essere esportati
  if (user.password) {
      user.password = '[REDACTED]';
  }
  user.accounts.forEach(acc => {
      acc.access_token = '[REDACTED]';
      acc.refresh_token = '[REDACTED]';
      acc.id_token = '[REDACTED]';
  });


  const exportData = JSON.stringify(user, null, 2);
  const fileName = `export-${userEmail.replace(/@/g, '_')}-${Date.now()}.json`;
  const filePath = path.join(exportDir, fileName);

  await fs.writeFile(filePath, exportData);
  console.log(`Dati utente esportati con successo in: ${filePath}`);

  return user;
}

async function main() {
  const userEmail = process.argv[2];
  if (!userEmail) {
    console.error('Errore: Per favore, fornisci un\'email utente come argomento.');
    console.log('Uso: npm run export:user -- <email@esempio.com>');
    process.exit(1);
  }

  try {
    await ensureExportDirExists();
    await exportUserData(userEmail);
  } catch (error) {
    console.error('Esportazione dei dati utente fallita:', error);
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 