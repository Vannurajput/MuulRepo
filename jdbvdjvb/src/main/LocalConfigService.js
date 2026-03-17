// src/main/LocalConfigService.js
const { app } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const credentialRegistry = require('./credentialRegistry');

// -----------------------------
// Helpers (ADDED)
// -----------------------------
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function extractFolderPathFromEntry(entry) {
  if (!entry || typeof entry !== 'object') return '';

  // Prefer explicit fields used by your app
  const direct =
    entry.folderPath ||
    entry.localPath ||
    entry.path ||
    entry.secret;

  if (isNonEmptyString(direct)) return String(direct).trim();

  // Some entries store: "Local path: C:\...." in description
  const desc = entry.description;
  if (isNonEmptyString(desc)) {
    const s = String(desc).trim();
    const m = s.match(/^local path:\s*(.+)$/i);
    if (m && isNonEmptyString(m[1])) return String(m[1]).trim();
    // If description itself is a path, allow it (but only if it looks like a filesystem path)
    return s;
  }

  return '';
}

function extractFolderNameFromEntry(entry) {
  if (!entry || typeof entry !== 'object') return '';

  const raw =
    entry.folderName ||
    entry.name ||
    entry.label;

  if (!isNonEmptyString(raw)) return '';
  // Remove "Local - " prefix saved by Local Config screen
  return String(raw).replace(/^local\s*-\s*/i, '').trim();
}

function looksLikeFilesystemPath(p) {
  if (!isNonEmptyString(p)) return false;
  const s = String(p).trim();

  // Block obvious URLs
  if (/^[a-zA-Z]+:\/\//.test(s)) return false;

  // Windows absolute: C:\ or C:/
  if (/^[a-zA-Z]:[\\/]/.test(s)) return true;

  // UNC path: \\server\share
  if (/^\\\\/.test(s)) return true;

  // POSIX absolute: /home/user
  if (s.startsWith('/')) return true;

  // Also allow paths that contain separators (common for absolute paths stored without drive check)
  if (s.includes('\\') || s.includes('/')) return true;

  return false;
}

/**
 * IMPORTANT:
 * We only want configs created via "Save to local disk" screen.
 * Those entries typically have:
 *  - label/name like "Local - <folder>"
 *  - description like "Local path: <path>"
 *  - secret/path contains actual folder path
 */
function isLocalDiskConfigEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;

  const label = String(entry.label || '').toLowerCase();
  const name = String(entry.name || '').toLowerCase();
  const desc = String(entry.description || '').toLowerCase();

  const looksLocal =
    label.startsWith('local') ||
    name.startsWith('local') ||
    desc.startsWith('local path:');

  if (!looksLocal) return false;

  const folderPath = extractFolderPathFromEntry(entry);
  if (!looksLikeFilesystemPath(folderPath)) return false;

  // Must have a displayable name OR at least a usable path
  const folderName = extractFolderNameFromEntry(entry);
  return isNonEmptyString(folderName) || isNonEmptyString(folderPath);
}

class LocalConfigService {
  getUserDataPath() {
    try {
      const p = app?.getPath?.('userData');
      if (p) return p;
    } catch (_) {
      /* fall through */
    }
    return process.cwd();
  }

  async getLocalConfig() {
    const userDataPath = this.getUserDataPath();
    const configPath = path.join(userDataPath, 'local-config.json');

    try {
      await fs.access(configPath);
    } catch (_) {
      // If the file does not exist, fall back to the credential registry.
      const fallback = await this.getLocalConfigFromRegistry();
      if (fallback) return fallback;
      return {};
    }

    try {
      const raw = await fs.readFile(configPath, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      const folderPath =
        parsed.folderPath || parsed.path || parsed.folder_path || parsed.folder || '';
      const folderName =
        parsed.folderName || parsed.name || parsed.folder_name || parsed.folder || '';
      if (folderPath || folderName) {
        return { folderPath, folderName };
      }
      // If file exists but has no usable fields, try registry before erroring out.
      const fallback = await this.getLocalConfigFromRegistry();
      if (fallback) return fallback;
      return {};
    } catch (error) {
      throw new Error(`Failed to read local config: ${error?.message || error}`);
    }
  }

  async getLocalConfigFromRegistry() {
    try {
      const entries = await credentialRegistry.list('other');
      if (!entries || !entries.length) return null;

      // ✅ CHANGED: only pick entries that look like "Save to local disk" configs
      const candidate = entries.find((item) => isLocalDiskConfigEntry(item));
      if (!candidate) return null;

      const folderPath = extractFolderPathFromEntry(candidate);
      let folderName = extractFolderNameFromEntry(candidate);

      if (!isNonEmptyString(folderName) && looksLikeFilesystemPath(folderPath)) {
        folderName = path.basename(folderPath);
      }

      if (!folderPath && !folderName) return null;
      return { folderPath, folderName };
    } catch (error) {
      return null;
    }
  }

  async getAllLocalConfigs() {
    try {
      const entries = await credentialRegistry.list('other');
      if (!entries || !entries.length) return [];

      // ✅ CHANGED: return ONLY "Save to local disk" configs (no DB/printer/etc.)
      const localConfigs = entries
        .filter((item) => isLocalDiskConfigEntry(item))
        .map((item) => {
          const folderPath = extractFolderPathFromEntry(item);
          let folderName = extractFolderNameFromEntry(item);

          if (!isNonEmptyString(folderName) && looksLikeFilesystemPath(folderPath)) {
            folderName = path.basename(folderPath);
          }

          return {
            id: item.id,
            folderPath: folderPath || '',
            folderName: folderName || ''
          };
        })
        .filter((item) => looksLikeFilesystemPath(item.folderPath) && isNonEmptyString(item.folderName));

      return localConfigs;
    } catch (error) {
      return [];
    }
  }

  async sanitizePath(fileName) {
    if (!fileName) throw new Error('File name is required');
    const config = await this.getLocalConfig();
    const folderPath = config?.folderPath;
    if (!folderPath) throw new Error('No folder path configured');

    const fullPath = path.resolve(folderPath, fileName);
    if (!fullPath.startsWith(path.resolve(folderPath))) {
      throw new Error('Directory traversal attempt blocked');
    }
    return fullPath;
  }

  async readFile(payload) {
    const fileName = payload?.path || payload?.fileName;
    const fullPath = await this.sanitizePath(fileName);
    try {
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async writeFile(payload) {
    const fileName = payload?.path || payload?.fileName;
    const content = payload?.content || '';
    const fullPath = await this.sanitizePath(fileName);
    try {
      await fs.writeFile(fullPath, content, 'utf8');
      return { ok: true, message: 'File written successfully' };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  async appendFile(payload) {
    const fileName = payload?.path || payload?.fileName;
    const content = payload?.content || '';
    const fullPath = await this.sanitizePath(fileName);
    try {
      await fs.appendFile(fullPath, content, 'utf8');
      return { ok: true, message: 'Content appended successfully' };
    } catch (error) {
      throw new Error(`Failed to append to file: ${error.message}`);
    }
  }

  async getFolderDetails() {
    const config = await this.getLocalConfig();
    const folderPath = config?.folderPath;

    if (!folderPath) {
      throw new Error('No folder path configured. Please save a folder path first.');
    }

    // Check if the folder exists
    try {
      await fs.access(folderPath);
    } catch (_) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    // Read directory contents
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const contents = [];

    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry.name);
      const item = {
        name: entry.name,
        type: entry.isDirectory() ? 'folder' : 'file',
        size: null
      };

      // Get file size (only for files, not folders)
      if (!entry.isDirectory()) {
        try {
          const stat = await fs.stat(entryPath);
          item.size = stat.size;
        } catch (_) {
          // If we can't get the size, leave it as null
        }
      }

      contents.push(item);
    }

    // Sort: folders first, then files, alphabetically
    contents.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      folderPath,
      folderName: config?.folderName || path.basename(folderPath),
      contents
    };
  }

  async getFolderDetailsForPath(folderPath, folderName = '', maxDepth = 10, currentDepth = 0) {
    if (!folderPath) {
      throw new Error('No folder path provided.');
    }

    // Check if the folder exists
    try {
      await fs.access(folderPath);
    } catch (_) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }

    // Skip node_modules and .git for performance (too many files)
    const skipFolders = ['node_modules', '.git'];
    const baseName = path.basename(folderPath);
    if (skipFolders.includes(baseName) && currentDepth > 0) {
      return {
        folderPath,
        folderName: folderName || baseName,
        contents: [],
        skipped: true,
        reason: 'Too many files (skipped for performance)'
      };
    }

    // Read directory contents
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    const contents = [];

    for (const entry of entries) {
      const entryPath = path.join(folderPath, entry.name);
      const item = {
        name: entry.name,
        type: entry.isDirectory() ? 'folder' : 'file',
        size: null
      };

      if (entry.isDirectory()) {
        // Recursively get subfolder contents (if within depth limit)
        if (currentDepth < maxDepth) {
          try {
            const subfolderDetails = await this.getFolderDetailsForPath(
              entryPath,
              entry.name,
              maxDepth,
              currentDepth + 1
            );
            item.contents = subfolderDetails.contents;
            item.skipped = subfolderDetails.skipped;
            item.reason = subfolderDetails.reason;
          } catch (err) {
            item.contents = [];
            item.error = err?.message || 'Failed to read folder';
          }
        } else {
          item.contents = [];
          item.skipped = true;
          item.reason = 'Max depth reached';
        }
      } else {
        // Get file size
        try {
          const stat = await fs.stat(entryPath);
          item.size = stat.size;
        } catch (_) {
          // If we can't get the size, leave it as null
        }
      }

      contents.push(item);
    }

    // Sort: folders first, then files, alphabetically
    contents.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      folderPath,
      folderName: folderName || path.basename(folderPath),
      contents
    };
  }
}

module.exports = LocalConfigService;
