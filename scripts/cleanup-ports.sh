#!/bin/bash

# Cleanup script for development ports
# This script kills any processes running on the development ports to prevent conflicts

echo "🧹 Cleaning up development ports..."

# Array of development ports
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012)

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)

    if [ -n "$pids" ]; then
        echo "🔨 Killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 0.5

        # Verify the port is now free
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo "⚠️  Warning: Some processes on port $port may still be running"
        else
            echo "✅ Port $port is now free"
        fi
    else
        echo "✅ Port $port is already free"
    fi
}

# Kill processes on all development ports
for port in "${PORTS[@]}"; do
    kill_port $port
done

# Also kill any remaining node processes that might be related to the services
echo "🔍 Checking for orphaned node processes..."
NODE_PIDS=$(pgrep -f "node.*services" 2>/dev/null)

if [ -n "$NODE_PIDS" ]; then
    echo "🔨 Found orphaned service processes: $NODE_PIDS"
    echo "$NODE_PIDS" | xargs kill -9 2>/dev/null
fi

# Clean up any remaining nodemon processes
echo "🔍 Checking for nodemon processes..."
NODEMON_PIDS=$(pgrep -f "nodemon" 2>/dev/null)

if [ -n "$NODEMON_PIDS" ]; then
    echo "🔨 Killing nodemon processes: $NODEMON_PIDS"
    echo "$NODEMON_PIDS" | xargs kill -9 2>/dev/null
fi

echo "🎉 Development ports cleanup completed!"
echo "You can now safely run 'npm run dev'"