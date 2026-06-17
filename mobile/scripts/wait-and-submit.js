#!/usr/bin/env node
/**
 * Polls EAS build status and submits to App Store Connect when done.
 * Usage: BUILD_ID=xxx node wait-and-submit.js
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const BUILD_ID = process.env.BUILD_ID || '674fba8a-5f90-428b-a8c2-7606c5b4d22f';
const EXPO_TOKEN = process.env.EXPO_TOKEN;
const ASC_KEY_CONTENT = process.env.ASC_API_KEY_CONTENT;
const ASC_KEY_ID = process.env.ASC_API_KEY_ID;
const ASC_KEY_ISSUER = process.env.ASC_API_KEY_ISSUER_ID;
const POLL_INTERVAL_MS = 60_000;
const KEY_PATH = '/tmp/asc_submit_key.p8';

function graphqlRequest(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request({
      hostname: 'api.expo.dev',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EXPO_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getBuildStatus() {
  const res = await graphqlRequest(`{
    builds {
      byId(buildId: "${BUILD_ID}") {
        id status platform updatedAt
        artifacts { buildUrl }
        error { message }
      }
    }
  }`);
  return res.data?.builds?.byId;
}

async function submitBuild() {
  if (!ASC_KEY_CONTENT) {
    console.error('ERROR: ASC_API_KEY_CONTENT env var not set');
    process.exit(1);
  }
  fs.writeFileSync(KEY_PATH, ASC_KEY_CONTENT);
  console.log('Written ASC key to', KEY_PATH);

  const result = spawnSync(
    'node_modules/.bin/eas',
    [
      'submit',
      '--platform', 'ios',
      '--id', BUILD_ID,
      '--profile', 'production',
      '--non-interactive',
    ],
    {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        EXPO_APPLE_API_KEY_PATH: KEY_PATH,
        EXPO_APPLE_API_KEY_ID: ASC_KEY_ID,
        EXPO_APPLE_API_KEY_ISSUER_ID: ASC_KEY_ISSUER,
      },
      stdio: 'inherit',
    }
  );
  fs.unlinkSync(KEY_PATH);
  if (result.status !== 0) {
    console.error('eas submit failed with code', result.status);
    process.exit(result.status);
  }
}

async function main() {
  console.log(`Polling build ${BUILD_ID} every ${POLL_INTERVAL_MS / 1000}s...`);
  while (true) {
    let build;
    try {
      build = await getBuildStatus();
    } catch (e) {
      console.error('Error checking status:', e.message);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    const ts = new Date().toISOString();
    console.log(`[${ts}] status=${build?.status}`);

    if (build?.status === 'FINISHED') {
      console.log('Build finished! Artifact:', build.artifacts?.buildUrl || '(pending)');
      console.log('Starting App Store Connect submission...');
      await submitBuild();
      console.log('Submission complete!');
      break;
    } else if (build?.status === 'ERRORED' || build?.status === 'CANCELLED') {
      console.error(`Build ended with status: ${build.status}`);
      if (build.error?.message) console.error('Error:', build.error.message);
      process.exit(1);
    } else {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
