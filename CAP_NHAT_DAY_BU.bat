@echo off
chcp 65001 >nul
title Cap nhat Day Bu
cd /d "%~dp0"
set "LOG=%USERPROFILE%\Desktop\NHAT_KY_CAP_NHAT_DAY_BU.txt"

call :capNhat > "%LOG%" 2>&1
set "KQ=%ERRORLEVEL%"
start "" notepad "%LOG%"
if "%KQ%"=="0" (
  echo XONG - Nhat ky da mo trong Notepad.
) else (
  echo CHUA XONG - Nhat ky loi da mo trong Notepad.
)
echo.
pause
exit /b %KQ%

:capNhat
echo ==========================================
echo       CAP NHAT DAY BU
echo ==========================================
echo.
echo Dang tai ban moi nhat...
git pull origin main
if errorlevel 1 exit /b 1

echo.
echo Dang cap nhat vao Google Sheet...
clasp push
if errorlevel 1 exit /b 1

echo.
echo ==========================================
echo XONG! Mo Google Sheet va bam Ctrl+Shift+R
echo ==========================================
exit /b 0
