-- Script di inizializzazione PostgreSQL per SORE-V2 (Sviluppo)
-- Questo file viene eseguito automaticamente quando il container PostgreSQL viene avviato per la prima volta

-- Crea il database se non esiste (per sicurezza)
SELECT 'CREATE DATABASE sore_v2_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sore_v2_dev')\gexec

-- Connetti al database
\c sore_v2_dev;

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis" CASCADE; -- Per funzionalità geografiche avanzate in dev

-- Configura timezone
SET timezone = 'Europe/Rome';

-- Configurazioni specifiche per sviluppo
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 0;

-- Ricarica configurazione
SELECT pg_reload_conf();

-- Crea utente di test se necessario
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_user') THEN
        CREATE ROLE test_user WITH LOGIN PASSWORD 'test_password';
        GRANT ALL PRIVILEGES ON DATABASE sore_v2_dev TO test_user;
    END IF;
END
$$;

-- Log di inizializzazione
SELECT 'Database SORE-V2 inizializzato con successo per sviluppo!' as status;

-- Informazioni aggiuntive per debugging
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version,
    now() as initialized_at,
    current_setting('log_statement') as log_statement_setting,
    current_setting('timezone') as timezone_setting; 