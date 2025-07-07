-- Script di inizializzazione PostgreSQL per SORE-V2 (Produzione)
-- Questo file viene eseguito automaticamente quando il container PostgreSQL viene avviato per la prima volta

-- Crea il database se non esiste (per sicurezza)
SELECT 'CREATE DATABASE sore_v2'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sore_v2')\gexec

-- Connetti al database
\c sore_v2;

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configura timezone
SET timezone = 'Europe/Rome';

-- Crea indici per performance
-- Gli indici specifici verranno creati tramite Prisma migrations

-- Log di inizializzazione
SELECT 'Database SORE-V2 inizializzato con successo per produzione!' as status;

-- Statistiche database
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    now() as initialized_at; 