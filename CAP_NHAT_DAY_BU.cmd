@echo off
chcp 65001 >nul

REM Lan bam dau mo cua so rieng, giu lai den khi anh bam phim dong.
REM Tranh Windows Terminal tu dong dong/mat toan bo chu khi file ket thuc.
if /I not "%~1"=="CHAY" (
  start "CAP NHAT DAY BU" cmd.exe /k call "%~f0" CHAY
  exit /b
)

title CAP NHAT DAY BU - DANG CHAY
cd /d "%~dp0"
echo.
echo =================================================
echo          CAP NHAT DAY BU - DANG CHAY
echo =================================================
echo Thu muc: %CD%
echo.
echo [1/2] Dang tai Code moi nhat tu GitHub...
git pull origin main
if errorlevel 1 goto LOI_GIT

echo.
echo [2/2] Dang day Code vao Google Sheet...
clasp push
if errorlevel 1 goto LOI_CLASP

echo.
echo =================================================
echo XONG: Code da vao Google Sheet.
echo Quay lai Sheet, bam Ctrl + Shift + R.
echo =================================================
goto KET_THUC

:LOI_GIT
echo.
echo =================================================
echo CHUA XONG: Khong tai duoc Code tu GitHub.
echo Chup nguyen man hinh nay gui em.
echo =================================================
goto KET_THUC

:LOI_CLASP
echo.
echo =================================================
echo CHUA XONG: Chua day duoc Code vao Google Sheet.
echo Chup nguyen man hinh nay gui em.
echo =================================================

:KET_THUC
echo.
echo Nhan phim bat ky de dong cua so nay.
pause >nul
