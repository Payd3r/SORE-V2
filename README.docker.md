# 🐳 Docker Setup per SORE-V2

Sistema completo di containerizzazione per lo sviluppo e la produzione di SORE-V2.

## 📋 Prerequisiti

- **Docker Desktop** installato e in esecuzione
- **Docker Compose** (incluso in Docker Desktop)
- **Git** per clonare il repository

## 🚀 Quick Start

### Ambiente di Sviluppo

```powershell
# Windows PowerShell
.\scripts\docker.ps1 dev

# Oppure manualmente
docker-compose -f docker-compose.dev.yml up -d
```

### Ambiente di Produzione

```powershell
# Windows PowerShell
.\scripts\docker.ps1 prod

# Oppure manualmente
docker-compose up -d
```

## 🏗️ Architettura

### Servizi Sviluppo

| Servizio | Porta | Descrizione |
|----------|-------|-------------|
| `app-dev` | 3001 | Next.js con hot reload |
| `postgres-dev` | 5433 | PostgreSQL database |
| `redis-dev` | 6380 | Redis cache |
| `adminer` | 8080 | Interface web per database |

### Servizi Produzione

| Servizio | Porta | Descrizione |
|----------|-------|-------------|
| `app` | 3000 | Next.js ottimizzato |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache |
| `nginx` | 80/443 | Reverse proxy e load balancer |

## 🔧 Comandi Utili

### Script PowerShell (Consigliato)

```powershell
# Avvia sviluppo
.\scripts\docker.ps1 dev

# Avvia produzione
.\scripts\docker.ps1 prod

# Ferma tutti i servizi
.\scripts\docker.ps1 stop

# Mostra status
.\scripts\docker.ps1 status

# Mostra logs
.\scripts\docker.ps1 logs

# Pulizia completa
.\scripts\docker.ps1 clean
```

### Comandi Docker Compose Manuali

```bash
# Sviluppo
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.dev.yml down

# Produzione
docker-compose up -d
docker-compose logs -f
docker-compose down

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

## 🗄️ Database

### Connessione Database

#### Sviluppo
- **Host**: `localhost`
- **Porta**: `5433`
- **Database**: `sore_v2_dev`
- **Username**: `sore_user`
- **Password**: `sore_password_dev`

#### Produzione
- **Host**: `localhost`
- **Porta**: `5432`
- **Database**: `sore_v2`
- **Username**: `sore_user`
- **Password**: `sore_password_2024`

### Prisma Commands

```bash
# Genera client Prisma
npx prisma generate

# Crea migration
npx prisma migrate dev --name init

# Reset database
npx prisma migrate reset

# Prisma Studio
npx prisma studio
```

## 🔐 Variabili d'Ambiente

### Sviluppo (docker-compose.dev.yml)

```env
NODE_ENV=development
DATABASE_URL=postgresql://sore_user:sore_password_dev@postgres-dev:5432/sore_v2_dev
NEXTAUTH_URL=http://localhost:3001
REDIS_URL=redis://redis-dev:6379
```

### Produzione (docker-compose.yml)

```env
NODE_ENV=production
DATABASE_URL=postgresql://sore_user:sore_password_2024@postgres:5432/sore_v2
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://redis:6379
```

## 📦 Volumes

### Persistenti
- `postgres_data` / `postgres_dev_data`: Dati database
- `redis_data` / `redis_dev_data`: Cache Redis
- `uploads` / `uploads_dev`: File caricati

### Bind Mounts (Sviluppo)
- `.:/app`: Codice sorgente (hot reload)
- `./public:/app/public`: Asset statici

## 🌐 Networking

### Sviluppo
- **Network**: `sore_dev_network`
- **Driver**: bridge

### Produzione
- **Network**: `sore_network`
- **Driver**: bridge

## 🔍 Monitoring e Health Checks

### Health Check Endpoints

- **App**: `http://localhost:3000/api/health`
- **PostgreSQL**: Comando `pg_isready`
- **Redis**: Comando `redis-cli ping`
- **Nginx**: `http://localhost/nginx-health`

### Logs

```bash
# Tutti i servizi
docker-compose logs -f

# Servizio specifico
docker-compose logs -f app
docker-compose logs -f postgres
```

## 🚨 Troubleshooting

### Problemi Comuni

#### 1. Porta già in uso
```bash
# Trova processo che usa la porta
netstat -ano | findstr :3000
# Termina il processo
taskkill /PID <PID> /F
```

#### 2. Build fallisce
```bash
# Pulizia cache Docker
docker system prune -a
# Rebuild da zero
docker-compose build --no-cache
```

#### 3. Database non raggiungibile
```bash
# Controlla status container
docker-compose ps
# Controlla logs database
docker-compose logs postgres
```

#### 4. Hot reload non funziona (sviluppo)
- Assicurati che `CHOKIDAR_USEPOLLING=true` sia impostato
- Verifica che il volume bind mount sia corretto

### Reset Completo

```powershell
# Ferma tutto
.\scripts\docker.ps1 stop

# Pulizia completa
.\scripts\docker.ps1 clean

# Riavvia
.\scripts\docker.ps1 dev
```

## 🔒 Sicurezza

### Produzione
- Cambia le password di default
- Usa HTTPS con certificati SSL
- Configura firewall appropriato
- Limita accesso alle porte esterne

### Sviluppo
- Non usare in produzione le configurazioni di sviluppo
- Le password di sviluppo sono hardcoded per semplicità

## 📈 Performance

### Ottimizzazioni Applicabili

1. **Multi-stage builds** per ridurre dimensioni immagini
2. **Nginx caching** per asset statici
3. **Redis** per sessioni e cache
4. **Health checks** per alta disponibilità
5. **Resource limits** nei compose files

## 🔄 CI/CD

Il setup Docker è pronto per integrazione CI/CD con:
- GitHub Actions
- GitLab CI
- Jenkins
- Altri sistemi CI/CD

Vedi la Task 20 per l'implementazione completa del sistema di testing e deployment.

---

## 📚 Link Utili

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx) 