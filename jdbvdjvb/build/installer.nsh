!macro customHeader
!macroend

!macro customFinishPage
  !pragma warning disable 6010

  Function installSchedulerService
    FileOpen $9 "$LOCALAPPDATA\MuulBrowser\install.log" a
    FileSeek $9 0 END
    ${GetTime} "" "L" $1 $2 $3 $4 $5 $6 $7
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service install requested$\r$\n"

    nsExec::ExecToStack 'powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "$INSTDIR\resources\scheduler-service\installService.ps1"'
    Pop $0
    Pop $1

    ${If} $0 == "0"
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service installed: OK$\r$\n"
    ${Else}
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service install FAILED (exit=$0)$\r$\n"
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Output: $1$\r$\n"
    ${EndIf}

    FileClose $9
  FunctionEnd

  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif

  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Install MuulScheduler Service"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION installSchedulerService
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED

  !insertmacro MUI_PAGE_FINISH

  !pragma warning enable 6010
!macroend

!macro customInstall
  ; --- NSIS Installer Logging ---
  CreateDirectory "$LOCALAPPDATA\MuulBrowser"
  FileOpen $9 "$LOCALAPPDATA\MuulBrowser\install.log" a
  FileSeek $9 0 END

  ${GetTime} "" "L" $1 $2 $3 $4 $5 $6 $7
  FileWrite $9 "========================================$\r$\n"
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Installation Started$\r$\n"
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Install directory: $INSTDIR$\r$\n"

  ${if} ${isUpdated}
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] Type: UPDATE$\r$\n"
  ${else}
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] Type: FRESH INSTALL$\r$\n"
  ${endif}

  ; Check main executable
  IfFileExists "$INSTDIR\MuulBrowser.exe" 0 _inst_exe_missing
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] MuulBrowser.exe: OK$\r$\n"
    Goto _inst_exe_done
  _inst_exe_missing:
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] ERROR: MuulBrowser.exe NOT FOUND$\r$\n"
  _inst_exe_done:

  ; Check resources
  IfFileExists "$INSTDIR\resources\*.*" 0 _inst_res_missing
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] Resources: OK$\r$\n"
    Goto _inst_res_done
  _inst_res_missing:
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] ERROR: Resources directory NOT FOUND$\r$\n"
  _inst_res_done:

  ; Check scheduler service files
  IfFileExists "$INSTDIR\resources\scheduler-service\installService.ps1" 0 _inst_svc_missing
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service files: OK$\r$\n"
    Goto _inst_svc_done
  _inst_svc_missing:
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] WARNING: Scheduler service files not found$\r$\n"
  _inst_svc_done:

  ${GetTime} "" "L" $1 $2 $3 $4 $5 $6 $7
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Installation Completed$\r$\n"
  FileWrite $9 "========================================$\r$\n$\r$\n"
  FileClose $9
!macroend

!macro customUnInstall
  ; --- NSIS Uninstaller Logging ---
  CreateDirectory "$LOCALAPPDATA\MuulBrowser"
  FileOpen $9 "$LOCALAPPDATA\MuulBrowser\uninstall.log" a
  FileSeek $9 0 END

  ${GetTime} "" "L" $1 $2 $3 $4 $5 $6 $7
  FileWrite $9 "========================================$\r$\n"
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Uninstallation Started$\r$\n"
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Install directory: $INSTDIR$\r$\n"

  ; --- Step 1: Check if MuulBrowser is running ---
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Checking if MuulBrowser is running...$\r$\n"

  _check_running:
  nsExec::ExecToStack 'cmd /c tasklist /FI "IMAGENAME eq MuulBrowser.exe" | findstr /I "MuulBrowser.exe"'
  Pop $0
  Pop $1

  StrCmp $0 "0" 0 _not_running
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] MuulBrowser is running - prompting user$\r$\n"
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "MuulBrowser is currently running.$\r$\n$\r$\nPlease close MuulBrowser first, then click Retry to continue uninstalling." IDRETRY _check_running
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] User cancelled uninstall$\r$\n"
    FileWrite $9 "========================================$\r$\n$\r$\n"
    FileClose $9
    Abort

  _not_running:
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] MuulBrowser not running - proceeding$\r$\n"

  ; --- Step 2: Remove scheduler service ---
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Removing scheduler service...$\r$\n"

  IfFileExists "$INSTDIR\resources\scheduler-service\uninstallService.ps1" 0 _no_svc_script
    nsExec::ExecToStack 'powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "$INSTDIR\resources\scheduler-service\uninstallService.ps1"'
    Pop $0
    Pop $1

    ${If} $0 == "0"
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service removed: OK$\r$\n"
    ${Else}
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Scheduler service removal FAILED (exit=$0)$\r$\n"
      FileWrite $9 "[$3-$2-$1 $5:$6:$7] Output: $1$\r$\n"
    ${EndIf}
    Goto _svc_done

  _no_svc_script:
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] WARNING: uninstallService.ps1 not found - using sc.exe fallback$\r$\n"
    nsExec::ExecToStack 'sc.exe stop MuBrowserScheduler'
    Pop $0
    Pop $1
    nsExec::ExecToStack 'sc.exe delete MuBrowserScheduler'
    Pop $0
    Pop $1
    FileWrite $9 "[$3-$2-$1 $5:$6:$7] sc.exe fallback done (exit=$0)$\r$\n"

  _svc_done:

  ; --- Step 3: Log completion ---
  ${GetTime} "" "L" $1 $2 $3 $4 $5 $6 $7
  FileWrite $9 "[$3-$2-$1 $5:$6:$7] Uninstallation Completed$\r$\n"
  FileWrite $9 "========================================$\r$\n$\r$\n"
  FileClose $9
!macroend
