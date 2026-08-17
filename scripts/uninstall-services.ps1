<#
  Rimuove i servizi Windows PortalServer e PortalTelegramBot creati con install-services.ps1.
  Deve essere eseguito da una shell PowerShell con privilegi di Amministratore.

  Uso:
    powershell -ExecutionPolicy Bypass -File .\scripts\uninstall-services.ps1
#>

$ErrorActionPreference = 'Continue'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "Questo script deve essere eseguito come Amministratore (tasto destro su PowerShell -> 'Esegui come amministratore')."
    exit 1
}

$root = Split-Path -Parent $PSScriptRoot
$nssm = Join-Path $root 'tools\nssm.exe'

foreach ($name in @('PortalServer', 'PortalTelegramBot')) {
    & $nssm status $name 2>$null 1>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Rimuovo il servizio '$name'..."
        & $nssm stop $name confirm | Out-Null
        & $nssm remove $name confirm | Out-Null
    } else {
        Write-Host "Servizio '$name' non installato, salto."
    }
}

Write-Host "Fatto."
