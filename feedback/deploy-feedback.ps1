# Windows port of deploy-feedback.sh
$ErrorActionPreference = "Stop"

function Exit-WithError {
    param([string]$Message, [int]$Code = 1)
    Write-Host "ERROR: $Message" -ForegroundColor Red
    exit $Code
}

function Test-HasCommand {
    param([string]$Name)
    return [bool](Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue)
}

function Resolve-NativeCommand {
    param([string]$Name)
    $cmd = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue
    if (-not $cmd) {
        return $null
    }
    if ($cmd -is [System.Array]) {
        return $cmd[0].Source
    }
    return $cmd.Source
}

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$File,
        [string[]]$Arguments = @()
    )
    $resolved = Resolve-NativeCommand $File
    if (-not $resolved) {
        $resolved = $File
    }
    & $resolved @Arguments
    if ($LASTEXITCODE -ne 0) {
        Exit-WithError "$File failed with exit code $LASTEXITCODE." $LASTEXITCODE
    }
}

function Get-RsyncExe {
    $fromPath = Get-Command rsync -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }

    foreach ($candidate in @(
            (Join-Path $env:ProgramFiles "Git\usr\bin\rsync.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "Git\usr\bin\rsync.exe")
        )) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
    }

    return $null
}

function ConvertTo-WslPath {
    param([string]$WindowsPath)
    if (-not (Test-HasCommand "wsl")) {
        return $null
    }
    $converted = & wsl wslpath -a $WindowsPath 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($converted)) {
        return $null
    }
    return $converted.Trim()
}

function Invoke-Rsync {
    param([string[]]$RsyncArgs)

    $rsyncExe = Get-RsyncExe
    if ($rsyncExe) {
        Invoke-Native $rsyncExe $RsyncArgs
        return
    }

    if (Test-HasCommand "wsl") {
        $wslDir = ConvertTo-WslPath (Get-Location).Path
        if (-not $wslDir) {
            Exit-WithError "Could not convert the current path for WSL rsync."
        }

        $quotedArgs = foreach ($arg in $RsyncArgs) {
            $escaped = $arg.Replace("'", "'\''")
            "'$escaped'"
        }
        $command = "cd '$($wslDir.Replace("'", "'\''"))' && rsync $($quotedArgs -join ' ')"
        Invoke-Native "wsl" @("bash", "-lc", $command)
        return
    }

    Exit-WithError "rsync is not installed or not on your PATH. Install rsync or enable WSL."
}

function Backup-SqliteFile {
    param(
        [string]$SourceDb,
        [string]$DestDb
    )

    if (Test-HasCommand "sqlite3") {
        Invoke-Native "sqlite3" @($SourceDb, ".backup '$DestDb'")
        return
    }

    Copy-Item -LiteralPath $SourceDb -Destination $DestDb -Force
    foreach ($suffix in @("-wal", "-shm")) {
        $side = "$SourceDb$suffix"
        if (Test-Path -LiteralPath $side) {
            Copy-Item -LiteralPath $side -Destination "$DestDb$suffix" -Force
        }
    }
}

$RemoteServer = "ai.stageoneeducation.com"
$RemoteRepoDir = "/home/abarry/feedback"
$BuildDir = "dist"
$BackendFiles = @("server.js", "database", "scripts", "package.json", "package-lock.json")
$ServiceFiles = @("ecosystem.config.cjs", "feedback.service")

$BackupTs = Get-Date -Format "yyyyMMdd-HHmmss"
$LocalDb = "database/feedback.db"
$LocalBackupDir = "database/backups"
$RemoteDbNew = "/var/lib/feedback/feedback.db"
$RemoteDbOld = "$RemoteRepoDir/database/feedback.db"

if (-not (Test-HasCommand "ssh")) {
    Exit-WithError "ssh is not installed or not on your PATH. Install OpenSSH Client from Windows Optional Features."
}

Write-Host "Backing up remote database..."
$remoteBackupScript = @'
set -euo pipefail
DIR="$HOME/feedback-backups"
if [ -f "$NEW" ]; then
  DB="$NEW"
elif [ -f "$OLD" ]; then
  DB="$OLD"
else
  echo "No live database found at $NEW or $OLD. Refusing to deploy."
  exit 1
fi
mkdir -p "$DIR"
DEST="$DIR/feedback-$TS.db"
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$DEST'"
else
  cp "$DB" "$DEST"
  [ -f "$DB-wal" ] && cp "$DB-wal" "$DEST-wal"
  [ -f "$DB-shm" ] && cp "$DB-shm" "$DEST-shm"
fi
echo "Remote backup created: $DEST"
'@

$remoteBackupScript | & ssh $RemoteServer "TS='$BackupTs' NEW='$RemoteDbNew' OLD='$RemoteDbOld' bash -s"
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Remote database backup failed."
}

Write-Host "Backing up local database..."
if (Test-Path -LiteralPath $LocalDb) {
    New-Item -ItemType Directory -Force -Path $LocalBackupDir | Out-Null
    $localDest = Join-Path $LocalBackupDir "feedback-$BackupTs.db"
    Backup-SqliteFile -SourceDb $LocalDb -DestDb $localDest
    Write-Host "Local backup created: $localDest"
}
else {
    Write-Host "No local database found at $LocalDb, skipping local backup."
}

Write-Host "Building feedback application..."
Invoke-Native "npm" @("install")
Invoke-Native "npm" @("run", "build")

Write-Host "Creating deployment package..."
if (Test-Path -LiteralPath "deploy-package") {
    Remove-Item -Recurse -Force "deploy-package"
}
New-Item -ItemType Directory -Force -Path "deploy-package" | Out-Null

if (-not (Test-Path -LiteralPath $BuildDir)) {
    Exit-WithError "Build output '$BuildDir' was not found."
}
Copy-Item -Recurse -Force $BuildDir (Join-Path "deploy-package" $BuildDir)

foreach ($item in ($BackendFiles + $ServiceFiles)) {
    if (Test-Path -LiteralPath $item) {
        Copy-Item -Recurse -Force $item (Join-Path "deploy-package" $item)
    }
}

# Never ship a database. The live file stays on the server, outside this package.
foreach ($name in @("feedback.db", "feedback.db-wal", "feedback.db-shm")) {
    $dbFile = Join-Path "deploy-package\database" $name
    if (Test-Path -LiteralPath $dbFile) {
        Remove-Item -LiteralPath $dbFile -Force
    }
}
$packagedBackups = Join-Path "deploy-package\database\backups"
if (Test-Path -LiteralPath $packagedBackups) {
    Remove-Item -LiteralPath $packagedBackups -Recurse -Force
}

Write-Host "Syncing to remote server..."
Invoke-Rsync @(
    "-avz",
    "--delete",
    "--exclude", "database/feedback.db",
    "--exclude", "database/feedback.db-shm",
    "--exclude", "database/feedback.db-wal",
    "--exclude", "database/backups",
    "deploy-package/",
    "${RemoteServer}:${RemoteRepoDir}/"
)

Remove-Item -Recurse -Force "deploy-package"

Write-Host "Installing dependencies and restarting service on remote server..."
$remoteInstall = @"
cd $RemoteRepoDir
if [ ! -f "$RemoteDbNew" ] && [ ! -f "$RemoteDbOld" ]; then
  echo "Live database missing after deploy. Refusing to continue."
  exit 1
fi
npm install || { echo "npm install failed"; exit 1; }
"@
$remoteInstall | & ssh $RemoteServer "bash -s"
if ($LASTEXITCODE -ne 0) {
    Exit-WithError "Remote npm install failed."
}

Write-Host "sudo ln -sf $RemoteRepoDir/feedback.service /etc/systemd/system/ || { echo `"Failed to link service file`"; }"
Write-Host "sudo systemctl daemon-reload || { echo `"Failed to reload systemd`"; }"
Write-Host "sudo systemctl restart feedback.service || { echo `"Failed to restart service`"; }"

Write-Host "Deployment complete."
exit 0
