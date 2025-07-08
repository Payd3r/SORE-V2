# SORE V2 - L'App per i Ricordi di Coppia

SORE V2 è un'applicazione web pensata per aiutare le coppie a conservare, organizzare e rivivere i loro momenti più preziosi. Dalle foto di un viaggio speciale alla canzone che ha segnato un'anniversaria, SORE permette di creare una timeline ricca e interattiva della propria storia d'amore.

## ✨ Funzionalità Principali

-   **Timeline dei Ricordi**: Una cronologia visiva che unisce foto, momenti speciali e traccie musicali.
-   **Gallerie Fotografiche**: Organizza le tue foto in gallerie per ogni ricordo.
-   **Integrazione con Spotify**: Associa una canzone speciale a ogni momento.
-   **Dettagli Atmosferici**: Salva le condizioni meteo per ricordare l'atmosfera di quel giorno.
-   **Gestione Completa**: Crea, modifica ed elimina i tuoi ricordi in modo semplice e intuitivo.

## 🚀 Getting Started

Per avviare il progetto in locale, segui questi passaggi:

1.  **Clona il repository:**
    ```bash
    git clone <URL_DEL_REPOSITORY>
    cd SORE-V2
    ```

2.  **Installa le dipendenze:**
    Assicurati di avere [Node.js](https://nodejs.org/) installato.
    ```bash
    npm install
    ```

3.  **Configura il database:**
    Copia il file `.env.example` in un nuovo file chiamato `.env` e inserisci la stringa di connessione al tuo database PostgreSQL.
    ```bash
    cp .env.example .env
    ```
    Applica le migrazioni del database:
    ```bash
    npx prisma migrate dev
    ```

4.  **Avvia il server di sviluppo:**
    ```bash
    npm run dev
    ```

    Apri [http://localhost:3000](http://localhost:3000) nel tuo browser per vedere l'applicazione.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Database ORM**: [Prisma](https://www.prisma.io/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Componenti UI**: [shadcn/ui](https://ui.shadcn.com/)
-   **Linguaggio**: [TypeScript](https://www.typescriptlang.org/)
-   **Autenticazione**: [NextAuth.js](https://next-auth.js.org/)

## Backup and Disaster Recovery

This project includes scripts to help with backing up your database and media files.

### Prerequisites

For the backup scripts to work, the following tools must be available in your system's `PATH`:
- **`pg_dump`** and **`pg_restore`**: The PostgreSQL command-line tools.
- **`rsync`**: For media file synchronization. This is standard on macOS/Linux. For Windows, you may need to install it via WSL (Windows Subsystem for Linux) or a tool like `cwRsync`.

**On Windows:**
1. Find the `bin` directory of your PostgreSQL installation (e.g., `C:\Program Files\PostgreSQL\<version>\bin`).
2. Search for "Edit the system environment variables" in the Start Menu and open it.
3. Click on the "Environment Variables..." button.
4. In the "System variables" section, find and select the `Path` variable, then click "Edit...".
5. Click "New" and add the full path to the PostgreSQL `bin` directory.
6. Click OK on all windows to save the changes. You may need to restart your terminal or computer for the changes to take effect.

**On macOS/Linux:**
The installer for PostgreSQL usually configures the `PATH` correctly. If not, you may need to add a line like `export PATH=$PATH:/path/to/postgres/bin` to your shell profile file (e.g., `.bash_profile`, `.zshrc`).

### Database Backup

To create a backup of your PostgreSQL database, run the following command:

```bash
npm run backup:db
```

This will create a timestamped `.sql` file in the `/backups` directory at the root of the project. The script uses a custom format (`-F c`) which is compressed and suitable for `pg_restore`.

The script uses the following environment variables. You can create a `.env` file in the project root to configure them:
- `DATABASE_NAME` (default: `sore_dev`)
- `DATABASE_USER` (default: `user`)
- `DATABASE_PASSWORD` (default: `password`)
- `DATABASE_HOST` (default: `localhost`)
- `DATABASE_PORT` (default: `5432`)

**Cloud Integration (AWS S3)**

The script can automatically upload the database backup to an AWS S3 bucket. To enable this, configure the following environment variables:
- `AWS_S3_BUCKET_NAME`: The name of your S3 bucket.
- `AWS_ACCESS_KEY_ID`: Your AWS access key.
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key.
- `AWS_REGION`: The AWS region of your bucket (e.g., `us-east-1`).
- `DELETE_LOCAL_BACKUP_AFTER_UPLOAD`: Set to `true` to delete the local backup file after a successful upload to S3.

### Media File Synchronization

To synchronize your media files (from `public/uploads`) to a remote server, run:

```bash
npm run backup:media
```

This script uses `rsync` to efficiently transfer the files. It requires SSH access to the remote server and the following environment variables to be set in your `.env` file:
- `BACKUP_HOST`: The hostname or IP address of the backup server.
- `BACKUP_USER`: The username for SSH login.
- `BACKUP_MEDIA_PATH`: The absolute path on the remote server where media files will be stored.

### Database Restore

To restore the database from a backup file, you can use the `pg_restore` command. For example:

```bash
pg_restore -U user -h localhost -p 5432 -d sore_dev --clean --if-exists -v "backups/sore-db-backup-YYYY-MM-DD_HH-mm-ss.sql"
```

Make sure to replace the filename with the actual name of your backup file. You will be prompted for the database password.

### Automated Recovery Testing

To verify that your backups are working correctly, you can run an automated recovery test. This script will:
1. Create a fresh backup of your main database.
2. Create a new, temporary database.
3. Restore the backup into the temporary database.
4. Run a simple query to verify the data.
5. Delete the temporary database.

Run the test with:
```bash
npm run test:recovery
```
**Warning:** This script creates and deletes databases. It is designed to be safe, but run it in a development environment and ensure your environment variables are set correctly. It requires PostgreSQL tools like `createdb` and `dropdb` to be in your system's `PATH`.

## Contributing

_Progetto sviluppato con passione._ 