@echo off
REM Cleanup script for development ports (Windows)
REM This script kills any processes running on the development ports to prevent conflicts

echo 🧹 Cleaning up development ports...

REM Array of development ports
set PORTS=3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012

REM Function to kill processes on a specific port
for %%p in (%PORTS%) do (
    echo Checking port %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":%%p"') do (
        echo 🔨 Killing process %%a on port %%p
        taskkill /F /PID %%a >nul 2>&1
    )
    echo ✅ Port %%p is now free
)

REM Also kill any remaining node processes that might be related to the services
echo 🔍 Checking for orphaned node processes...
taskkill /F /IM node.exe >nul 2>&1

REM Clean up any remaining nodemon processes
echo 🔍 Checking for nodemon processes...
taskkill /F /IM nodemon.exe >nul 2>&1

echo 🎉 Development ports cleanup completed!
echo You can now safely run 'npm run dev' or 'start-dev.bat'

pause