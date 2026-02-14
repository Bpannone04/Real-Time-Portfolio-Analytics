#!/usr/bin/env node

const { exec } = require('child_process');
const http = require('http');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3001/api/health';
const MAX_WAIT = 60000; // 60 seconds
const CHECK_INTERVAL = 2000; // Check every 2 seconds

function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForServers() {
  console.log('⏳ Waiting for servers to be ready...');
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT) {
    const [frontendReady, backendReady] = await Promise.all([
      checkUrl(FRONTEND_URL),
      checkUrl(BACKEND_URL)
    ]);

    if (frontendReady && backendReady) {
      console.log('✅ Both servers are ready!');
      return true;
    }

    if (!frontendReady) {
      process.stdout.write(`\r⏳ Waiting for frontend (${FRONTEND_URL})...`);
    }
    if (!backendReady) {
      process.stdout.write(`\r⏳ Waiting for backend (${BACKEND_URL})...`);
    }

    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }

  console.error('\n❌ Timeout waiting for servers');
  return false;
}

function launchElectron() {
  console.log('🚀 Launching Electron...');
  const electron = exec('NODE_ENV=development electron .', {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electron.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  electron.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  electron.on('exit', (code) => {
    process.exit(code);
  });
}

async function main() {
  const ready = await waitForServers();
  if (ready) {
    launchElectron();
  } else {
    console.error('Failed to start. Make sure backend and frontend servers are running.');
    process.exit(1);
  }
}

main();
