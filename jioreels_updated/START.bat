@echo off
echo.
echo  ============================================
echo    JIOREELS - Building and Starting...
echo  ============================================
echo.

echo  [1/3] Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 ( echo ERROR: frontend npm install failed & pause & exit /b 1 )

echo.
echo  [2/3] Building React frontend...
call npm run build
if errorlevel 1 ( echo ERROR: React build failed & pause & exit /b 1 )

echo.
echo  [3/3] Starting backend server...
cd ..\backend
call npm install
if errorlevel 1 ( echo ERROR: backend npm install failed & pause & exit /b 1 )

echo.
echo  ============================================
echo    Open your browser at: http://localhost:5002
echo  ============================================
echo.
node server.js
pause
