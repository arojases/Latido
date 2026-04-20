import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const mode = process.argv[2] === 'production' ? 'production' : 'development';
const envFileName = mode === 'production' ? '.env.production.local' : '.env.local';
const envFilePath = resolve(projectRoot, envFileName);
const outputPath =
  mode === 'production'
    ? resolve(projectRoot, 'src/environments/environment.prod.ts')
    : resolve(projectRoot, 'src/environments/environment.ts');

const fallbackPath = resolve(projectRoot, '.env.example');
const sourcePath = existsSync(envFilePath) ? envFilePath : fallbackPath;
const variables = parseEnvFile(readFileSync(sourcePath, 'utf8'));

const environmentSource = `export const environment = {
  production: ${mode === 'production'},
  appName: '${escapeString(getValue('LATIDO_APP_NAME', 'Latido'))}',
  firebase: {
    apiKey: '${escapeString(getValue('LATIDO_FIREBASE_API_KEY', 'REPLACE_FIREBASE_API_KEY'))}',
    authDomain: '${escapeString(getValue('LATIDO_FIREBASE_AUTH_DOMAIN', 'REPLACE_FIREBASE_AUTH_DOMAIN'))}',
    projectId: '${escapeString(getValue('LATIDO_FIREBASE_PROJECT_ID', 'REPLACE_FIREBASE_PROJECT_ID'))}',
    storageBucket: '${escapeString(getValue('LATIDO_FIREBASE_STORAGE_BUCKET', 'REPLACE_FIREBASE_STORAGE_BUCKET'))}',
    messagingSenderId: '${escapeString(getValue('LATIDO_FIREBASE_MESSAGING_SENDER_ID', 'REPLACE_FIREBASE_MESSAGING_SENDER_ID'))}',
    appId: '${escapeString(getValue('LATIDO_FIREBASE_APP_ID', 'REPLACE_FIREBASE_APP_ID'))}',
    vapidKey: '${escapeString(getValue('LATIDO_FIREBASE_VAPID_KEY', ''))}',
    measurementId: '${escapeString(getValue('LATIDO_FIREBASE_MEASUREMENT_ID', ''))}'
  }
};
`;

writeFileSync(outputPath, environmentSource, 'utf8');

function getValue(key, fallback) {
  return process.env[key] ?? variables[key] ?? fallback;
}

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((result, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex < 0) {
        return result;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      result[key] = stripQuotes(rawValue);
      return result;
    }, {});
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function escapeString(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
