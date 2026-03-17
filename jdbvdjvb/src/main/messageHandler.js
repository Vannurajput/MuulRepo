// src/main/messageHandler.js
const fs = require('fs/promises');
const path = require('path');
const ConnectorFactory = require('./connectors/ConnectorFactory');
const handleLocalZip = require('./handleLocalZip');
const log = require('../logger');

// Allow listing for quick PING health-checks
const MUULOGIN_HOSTS = ['muulogin.mycompany.com', 'muulogin.internal'];

// Normalize incoming message into the payload we pass to connectors
function buildPayload(message) {
  return {
    git: message.git || {},
    db: message.db || {},
    dbType: message.dbType || null,
    metadata: message.metadata || {}
  };
}

// -----------------------------
// Local Config helpers (NEW)
// -----------------------------
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function extractFolderPath(item) {
  if (!item || typeof item !== 'object') return '';

  // Prefer explicit local-config fields
  const direct =
    item.folderPath ||
    item.localPath ||
    item.path ||
    item.secret;

  if (isNonEmptyString(direct)) return String(direct).trim();

  // Fallback: some entries store path inside description like: "Local path: C:\..."
  const desc = item.description;
  if (isNonEmptyString(desc)) {
    const s = String(desc).trim();
    const m = s.match(/^local path:\s*(.+)$/i);
    if (m && isNonEmptyString(m[1])) return String(m[1]).trim();
  }

  return '';
}

function extractFolderName(item) {
  if (!item || typeof item !== 'object') return '';

  const raw =
    item.folderName ||
    item.name ||
    item.label;

  if (!isNonEmptyString(raw)) return '';
  return String(raw).replace(/^local\s*-\s*/i, '').trim();
}

function looksLikeFsPath(p) {
  if (!isNonEmptyString(p)) return false;
  const s = String(p).trim();

  // Windows absolute: C:\ or C:/
  if (/^[a-zA-Z]:[\\/]/.test(s)) return true;
  // UNC path: \\server\share
  if (/^\\\\/.test(s)) return true;
  // POSIX absolute: /home/user
  if (s.startsWith('/')) return true;

  return false;
}

/**
 * Keep ONLY "Save to local disk" configs.
 * We accept entries that:
 * - have a real-looking filesystem path, AND
 * - have a folder name/label we can display
 */
function filterOnlyLocalDiskConfigs(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((item) => {
      const folderPath = extractFolderPath(item);
      const folderName = extractFolderName(item);

      // Preserve id if present
      const id = item && typeof item === 'object' ? item.id : undefined;

      return { id, folderName, folderPath, __raw: item };
    })
    .filter((x) => looksLikeFsPath(x.folderPath) && isNonEmptyString(x.folderName))
    .map(({ __raw, ...clean }) => clean);
}

async function handleExternalMessage(message, options = {}) {
  const { onHandshakeStatus, handshakeContext } = options || {};

  const summary = {
    ...message,
    dataUrl: message?.dataUrl ? '[omitted]' : undefined
  };
  log.info('[MessageHandler] received external message:', summary);

  // NOTE: changed const -> let (so we can alias GET_LOCAL_CONFIGS -> GET_LOCAL_CONFIG)
  let type = message?.type;
  let normalizedType = (type || '').toUpperCase();

  // -----------------------------
  // Alias support (NEW)
  // -----------------------------
  if (normalizedType === 'GET_LOCAL_CONFIGS') {
    // Treat as GET_LOCAL_CONFIG to avoid "Unknown connector type"
    type = 'GET_LOCAL_CONFIG';
    normalizedType = 'GET_LOCAL_CONFIG';
    message.type = 'GET_LOCAL_CONFIG';
  }

  if (!type) {
    // If a DB query comes without type but has connectionname + sql, route directly
    if (message?.connectionname && message?.sql) {
      try {
        const DbQueryRouter = require('./connectors/DbQueryRouter');
        const router = new DbQueryRouter();
        const res = await router.execute({ ...message });
        log.info('[MessageHandler] connector result (summary):', res);
        return res;
      } catch (error) {
        return { ok: false, error: error?.message || 'DB query failed', requestId: message?.requestId };
      }
    }
    log.warn('[MessageHandler] message missing \"type\" field:', message);
    return { ok: false, error: 'Message missing \"type\"' };
  }

  const respondError = (err) => {
    const msg = err?.message || String(err);
    log.error('[MessageHandler] error handling message:', msg, { requestId: message?.requestId });
    return { ok: false, error: msg, requestId: message?.requestId };
  };

  try {
    if (normalizedType === 'MUULORIGIN') {
      const url = handshakeContext?.url || '';
      log.info('[MessageHandler] MUULORIGIN handshake received', { url });
      if (typeof onHandshakeStatus === 'function') {
        onHandshakeStatus({
          ok: true,
          url,
          isMuulorigin: true
        });
      }
      return { ok: true, isMuulorigin: true, message: 'Muulorigin handshake acknowledged' };
    }

    if (normalizedType === 'PING') {
      const href = message?.href;
      if (!href || typeof href !== 'string') {
        log.warn('[MessageHandler] PING missing href', message);
        return { ok: false, isMuuLogin: false, message: 'Invalid or missing href' };
      }
      let hostname = '';
      try {
        const parsed = new URL(href);
        hostname = parsed.hostname || '';
      } catch (error) {
        log.warn('[MessageHandler] PING invalid href', { href });
        return { ok: false, isMuuLogin: false, message: 'Invalid or missing href' };
      }
      const isMuuLogin = MUULOGIN_HOSTS.some((host) => host && host.toLowerCase() === hostname.toLowerCase());
      const response = isMuuLogin
        ? { ok: true, isMuuLogin: true, message: 'MuuLogin OK' }
        : { ok: true, isMuuLogin: false, message: 'Not MuuLogin' };
      log.debug('[MessageHandler] PING evaluated hostname', { hostname, isMuuLogin });
      return response;
    }

    if (normalizedType === 'EXECUTE_REMOTE_QUERY') {
      try {
        const DbQueryRouter = require('./connectors/DbQueryRouter');
        const router = new DbQueryRouter();
        // Normalize dbType hints if the caller used nested db payloads
        const dbType =
          message.dbType ||
          message.db?.dbType ||
          message.db?.type ||
          message.db_type ||
          null;
        const res = await router.execute({
          ...message,
          ...(dbType ? { dbType } : {})
        });
        log.info('[MessageHandler] connector result (summary):', res);
        return res;
      } catch (error) {
        log.error('[MessageHandler] EXECUTE_REMOTE_QUERY failed:', error?.message || error);
        return {
          ok: false,
          error: error?.message || 'DB query failed',
          requestId: message?.requestId
        };
      }
    }

    if (normalizedType === 'GET_LOCAL_CONFIG') {
      try {
        const LocalConfigService = require('./LocalConfigService');
        const service = new LocalConfigService();
        // Return ONLY local-disk configs (filtered) instead of mixed entries (NEW)
        const all = await service.getAllLocalConfigs();
        const data = filterOnlyLocalDiskConfigs(all);
        return { ok: true, data, requestId: message?.requestId };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || 'Failed to load local config',
          requestId: message?.requestId
        };
      }
    }

    if (normalizedType === 'GET_FOLDER_DETAILS') {
      try {
        const LocalConfigService = require('./LocalConfigService');
        const service = new LocalConfigService();
        // Return details only for local-disk configs (filtered) (NEW)
        const allConfigs = await service.getAllLocalConfigs();
        const configs = filterOnlyLocalDiskConfigs(allConfigs);
        const results = [];

        for (const config of configs) {
          try {
            const details = await service.getFolderDetailsForPath(config.folderPath, config.folderName);
            results.push({
              id: config.id,
              ...details
            });
          } catch (err) {
            // If one folder fails, still return the others
            results.push({
              id: config.id,
              folderPath: config.folderPath,
              folderName: config.folderName,
              error: err?.message || 'Failed to read folder'
            });
          }
        }

        return { ok: true, data: results, requestId: message?.requestId };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || 'Failed to get folder details',
          requestId: message?.requestId
        };
      }
    }

    // -----------------------------
    // Direct file operations (NEW)
    // -----------------------------
    if (
      normalizedType === 'READ_FILE' ||
      normalizedType === 'WRITE_FILE' ||
      normalizedType === 'APPEND_FILE'
    ) {
      try {
        const filePath = message?.path;
        if (!filePath) {
          return { ok: false, error: 'path is required', requestId: message?.requestId };
        }

        // Use explicit basePath if provided, otherwise fall back to first saved local config
        let basePath = message?.basePath;
        if (!basePath) {
          const LocalConfigService = require('./LocalConfigService');
          const service = new LocalConfigService();
          const configs = await service.getAllLocalConfigs();
          const filtered = filterOnlyLocalDiskConfigs(configs);
          if (filtered.length > 0) {
            basePath = filtered[0].folderPath;
          }
        }
        if (!basePath) {
          return { ok: false, error: 'No basePath provided and no local config saved', requestId: message?.requestId };
        }

        const fullPath = path.resolve(path.join(basePath, filePath));
        if (!fullPath.startsWith(path.resolve(basePath))) {
          return { ok: false, error: 'Directory traversal attempt blocked', requestId: message?.requestId };
        }

        if (normalizedType === 'READ_FILE') {
          const content = await fs.readFile(fullPath, 'utf8');
          return { ok: true, content, requestId: message?.requestId };
        }

        const content = message?.content || '';

        if (normalizedType === 'WRITE_FILE') {
          const parentDir = path.dirname(fullPath);
          await fs.mkdir(parentDir, { recursive: true });
          await fs.writeFile(fullPath, content, 'utf8');
          return { ok: true, requestId: message?.requestId };
        }

        // APPEND_FILE
        await fs.appendFile(fullPath, content, 'utf8');
        return { ok: true, requestId: message?.requestId };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || 'File operation failed',
          requestId: message?.requestId
        };
      }
    }

    log.debug('[MessageHandler] resolving connector for type:', type);
    const connector = ConnectorFactory.create(type);
    if (!connector) {
      throw new Error(`Unknown connector type: ${type}`);
    }

    let payload;
    if (Object.prototype.hasOwnProperty.call(message, 'payload')) {
      payload = message.payload;
      log.debug('[MessageHandler] using message.payload for connector:', JSON.stringify(payload, null, 2));
    } else {
      if (
        normalizedType === 'GIT_ZIP' ||
        normalizedType === 'GIT_FILE' ||
        normalizedType === 'GIT_PULL' ||
        normalizedType === 'POSTGRE' ||
        normalizedType === 'POSTGRES' ||
        normalizedType === 'POSTGRESQL' ||
        normalizedType === 'MYSQL' ||
        normalizedType === 'MSSQL' ||
        normalizedType === 'SQLSERVER' ||
        normalizedType === 'SQL_SERVER' ||
        normalizedType === 'GET_SAVED_CREDENTIALS' ||
        normalizedType === 'READ_FILE' ||
        normalizedType === 'WRITE_FILE' ||
        normalizedType === 'APPEND_FILE'
      ) {
        payload = { ...message };
      } else {
        payload = buildPayload(message);
      }
      log.debug('[MessageHandler] built legacy payload from message:', JSON.stringify(payload, null, 2));
    }

    if (normalizedType === 'GIT_ZIP') {
      const target = (message.target || payload?.target || 'github').toLowerCase();
      if (target === 'local') {
        const localResult = await handleLocalZip(payload);
        log.debug('[MessageHandler] local zip result:', localResult);
        return { ok: true, data: localResult };
      }
      if (target === 'both') {
        const localResult = await handleLocalZip(payload);
        const gitResult = await connector.execute(payload);
        const combined = { local: localResult, github: gitResult };
        log.debug('[MessageHandler] combined local+github zip result:', combined);
        return { ok: true, data: combined };
      }
      // default: github only falls through
    }

    const result = await connector.execute(payload);
    // Surface connector result to both debug (detailed) and info (summary) so it is visible in logs
    log.debug('[MessageHandler] connector result:', result);
    log.info('[MessageHandler] connector result (summary):', result);

    // DB_QUERY returns a full response envelope itself so the webpage gets { ok, requestId, rows, rowCount } directly.
    if (
      normalizedType === 'POSTGRE' ||
      normalizedType === 'POSTGRES' ||
      normalizedType === 'POSTGRESQL' ||
      normalizedType === 'MYSQL' ||
      normalizedType === 'MSSQL' ||
      normalizedType === 'SQLSERVER' ||
      normalizedType === 'SQL_SERVER' ||
      normalizedType === 'GET_SAVED_CREDENTIALS'
    ) {
      return result;
    }

    return { ok: true, data: result };
  } catch (err) {
    return respondError(err);
  }
}

module.exports = { handleExternalMessage };
