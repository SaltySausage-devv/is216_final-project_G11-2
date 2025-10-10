#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Development ports to check
const DEV_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
    return result.trim().split('\n').filter(pid => pid);
  } catch (error) {
    return [];
  }
}

function killPort(port) {
  try {
    const pids = checkPort(port);
    if (pids.length > 0) {
      log(`🔨 Killing ${pids.length} process(es) on port ${port}`, 'yellow');
      execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'ignore' });
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ Error killing processes on port ${port}: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironment() {
  log('🔍 Checking development environment...', 'cyan');

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    log('💡 Please create a .env file with your configuration', 'yellow');
    return false;
  }

  // Check required environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];

  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`)) {
      log(`❌ Missing environment variable: ${varName}`, 'red');
      return false;
    }
  }

  log('✅ Environment variables configured', 'green');
  return true;
}

function cleanupPorts() {
  log('🧹 Cleaning up development ports...', 'cyan');

  let totalKilled = 0;
  for (const port of DEV_PORTS) {
    if (killPort(port)) {
      totalKilled++;
    }
  }

  // Also kill orphaned node processes
  try {
    const nodePids = execSync('pgrep -f "node.*services"', { encoding: 'utf8' }).trim();
    if (nodePids) {
      const pids = nodePids.split('\n').filter(pid => pid);
      if (pids.length > 0) {
        log(`🔨 Killing ${pids.length} orphaned service processes`, 'yellow');
        execSync(`kill -9 ${pids.join(' ')}`, { stdio: 'ignore' });
        totalKilled += pids.length;
      }
    }
  } catch (error) {
    // No orphaned processes found
  }

  log(`✅ Cleanup completed. Killed ${totalKilled} processes.`, 'green');
}

function statusCheck() {
  log('📊 Development Environment Status', 'cyan');
  log('================================', 'cyan');

  let occupiedPorts = 0;

  for (const port of DEV_PORTS) {
    const pids = checkPort(port);
    if (pids.length > 0) {
      log(`Port ${port}: ${pids.length} process(es) running`, 'red');
      occupiedPorts++;
    } else {
      log(`Port ${port}: Free`, 'green');
    }
  }

  if (occupiedPorts > 0) {
    log(`\n⚠️  ${occupiedPorts} port(s) are occupied`, 'yellow');
    log('💡 Run "npm run cleanup" to free all ports', 'yellow');
  } else {
    log('\n✅ All development ports are free', 'green');
  }

  // Check environment
  checkEnvironment();
}

function main() {
  const command = process.argv[2] || 'status';

  switch (command) {
    case 'cleanup':
      cleanupPorts();
      break;
    case 'status':
      statusCheck();
      break;
    case 'check-env':
      checkEnvironment();
      break;
    case 'help':
      log('🚀 TutorConnect Development Helper', 'cyan');
      log('================================', 'cyan');
      log('Commands:', 'yellow');
      log('  npm run dev-helper status    - Show development environment status', 'white');
      log('  npm run dev-helper cleanup   - Kill all processes on development ports', 'white');
      log('  npm run dev-helper check-env - Check environment configuration', 'white');
      log('  npm run dev-helper help      - Show this help message', 'white');
      break;
    default:
      log(`❌ Unknown command: ${command}`, 'red');
      log('💡 Run "npm run dev-helper help" for available commands', 'yellow');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkPort, killPort, cleanupPorts, statusCheck, checkEnvironment };