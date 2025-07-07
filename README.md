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

---
_Progetto sviluppato con passione._ 