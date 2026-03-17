param(
  [string]$InstallDir,
  [string]$ServiceName = 'MuBrowserScheduler'
)

$ErrorActionPreference = 'Stop'

# ----------------------------
# 1) GUARANTEED LOGGING
# Try ProgramData first, fallback to TEMP if ProgramData fails
# ----------------------------
$logDirPrimary = Join-Path $env:ProgramData 'MuBrowserScheduler'
$logDirFallback = Join-Path $env:TEMP 'MuBrowserScheduler'
$logDir = $logDirPrimary

try {
  New-Item -ItemType Directory -Force -Path $logDirPrimary | Out-Null
} catch {
  $logDir = $logDirFallback
  New-Item -ItemType Directory -Force -Path $logDirFallback | Out-Null
}

$logFile = Join-Path $logDir 'service-install.log'

function Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Add-Content -Path $logFile -Value $line
}

function IsAdmin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function RunSc([string[]]$scArgs) {
  Log ("sc.exe " + ($scArgs -join " "))
  & sc.exe @scArgs 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) {
    throw "sc.exe failed (exit=$LASTEXITCODE): sc.exe $($scArgs -join ' ')"
  }
}

try {
  Log "=== Installing Scheduler Service ==="
  Log "LogFile: $logFile"
  Log "RunningAsAdmin: $(IsAdmin)"
  Log "InstallDir arg: '$InstallDir'"
  Log "PSScriptRoot: '$PSScriptRoot'"

  # ----------------------------
  # 2) ADMIN REQUIRED CHECK
  # ----------------------------
  if (-not (IsAdmin)) {
    throw "Not running as Administrator. Service install requires admin."
  }

  # If installer didn't pass InstallDir, infer from script folder
  if (-not $InstallDir) {
    $InstallDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  }
  Log "Resolved InstallDir: '$InstallDir'"

  # ----------------------------
  # 3) FIND SERVICE EXE (prefer dedicated scheduler exe)
  # ----------------------------
  # FIX: In NSIS install, MuulScheduler.exe is shipped under resources\scheduler-service
  $serviceExe = Join-Path $PSScriptRoot 'MuulScheduler.exe'
  $exePath = $null

  if (Test-Path $serviceExe) {
    $exePath = $serviceExe
    Log "Using dedicated service exe: $exePath"
  } else {
    Log "Dedicated service exe not found at $serviceExe, falling back to MuulBrowser*.exe --scheduler-service"
    $fallback = Get-ChildItem -Path $InstallDir -Filter "*.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "MuulBrowser*.exe" } |
      Select-Object -First 1 -ExpandProperty FullName
    if ($fallback) {
      $exePath = $fallback
      Log "Fallback exe: $exePath"
    }
  }

  if (-not $exePath) {
    Log "Could not find scheduler service exe. Listing EXEs found:"
    Get-ChildItem -Path $InstallDir -Filter "*.exe" -ErrorAction SilentlyContinue |
      ForEach-Object { Log ("EXE: " + $_.FullName) }
    throw "Scheduler service EXE not found in $InstallDir"
  }

  # ----------------------------
  # 4) INSTALL SERVICE VIA NSSM
  # ----------------------------
  $nssmPath = Join-Path $PSScriptRoot 'nssm.exe'
  if (-not (Test-Path $nssmPath)) {
    throw "nssm.exe not found at $nssmPath"
  }
  Log "Using nssm: $nssmPath"

  # If service exists, remove it first
  $ErrorActionPreference = 'Continue'
  $statusOut = & $nssmPath status $ServiceName 2>&1
  $statusExit = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  $statusOut | ForEach-Object { Log $_ }
  if ($statusExit -eq 0) {
    Log "Service exists. Stopping and removing..."
    $ErrorActionPreference = 'Continue'
    & $nssmPath stop $ServiceName 2>&1 | ForEach-Object { Log $_ }
    Start-Sleep -Seconds 2
    & $nssmPath remove $ServiceName confirm 2>&1 | ForEach-Object { Log $_ }
    Start-Sleep -Seconds 2
    $ErrorActionPreference = 'Stop'
  } else {
    Log "Service does not exist yet (expected on first install)."
  }

  Log "Installing service via nssm..."
  & $nssmPath install $ServiceName $exePath 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { throw "nssm install failed (exit=$LASTEXITCODE)" }

  & $nssmPath set $ServiceName DisplayName "MuBrowser Scheduler" 2>&1 | ForEach-Object { Log $_ }
  & $nssmPath set $ServiceName Description "Runs MuBrowser background scheduler jobs" 2>&1 | ForEach-Object { Log $_ }
  & $nssmPath set $ServiceName Start SERVICE_AUTO_START 2>&1 | ForEach-Object { Log $_ }
  & $nssmPath start $ServiceName 2>&1 | ForEach-Object { Log $_ }

  # ----------------------------
  # 5) VERIFY SERVICE EXISTS
  # ----------------------------
  Log "Verifying service..."
  & $nssmPath status $ServiceName 2>&1 | ForEach-Object { Log $_ }

  if ($LASTEXITCODE -ne 0) {
    throw "Service verification failed after install/start."
  }

  Log "SUCCESS: Installed and started $ServiceName"
  exit 0
}
catch {
  Log ("FAILED: " + $_.Exception.Message)
  Log ("STACK: " + $_.ScriptStackTrace)
  exit 1
}