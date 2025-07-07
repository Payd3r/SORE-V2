# Script PowerShell per gestire Docker di SORE-V2
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod", "stop", "clean", "logs", "status")]
    [string]$Action,
    
    [string]$Service = ""
)

function Write-ColorOutput {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Header {
    Write-Host ""
    Write-ColorOutput "🚀 SORE-V2 Docker Manager" "Cyan"
    Write-ColorOutput "=========================" "Cyan"
    Write-Host ""
}

function Start-Development {
    Write-ColorOutput "🔧 Avvio ambiente di sviluppo..." "Yellow"
    docker-compose -f docker-compose.dev.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-ColorOutput "✅ Ambiente di sviluppo avviato con successo!" "Green"
        Write-ColorOutput "📱 App: http://localhost:3001" "Cyan"
        Write-ColorOutput "🗄️  Database: localhost:5433" "Cyan"
        Write-ColorOutput "📊 Adminer: http://localhost:8080" "Cyan"
        Write-ColorOutput "🔄 Redis: localhost:6380" "Cyan"
    } else {
        Write-ColorOutput "❌ Errore nell'avvio dell'ambiente di sviluppo" "Red"
    }
}

function Start-Production {
    Write-ColorOutput "🏭 Avvio ambiente di produzione..." "Yellow"
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-ColorOutput "✅ Ambiente di produzione avviato con successo!" "Green"
        Write-ColorOutput "🌐 App: http://localhost:3000" "Cyan"
        Write-ColorOutput "🗄️  Database: localhost:5432" "Cyan"
        Write-ColorOutput "🔄 Redis: localhost:6379" "Cyan"
        Write-ColorOutput "🌍 Nginx: http://localhost (porta 80)" "Cyan"
    } else {
        Write-ColorOutput "❌ Errore nell'avvio dell'ambiente di produzione" "Red"
    }
}

function Stop-Services {
    Write-ColorOutput "🛑 Arresto di tutti i servizi..." "Yellow"
    docker-compose -f docker-compose.dev.yml down
    docker-compose down
    
    Write-ColorOutput "✅ Servizi arrestati" "Green"
}

function Clean-Docker {
    Write-ColorOutput "🧹 Pulizia Docker (containers, images, volumes)..." "Yellow"
    
    # Chiedi conferma
    $confirm = Read-Host "Sei sicuro di voler rimuovere tutti i containers, images e volumes? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        docker-compose -f docker-compose.dev.yml down -v --rmi all
        docker-compose down -v --rmi all
        docker system prune -f
        
        Write-ColorOutput "✅ Pulizia completata" "Green"
    } else {
        Write-ColorOutput "❌ Operazione annullata" "Yellow"
    }
}

function Show-Logs {
    if ($Service) {
        Write-ColorOutput "📋 Logs per il servizio: $Service" "Yellow"
        docker-compose -f docker-compose.dev.yml logs -f $Service
    } else {
        Write-ColorOutput "📋 Logs di tutti i servizi di sviluppo:" "Yellow"
        docker-compose -f docker-compose.dev.yml logs -f
    }
}

function Show-Status {
    Write-ColorOutput "📊 Status dei containers Docker:" "Yellow"
    Write-Host ""
    
    Write-ColorOutput "=== SVILUPPO ===" "Cyan"
    docker-compose -f docker-compose.dev.yml ps
    
    Write-Host ""
    Write-ColorOutput "=== PRODUZIONE ===" "Cyan"
    docker-compose ps
    
    Write-Host ""
    Write-ColorOutput "=== STORAGE UTILIZZATO ===" "Cyan"
    docker system df
}

# Main script execution
Show-Header

switch ($Action) {
    "dev" { Start-Development }
    "prod" { Start-Production }
    "stop" { Stop-Services }
    "clean" { Clean-Docker }
    "logs" { Show-Logs }
    "status" { Show-Status }
}

Write-Host "" 