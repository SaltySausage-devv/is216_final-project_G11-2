# Development Environment Management

This document explains the tools and commands available to prevent and resolve development environment issues like port conflicts and zombie processes.

## Problem Prevention

### Automatic Cleanup
The `npm run dev` command now automatically cleans up development ports before starting services, preventing most port conflict issues.

### Graceful Shutdown
All services now handle shutdown signals properly (SIGTERM, SIGINT) and will:
- Close active connections
- Clean up resources
- Exit gracefully within 10 seconds

## Available Commands

### Development Commands
```bash
# Start all services with automatic cleanup (recommended)
npm run dev

# Alternative: Explicit cleanup then start
npm run dev-safe

# Start individual services (if needed)
npm run dev:messaging    # Port 3005
npm run dev:auth         # Port 3001
npm run dev:frontend     # Port 3000
# ... etc
```

### Cleanup Commands
```bash
# Check development environment status
npm run dev-status

# Clean up all development ports and processes
npm run cleanup

# Platform-specific cleanup
npm run cleanup-windows  # Windows
npm run cleanup-mac      # macOS/Linux

# Development helper tool
npm run dev-helper help  # Show all available commands
```

## Troubleshooting

### Port Already in Use
If you encounter "Port already in use" errors:

1. **Quick fix**: `npm run cleanup`
2. **Check status**: `npm run dev-status`
3. **Manual cleanup**: `./scripts/cleanup-ports.sh` (macOS/Linux) or `scripts\cleanup-ports.bat` (Windows)

### Zombie Processes
If services don't stop properly:

1. **Run cleanup**: `npm run cleanup`
2. **Check status**: `npm run dev-status` to verify all ports are free
3. **Restart**: `npm run dev`

### Service Won't Start
If a specific service (like messaging) won't start:

1. **Check environment**: `npm run dev-helper check-env`
2. **Verify configuration**: Ensure `.env` file exists with required variables
3. **Clean and restart**: `npm run cleanup && npm run dev`

## Scripts Overview

### scripts/cleanup-ports.sh (macOS/Linux)
- Kills processes on all development ports (3000-3012)
- Removes orphaned node processes
- Removes nodemon processes
- Provides detailed output

### scripts/cleanup-ports.bat (Windows)
- Windows equivalent of cleanup-ports.sh
- Uses netstat and taskkill commands
- Provides similar functionality

### scripts/dev-helper.js
- Node.js utility for development management
- Provides status checking, cleanup, and environment validation
- Used by npm scripts
- Can be used directly for advanced operations

## Best Practices

1. **Always use `npm run dev`** - Includes automatic cleanup
2. **Stop services gracefully** - Use Ctrl+C instead of force killing
3. **Check status first** - Run `npm run dev-status` if unsure
4. **Use cleanup scripts** - Before and after development sessions
5. **Keep environment updated** - Ensure `.env` file is properly configured

## Environment Variables

Ensure your `.env` file contains:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL`

Run `npm run dev-helper check-env` to verify configuration.