@echo off
chcp 65001 >nul
title Cap nhat Day Bu
cd /d "%~dp0"
set "LOG=%USERPROFILE%\Desktop\NHAT_KY_CAP_NHAT_DAY_BU.txt"

(
  echo ==========================================
  echo       CAP NHAT DAY BU
  echo ==========================================
  echo.
  echo Dang tai ban moi nhat...
  git pull origin main
  echo.
  echo Dang cap nhat vao Google Sheet...
  clasp push
  echo.
  echo ==========================================
  echo XONG! Mo Google Sheet va bam Ctrl+Shift+R
  echo ==========================================
) > "%LOG%" 2>&1

start "" notepad "%LOG%"
echo.
echo Da mo Nhat ky cap nhat tren Desktop.
echo.
pause
