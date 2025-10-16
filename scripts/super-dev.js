#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const killPort = require('kill-port');
const concurrently = require('concurrently');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const rootDir = path.resolve(__dirname, '..');
const servicesDir = path.join(rootDir, 'services');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const DEV_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getServiceDirectories() {
  return fs
    .readdirSync(servicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getInstallTargets() {
  const serviceDirs = getServiceDirectories().map((dir) => path.join(servicesDir, dir));
  return [rootDir, path.join(rootDir, 'frontend'), ...serviceDirs];
}

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

async function installDependencies() {
  log('Installing project dependencies...', 'cyan');
  const targets = getInstallTargets();

  for (const target of targets) {
    if (!fs.existsSync(path.join(target, 'package.json'))) {
      continue;
    }

    const label = path.relative(rootDir, target) || '.';
    log(`→ npm install (${label})`, 'yellow');
    await runCommand(npmCmd, ['install'], { cwd: target });
  }

  log('✔ Dependency installation complete', 'green');
}

async function cleanupPorts() {
  log('Preparing development ports...', 'cyan');

  for (const port of DEV_PORTS) {
    try {
      await killPort(port, 'tcp');
      log(`✔ Freed port ${port}`, 'green');
    } catch (error) {
      const message = String(error).toLowerCase();
      if (message.includes('no process')) {
        log(`• Port ${port} already free`, 'yellow');
      } else {
        log(`! Unable to free port ${port}: ${error.message}`, 'red');
      }
    }
  }

  log('Port preparation complete', 'green');
}

function buildCommandList(mode) {
  const isDev = mode === 'dev';
  const scriptName = isDev ? 'dev' : 'start';
  const baseEnv = { ...process.env, NODE_ENV: isDev ? 'development' : 'production' };

  const serviceCommands = getServiceDirectories().map((service) => ({
    command: `npm run ${scriptName}`,
    name: service,
    cwd: path.join(servicesDir, service),
    env: { ...baseEnv }
  }));

  const frontendEnv = { ...baseEnv };
  if (!isDev) {
    frontendEnv.VITE_DISABLE_HMR = 'true';
  }

  const frontendCommand = {
    command: 'npm run dev -- --host 0.0.0.0 --port 3000',
    name: 'frontend',
    cwd: path.join(rootDir, 'frontend'),
    env: frontendEnv
  };

  return [...serviceCommands, frontendCommand];
}

async function launch(mode) {
  log(`Launching TutorConnect (${mode})...`, 'cyan');

  const commandList = buildCommandList(mode);
  const { result } = concurrently(commandList, {
    killOthers: ['failure', 'success'],
    prefix: '{name}',
    timestampFormat: 'HH:mm:ss'
  });

  try {
    await result;
  } catch (error) {
    log(`Startup aborted: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function main() {
  const mode = process.argv[2] === 'start' ? 'start' : 'dev';

  try {
    await installDependencies();
    await cleanupPorts();
    await launch(mode);
  } catch (error) {
    log(error.message, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
