@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Starting Golden Horse Shipping Cloudflare Tunnel
echo ========================================
echo.
echo Starting development servers...
start "Dev Server" cmd /c "npm run dev"
echo.
echo Waiting for Vite dev server on http://localhost:3000 ...
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { if (Test-NetConnection -ComputerName 'localhost' -Port 3000 -InformationLevel Quiet) { exit 0 } Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo Warning: Timed out waiting for port 3000. You may see 502 until the server is up.
) else (
  echo Port 3000 is up.
)
echo.
echo Starting Cloudflare tunnel...
echo.
echo ========================================
echo IMPORTANT: Copy the tunnel URL below!
echo ========================================
echo.
cloudflared tunnel --url http://localhost:3000