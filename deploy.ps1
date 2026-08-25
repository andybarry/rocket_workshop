# Usage: .\deploy.ps1 <target> [jekyll args...]
#        .\deploy.bat <target> [jekyll args...]
#
#   target = 1 | stageoneed              -> deploy to stageoneed via firebase
#   target = 2 | stageoneeducation2      -> deploy to stageoneeducation2.com via rsync
#
# NOTE NOTE NOTE
# The nginx config for stageoneeducation2.com is set up in the musicgen project
# NOTE NOTE NOTE
#
# Windows notes:
#   Run from cmd:  deploy.bat 1
#   Run from ps:   .\deploy.ps1 1
#   Extra jekyll arguments are forwarded the same way as the bash deploy script.
#   Target 2 and the feedback deploy need rsync (PATH, Git for Windows, or WSL).

$ErrorActionPreference = "Stop"

function Show-Usage {
    @"
Usage: .\deploy.ps1 <target> [jekyll args...]

The target is required.

Targets:
  1, stageoneed                       Deploy to stageoneed via firebase.
                                      Builds ai-network, drone-workshop, and feedback,
                                      then deploys hosting and the feedback application.
  2, stageoneeducation2               Deploy to stageoneeducation2.com via rsync.
                                      Builds ai-network and drone-workshop only.

Options:
  -h, --help                          Show this help message and exit.

Any additional arguments are forwarded to ``jekyll build``.
"@
}

function Exit-WithError {
    param([string]$Message, [int]$Code = 1)
    Write-Host "Error: $Message"
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

    Exit-WithError "rsync is not installed or not on your PATH. Install Git for Windows + rsync, or enable WSL."
}

function Get-BashExe {
    $fromPath = Get-Command bash -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }

    foreach ($candidate in @(
            (Join-Path $env:ProgramFiles "Git\bin\bash.exe"),
            (Join-Path $env:ProgramFiles "Git\usr\bin\bash.exe"),
            (Join-Path ${env:ProgramFiles(x86)} "Git\bin\bash.exe")
        )) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
    }

    return $null
}

# Always operate on the repo that contains this script, not whatever the
# current working directory happens to be.
$RepoRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = (Get-Location).Path
}
Set-Location $RepoRoot

foreach ($required in @("jekyll", "ai-network", "drone-workshop")) {
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot $required))) {
        Exit-WithError "Not a rocket_workshop repo root. Missing '$required' in $RepoRoot"
    }
}

if ($args.Count -eq 0) {
    Write-Host "Error: No deploy target specified."
    Write-Host "Usage: .\deploy.ps1 <1|stageoneed|2|stageoneeducation2> [jekyll args...]"
    exit 1
}

$first = [string]$args[0]
switch -Regex ($first) {
    "^(?i:-h|--help|help)$" {
        Show-Usage
        exit 0
    }
}

$Target = $null
$JekyllArgs = @()

switch -Regex ($first) {
    "^(?i:1|stageoneed)$" {
        $Target = "1"
        if ($args.Count -gt 1) { $JekyllArgs = @($args[1..($args.Count - 1)]) }
    }
    "^(?i:2|stageoneeducation2|stageoneeducation2\.com)$" {
        $Target = "2"
        if ($args.Count -gt 1) { $JekyllArgs = @($args[1..($args.Count - 1)]) }
    }
    default {
        Write-Host "Error: Unknown deploy target '$first'"
        Write-Host "Usage: .\deploy.ps1 <1|stageoneed|2|stageoneeducation2> [jekyll args...]"
        exit 1
    }
}

Set-Location (Join-Path $RepoRoot "ai-network")
Invoke-Native "npm" @("install")
Invoke-Native "npm" @("run", "build")
Set-Location $RepoRoot

Set-Location (Join-Path $RepoRoot "drone-workshop")
Invoke-Native "npm" @("install")
Invoke-Native "npm" @("run", "build")
Set-Location $RepoRoot

if ($Target -eq "1") {
    Set-Location (Join-Path $RepoRoot "feedback")
    Invoke-Native "npm" @("install")
    Invoke-Native "npm" @("run", "build")
    Set-Location $RepoRoot
}

if (-not (Test-HasCommand "jekyll")) {
    Exit-WithError "jekyll is not installed or not on your PATH.`nInstall it with: gem install jekyll bundler"
}

Write-Host "Building site..."
$jekyllCommand = @("build", "--source", "jekyll", "--destination", "www") + $JekyllArgs
Invoke-Native "jekyll" $jekyllCommand

Write-Host "Deploying..."

if ($Target -eq "1") {
    if (-not (Test-HasCommand "firebase")) {
        Exit-WithError "firebase is not installed or not on your PATH.`nInstall it with: npm install -g firebase-tools"
    }

    Invoke-Native "firebase" @("use", "stageoneed")
    Invoke-Native "firebase" @("deploy", "--only", "hosting")

    Write-Host "Deploying feedback application..."
    $feedbackDir = Join-Path $RepoRoot "feedback"
    $feedbackPs1 = Join-Path $feedbackDir "deploy-feedback.ps1"
    $feedbackSh = Join-Path $feedbackDir "deploy-feedback.sh"

    Set-Location $feedbackDir
    if (Test-Path -LiteralPath $feedbackPs1) {
        & $feedbackPs1
        if ($LASTEXITCODE -ne 0) {
            Exit-WithError "feedback deploy failed with exit code $LASTEXITCODE." $LASTEXITCODE
        }
    }
    else {
        $bashExe = Get-BashExe
        if ($bashExe -and (Test-Path -LiteralPath $feedbackSh)) {
            Invoke-Native $bashExe @($feedbackSh)
        }
        else {
            Exit-WithError "Could not find feedback\deploy-feedback.ps1 or a bash interpreter to run deploy-feedback.sh."
        }
    }
    Set-Location $RepoRoot
}
else {
    Invoke-Rsync @("-avz", "--delete", "www/", "stageoneeducation2.com:www/")
}

Write-Host "Deployment complete."
