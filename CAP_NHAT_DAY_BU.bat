@echo off
chcp 65001 >nul
title Cap nhat Day Bu
cd /d "%~dp0"

echo.
echo ==========================================
echo       CAP NHAT DAY BU
 echo ==========================================
echo.
echo Dang tai ban moi nhat...
git pull origin main
if errorlevel 1 goto :loi

echo.
echo Dang cap nhat vao Google Sheet...
clasp push
if errorlevel 1 goto :loi

echo.
echo ==========================================
echo   XONG! Mo Google Sheet va bam Ctrl+Shift+R
 echo ==========================================
echo.
pause
exit /b 0

:loi
echo.
echo ==========================================
echo   CHUA XONG. Hay chup man hinh nay gui em.
echo ==========================================
echo.
pause
exit /b 1
