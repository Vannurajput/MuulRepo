param(
  [string]$ServiceName = 'MuBrowserScheduler'
)

$ErrorActionPreference = 'Stop'

# ----------------------------
# 1) LOGGING
# ----------------------------
$logDir = Join-Path $env:ProgramData 'MuBrowserScheduler'
if (-not (Test-Path $logDir)) {
  $logDir = $env:TEMP
}
$logFile = Join-Path $logDir 'service-uninstall.log'

function Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  try { Add-Content -Path $logFile -Value $line } catch {}
}

Log "=== Uninstalling Scheduler Service ==="

# ----------------------------
# 2) LOCATE NSSM (same tool used to install)
# ----------------------------
$nssmPath = Join-Path $PSScriptRoot 'nssm.exe'
$useNssm = Test-Path $nssmPath
Log "nssm.exe path: $nssmPath (exists=$useNssm)"

# ----------------------------
# 3) CHECK IF SERVICE EXISTS
# ----------------------------
$ErrorActionPreference = 'Continue'
if ($useNssm) {
  $statusOut = & $nssmPath status $ServiceName 2>&1
  $exists = $LASTEXITCODE -eq 0
} else {
  sc.exe query $ServiceName 2>&1 | Out-Null
  $exists = $LASTEXITCODE -eq 0
}
$ErrorActionPreference = 'Stop'

if (-not $exists) {
  Log "Service $ServiceName not found; nothing to remove."
  Write-Output "Service $ServiceName not found; nothing to remove."
  exit 0
}

# ----------------------------
# 4) STOP AND REMOVE SERVICE
# ----------------------------
try {
  if ($useNssm) {
    Log "Stopping service via nssm..."
    $ErrorActionPreference = 'Continue'
    & $nssmPath stop $ServiceName 2>&1 | ForEach-Object { Log $_ }
    Start-Sleep -Seconds 2
    Log "Removing service via nssm..."
    & $nssmPath remove $ServiceName confirm 2>&1 | ForEach-Object { Log $_ }
    $ErrorActionPreference = 'Stop'
  } else {
    Log "nssm not found, falling back to sc.exe..."
    sc.exe stop $ServiceName 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    sc.exe delete $ServiceName 2>&1 | Out-Null
  }
  Log "Removed service $ServiceName"
  Write-Output "Removed service $ServiceName"
} catch {
  Log ("Failed to remove service: " + $_.Exception.Message)
  Write-Warning "Failed to remove service $ServiceName : $_"
}

# ----------------------------
# 5) CLEAN UP LOG DIRECTORY
# ----------------------------
try {
  $dataDir = Join-Path $env:ProgramData 'MuBrowserScheduler'
  if (Test-Path $dataDir) {
    Log "Cleaning up data directory: $dataDir"
    Remove-Item -Path $dataDir -Recurse -Force -ErrorAction SilentlyContinue
  }
} catch {
  Log ("Cleanup warning: " + $_.Exception.Message)
}
