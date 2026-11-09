@echo off
chcp 65001 >nul
title CAP NHAT DAY BU
cd /d "%~dp0"
echo.
echo =============================================
echo             CAP NHAT DAY BU
echo =============================================
echo.
echo [1/2] Dang tai ban moi nhat...
git pull origin main
if errorlevel 1 goto LOI

echo.
echo [2/2] Dang cap nhat vao Google Sheet...
clasp push
if errorlevel 1 goto LOI

echo.
echo =============================================
echo XONG! Quay lai Google Sheet, bam Ctrl+Shift+R.
echo =============================================
goto KETTHUC

:LOI
echo.
echo =============================================
echo CHUA XONG. Chup man hinh nay gui em.
echo =============================================

:KETTHUC
echo.
pause
