# Kill any existing firebase/java processes
Get-Process | Where-Object {$_.ProcessName -like "*firebase*" -or $_.ProcessName -like "*java*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Set working directory and paths
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $projectRoot

# Create backup directory on D: drive to avoid Windows file system locks in project directory
$backupsDir = "D:\timeto-backups"
New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null

# Create a new backup directory with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $backupsDir "backup_$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

Write-Host "Starting emulators..."
Write-Host "Press Ctrl+C in the emulator window to stop and save data"
Write-Host "The script will handle the export automatically"

# Start emulators in a new window with environment variables
$env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$env:FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
$env:FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9199"

Start-Process cmd -ArgumentList "/c npx firebase emulators:start --import=./backup_20241229_131547 && pause"

# Wait for user to press any key after closing emulators
Write-Host "`nPress any key after stopping the emulators to export data..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Exporting data to D: drive..."
firebase emulators:export $backupDir

if ($LASTEXITCODE -eq 0) {
    # Update local-backup in project directory for convenience
    Remove-Item -Path "local-backup" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path $backupDir -Destination "local-backup" -Recurse -Force
    Write-Host "Data exported successfully to:"
    Write-Host "1. $backupDir (permanent storage)"
    Write-Host "2. ./local-backup (for next emulator start)"
} else {
    Write-Host "Failed to export data"
}

# Clean up any temporary firebase-export-* directories
Get-ChildItem -Directory -Filter "firebase-export-*" | Remove-Item -Recurse -Force 