<#
  Installa server.js e telegram-bot.js come servizi Windows usando NSSM.
  Deve essere eseguito da una shell PowerShell con privilegi di Amministratore.

  Uso:
    powershell -ExecutionPolicy Bypass -File .\scripts\install-services.ps1
#>

$ErrorActionPreference = 'Continue'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Questo script deve essere eseguito come Amministratore (tasto destro su PowerShell -> 'Esegui come amministratore')."
    exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$nssm = Join-Path $root 'tools\nssm.exe'
$node = (Get-Command node).Source
$logsDir = Join-Path $root 'logs'

if (-not (Test-Path $nssm)) { Write-Error "nssm.exe non trovato in $nssm"; exit 1 }
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

function Install-Service($name, $scriptFile, $description) {
    & $nssm status $name 2>$null 1>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Servizio '$name' esiste già, lo rimuovo per reinstallarlo..."
        & $nssm stop $name confirm | Out-Null
        & $nssm remove $name confirm | Out-Null
    }

    & $nssm install $name $node
    & $nssm set $name AppParameters "--env-file-if-exists=.env $scriptFile"
    & $nssm set $name AppDirectory $root
    & $nssm set $name DisplayName $name
    & $nssm set $name Description $description
    & $nssm set $name Start SERVICE_AUTO_START
    & $nssm set $name AppExit Default Restart
    & $nssm set $name AppRestartDelay 5000
    & $nssm set $name AppStdout (Join-Path $logsDir "$name.out.log")
    & $nssm set $name AppStderr (Join-Path $logsDir "$name.err.log")
    & $nssm set $name AppRotateFiles 1
    & $nssm set $name AppRotateOnline 1
    & $nssm set $name AppRotateBytes 5242880

    & $nssm start $name
    Write-Host "Servizio '$name' installato e avviato."
}

Install-Service 'PortalServer' 'server.js' 'Portal - server web (Express)'
Install-Service 'PortalTelegramBot' 'telegram-bot.js' 'Portal - bot Telegram'

Write-Host ""
Write-Host "Fatto. Stato servizi:"
Get-Service PortalServer, PortalTelegramBot | Format-Table -AutoSize
