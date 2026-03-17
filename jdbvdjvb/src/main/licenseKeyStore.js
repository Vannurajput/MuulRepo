const fs = require('fs/promises');
const path = require('path');
const os = require('os');

let app;
let electronModule;
try {
  electronModule = require('electron');
} catch (_) {}

app =
  electronModule?.app && typeof electronModule.app.getPath === 'function'
    ? electronModule.app
    : {
        getPath(name) {
          if (name === 'userData') return path.join(os.homedir(), 'AppData', 'Roaming', 'MuulBrowser');
          return path.join(os.homedir(), 'AppData', 'Roaming', 'MuulBrowser');
        }
      };

const STORE_FILE = path.join(app.getPath('userData'), 'license-keys.json');

const generateId = () => `lk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeStore(data) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function list() {
  return readStore();
}

async function save(entry = {}) {
  const keys = await readStore();
  const payload = {
    ...entry,
    id: entry.id || generateId(),
    key: (entry.key || '').trim(),
    updatedAt: Date.now(),
    createdAt: entry.createdAt || Date.now()
  };
  if (!payload.key) {
    throw new Error('License key cannot be empty');
  }
  const index = keys.findIndex((k) => k.id === payload.id);
  if (index >= 0) {
    keys[index] = payload;
  } else {
    keys.push(payload);
  }
  await writeStore(keys);
  return payload;
}

async function remove(id) {
  if (!id) return false;
  const keys = await readStore();
  const index = keys.findIndex((k) => k.id === id);
  if (index === -1) return false;
  keys.splice(index, 1);
  await writeStore(keys);
  return true;
}

module.exports = { list, save, remove };
