@echo off
title PSUT MailBox Server - keep this window open
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install it from https://www.python.org/downloads/ and tick "Add Python to PATH".
  pause
  exit /b 1
)
REM Change the admin password here before real use:
if "%PSUT_ADMIN_PASSWORD%"=="" set PSUT_ADMIN_PASSWORD=change-me-now
REM The server opens the website in your browser automatically.
python server.py
pause
