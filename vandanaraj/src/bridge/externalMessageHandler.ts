import JSZip from 'jszip';
import { githubService, GitHubService } from '../services/githubService';
import { printerService } from '../services/printer/printerService';
import { networkPrinterService } from '../services/printer/networkPrinterService';

type MessageType =
  | 'MUULORIGIN'
  | 'PING'
  | 'GIT_FILE'
  | 'GIT_ZIP'
  | 'GIT_PULL'
  | 'GET_SAVED_CREDENTIALS'
  | 'PRINT'
  | undefined;

type BaseMsg = { type: MessageType; requestId?: string };
type GitCommon = { owner?: string; repo?: string; branch?: string; path?: string; message?: string };
type GitFile = BaseMsg &
  GitCommon & {
    type: 'GIT_FILE';
    name?: string;
    dataUrl?: string;
    contentBase64?: string;
    base64?: string;
    contentText?: string;
    mode?: 'create' | 'update';
    saveToDevice?: boolean;
  };
type GitZip = BaseMsg &
  GitCommon & {
    type: 'GIT_ZIP';
    ref?: string;
    saveAs?: string;
    mode?: 'create' | 'update';
    dataUrl?: string;
    contentBase64?: string;
    base64?: string;
    saveToDevice?: boolean;
  };

type AnyMsg = BaseMsg | GitFile | GitZip;

type GitConfig = {
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
  message?: string;
  token?: string;
};

type Settings = {
  enableExternalBridge: boolean;
  allowOrigins: string[];
  confirmBeforeExecute?: boolean;
  confirmFn?: (msg: AnyMsg) => Promise<boolean>;
};

type SafeGitProfile = {
  id: string;
  name?: string;
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
  message?: string;
};

type Result = {
  ok: boolean;
  type: MessageType;
  requestId?: string;
  timestamp: string;
  data: any | null;
  error: { code: string; message: string; details?: any } | null;
};

const nowIso = () => new Date().toISOString();

const errorRes = (msg: AnyMsg, code: string, message: string, details?: any): Result => ({
  ok: false,
  type: msg.type,
  requestId: msg.requestId,
  timestamp: nowIso(),
  data: null,
  error: { code, message, details },
});

const okRes = (msg: AnyMsg, data: any): Result => ({
  ok: true,
  type: msg.type,
  requestId: msg.requestId,
  timestamp: nowIso(),
  data,
  error: null,
});

const isAllowedOrigin = (originUrl: string, allowlist: string[]) =>
  allowlist.some((allowed) => originUrl.startsWith(allowed));

const toRepoPath = (base: string, name: string) => {
  if (!base) return name;
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedName = name.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedName}`;
};

const loadRNFS = () => {
  try {
    return require('react-native-fs');
  } catch {
    return null;
  }
};

const loadAsyncStorage = () => {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
};

const saveBase64ToDevice = async (opts: { base64: string; name: string }) => {
  const RNFS = loadRNFS();
  if (!RNFS) throw new Error('react-native-fs not installed');
  const candidates = [RNFS.DownloadDirectoryPath, RNFS.DocumentDirectoryPath].filter(Boolean) as string[];
  let lastErr: any;
  for (const dir of candidates) {
    try {
      const path = `${dir}/${opts.name}`;
      await RNFS.writeFile(path, opts.base64, 'base64');
      return path;
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Failed to save file');
};

const recordDownload = async (entry: { name: string; repoPath: string; savedTo?: string; error?: string }) => {
  const AsyncStorage = loadAsyncStorage();
  if (!AsyncStorage) return;
  try {
    const existing = await AsyncStorage.getItem('muul_downloads_v1');
    const arr = existing ? (JSON.parse(existing) as any[]) : [];
    const next = [{ ...entry, ts: Date.now() }, ...arr].slice(0, 100);
    await AsyncStorage.setItem('muul_downloads_v1', JSON.stringify(next));
  } catch {
    // best-effort only
  }
};

const getZipBase64 = (zipMsg: GitZip): string | null => {
  const maybeDataUrl = (zipMsg as any).dataUrl as string | undefined;
  if (maybeDataUrl && maybeDataUrl.startsWith('data:')) {
    const base64 = maybeDataUrl.split(',')[1];
    if (base64) return base64;
  }
  const fields = [
    zipMsg.contentBase64,
    (zipMsg as any).contentBase64,
    zipMsg.base64,
    (zipMsg as any).base64,
  ].filter(Boolean) as string[];
  if (fields.length > 0) return fields[0];
  return null;
};

const getFileBase64 = (fileMsg: GitFile): string | null => {
  const maybeDataUrl = (fileMsg as any).dataUrl as string | undefined;
  if (maybeDataUrl && maybeDataUrl.startsWith('data:')) {
    const base64 = maybeDataUrl.split(',')[1];
    if (base64) return base64;
  }
  const fields = [
    fileMsg.contentBase64,
    (fileMsg as any).contentBase64,
    fileMsg.base64,
    (fileMsg as any).base64,
  ].filter(Boolean) as string[];
  if (fields.length > 0) return fields[0];
  return null;
};

const uploadZipEntries = async (opts: {
  base64Zip: string;
  basePath: string;
  mode: 'create' | 'update';
  branch: string;
  message: string;
  owner: string;
  repo: string;
  token: string;
  service: GitHubService;
  saveToDevice?: boolean;
}) => {
  const { base64Zip, basePath, mode, branch, message, owner, repo, token, service, saveToDevice = false } = opts;
  const zip = await JSZip.loadAsync(base64Zip, { base64: true });
  const files = Object.values(zip.files);
  const results: Array<{ path: string; status: 'created' | 'updated' | 'skipped' | 'error'; error?: any }> = [];
  const saved: Array<{ name: string; path: string; savedTo?: string; error?: string }> = [];

  for (const file of files) {
    if (file.dir) continue;
    const repoPath = toRepoPath(basePath, file.name.replace(/\\/g, '/'));
    const contentBase64 = await file.async('base64');
    const tryPut = async (putMode: 'create' | 'update') =>
      service.putFile(token, owner, repo, repoPath, branch, message, contentBase64, putMode, true);

    const trySave = async () => {
      try {
        const savedTo = await saveBase64ToDevice({ base64: contentBase64, name: file.name });
        await recordDownload({ name: file.name, repoPath, savedTo });
        saved.push({ name: file.name, path: repoPath, savedTo });
      } catch (err: any) {
        await recordDownload({
          name: file.name,
          repoPath,
          error: err?.message || 'Failed to save locally',
        });
        saved.push({ name: file.name, path: repoPath, error: err?.message || 'Failed to save locally' });
      }
    };

    try {
      await tryPut(mode);
      results.push({ path: repoPath, status: mode === 'update' ? 'updated' : 'created' });
      if (saveToDevice) await trySave();
    } catch (err: any) {
      const needsUpdate = (putMode: 'create' | 'update') =>
        putMode === 'create' && (err?.code === 'HTTP_422' || /sha/i.test(err?.message || ''));
      if (needsUpdate(mode)) {
        try {
          await tryPut('update');
          results.push({ path: repoPath, status: 'updated' });
          if (saveToDevice) await trySave();
          continue;
        } catch (errUpdate) {
          results.push({ path: repoPath, status: 'error', error: errUpdate });
          if (saveToDevice)
            saved.push({
              name: file.name,
              path: repoPath,
              error: (errUpdate as any)?.message || 'Failed to save locally',
            });
          continue;
        }
      }
      results.push({ path: repoPath, status: 'error', error: err });
      if (saveToDevice)
        saved.push({
          name: file.name,
          path: repoPath,
          error: (err as any)?.message || 'Failed to save locally',
        });
    }
  }

  return {
    uploaded: results.filter((r) => r.status === 'created' || r.status === 'updated'),
    failed: results.filter((r) => r.status === 'error'),
    total: results.length,
    saved,
  };
};

const normalizeGitFields = (payload: Required<GitCommon>): Required<GitCommon> => {
  let owner = (payload.owner || '').trim();
  let repo = (payload.repo || '').trim();
  const branch = (payload.branch || '').trim() || 'main';
  const path = (payload.path || '').trim();
  const message = payload.message;

  if (repo.includes('/')) {
    const parts = repo.split('/').filter(Boolean);
    if (parts.length >= 2) {
      if (!owner) owner = parts[0];
      repo = parts[1];
    }
  }

  return { owner, repo, branch, path, message };
};

type HandlerArgs = {
  msg: AnyMsg;
  merged: (payload: Partial<GitCommon>) => Required<GitCommon>;
  token?: string;
  service: GitHubService;
  originUrl: string;
  savedProfiles: SafeGitProfile[];
};

const handleOrigin = async ({ msg, originUrl }: HandlerArgs) => okRes(msg, { origin: originUrl });
const handlePing = async ({ msg }: HandlerArgs) => okRes(msg, { pong: true });

const handleSavedCreds = async ({ msg, savedProfiles }: HandlerArgs) => {
  console.log('[Bridge] GET_SAVED_CREDENTIALS returning', savedProfiles.length, 'profiles');
  const safe = savedProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    owner: p.owner,
    repo: p.repo,
    branch: p.branch,
    path: p.path,
    message: p.message,
  }));
  return okRes(msg, { profiles: safe });
};
const handlePrint = async ({ msg }: HandlerArgs) => {
  console.log('[Bridge] PRINT received', (msg as any).payload);
  try {
    // Prefer network printer if connected; otherwise fall back to Bluetooth
    if (networkPrinterService.isConnected && networkPrinterService.isConnected()) {
      await networkPrinterService.printDynamic((msg as any).payload);
      return okRes(msg, { printed: true, transport: 'network' });
    }
    await printerService.printDynamic((msg as any).payload);
    return okRes(msg, { printed: true });
  } catch (err: any) {
    return errorRes(msg, 'PRINTER_ERROR', err?.message || 'Print failed', err);
  }
};

const handleGitFile = async ({ msg, merged, token, service }: HandlerArgs) => {
  const m = merged(msg as GitFile);
  const fileMsg = msg as GitFile;
  const fileBase64 = getFileBase64(fileMsg);
  const mode: 'create' | 'update' = fileMsg.mode === 'update' ? 'update' : 'create';
  const hasUploadPayload = !!fileBase64 || !!fileMsg.contentText;

  if (hasUploadPayload) {
    try {
      const name = fileMsg.name;
      if (!name) return errorRes(msg, 'MISSING_NAME', 'File name is required to upload content');
      const targetPath = toRepoPath(m.path, name);

      console.log('[Bridge] GIT_FILE upload', { owner: m.owner, repo: m.repo, path: targetPath, branch: m.branch, mode });

      const tryPut = async (putMode: 'create' | 'update') =>
        service.putFile(
          token!,
          m.owner,
          m.repo,
          targetPath,
          m.branch,
          m.message,
          fileBase64 || fileMsg.contentText || '',
          putMode,
          !!fileBase64 // raw base64 when provided
        );

      let putRes;
      try {
        putRes = await tryPut(mode);
      } catch (err: any) {
        const needsUpdate = (putMode: 'create' | 'update') =>
          putMode === 'create' && (err?.code === 'HTTP_422' || /sha/i.test(err?.message || ''));
        if (needsUpdate(mode)) {
          console.log('[Bridge] GIT_FILE retrying upload with update mode');
          putRes = await tryPut('update');
        } else {
          return errorRes(msg, 'FILE_UPLOAD_FAILED', 'Failed to upload file', err);
        }
      }

      // Optionally save the uploaded content locally too
      let savedTo: string | undefined;
      if (fileMsg.saveToDevice && fileBase64) {
        try {
          savedTo = await saveBase64ToDevice({ base64: fileBase64, name });
          console.log('[Bridge] GIT_FILE upload saved locally', savedTo);
          await recordDownload({ name, repoPath: targetPath, savedTo });
        } catch (err: any) {
          await recordDownload({ name, repoPath: targetPath, error: err?.message || 'Failed to save locally' });
          console.warn('[Bridge] GIT_FILE upload local save failed', err);
        }
      }

      return okRes(msg, savedTo ? { ...putRes, savedTo } : putRes);
    } catch (err: any) {
      console.warn('[Bridge] GIT_FILE upload error', err);
      return errorRes(msg, 'FILE_UPLOAD_FAILED', err?.message || 'Failed to upload file', err);
    }
  }

  console.log('[Bridge] GIT_FILE fetch', { owner: m.owner, repo: m.repo, path: m.path, branch: m.branch });
  const data = await service.getFile(token!, m.owner, m.repo, m.path, m.branch);
  let savedTo: string | undefined;
  if (fileMsg.saveToDevice) {
    try {
      const base64Content = (data as any)?.content as string | undefined;
      const name = fileMsg.name || (m.path ? m.path.split('/').pop() : undefined);
      if (!base64Content || !name) throw new Error('Missing content or name for saving');
      savedTo = await saveBase64ToDevice({ base64: base64Content, name });
      console.log('[Bridge] GIT_FILE saved to device', savedTo);
      await recordDownload({ name, repoPath: m.path, savedTo });
    } catch (err) {
      await recordDownload({
        name: fileMsg.name || m.path || 'download',
        repoPath: m.path,
        error: (err as any)?.message || 'Failed to save file locally',
      });
      return errorRes(msg, 'SAVE_FAILED', 'Failed to save file locally', err);
    }
  }
  return okRes(msg, savedTo ? { ...data, savedTo } : data);
};

const handleGitPull = async ({ msg, merged, token, service }: HandlerArgs) => {
  const m = merged(msg as GitFile);
  console.log('[Bridge] GIT_PULL (zip download)', { owner: m.owner, repo: m.repo, path: m.path, branch: m.branch });
  const saveAs = (msg as any)?.saveAs || `${m.repo}-${m.branch}.zip`;
  const zipRes = await service.downloadZip(token!, m.owner, m.repo, m.branch, saveAs);
  if (zipRes?.savedTo) {
    await recordDownload({ name: saveAs, repoPath: m.path || '/', savedTo: zipRes.savedTo });
  } else {
    await recordDownload({
      name: saveAs,
      repoPath: m.path || '/',
      error: 'Zip saved in memory only (install react-native-fs to persist)',
    });
  }
  return okRes(msg, zipRes);
};

const handleGitZip = async ({ msg, merged, token, service }: HandlerArgs) => {
  const zipMsg = msg as GitZip;
  const m = merged(zipMsg);
  const ref = zipMsg.ref || m.branch;
  const saveAs = zipMsg.saveAs || `${m.repo}-${ref}.zip`;
  const mode = zipMsg.mode === 'update' ? 'update' : 'create';

  const base64Zip = getZipBase64(zipMsg);
  if (base64Zip) {
    try {
      console.log('[Bridge] GIT_ZIP extract and upload contents', { owner: m.owner, repo: m.repo, basePath: m.path });
      const summary = await uploadZipEntries({
        base64Zip,
        basePath: m.path,
        mode,
        branch: m.branch,
        message: m.message,
        owner: m.owner,
        repo: m.repo,
        token: token!,
        service,
        saveToDevice: !!zipMsg.saveToDevice,
      });
      return okRes(msg, summary);
    } catch (err) {
      return errorRes(msg, 'ZIP_UPLOAD_FAILED', 'Failed to upload zip', err);
    }
  }

  console.log('[Bridge] GIT_ZIP download', { owner: m.owner, repo: m.repo, ref, saveAs });
  const data = await service.downloadZip(token!, m.owner, m.repo, ref, saveAs);
  return okRes(msg, data);
};

const handleAutoPush = async ({ msg, merged, token, service }: HandlerArgs) => {
  const m = merged({} as GitCommon);
  console.log('[Bridge] AUTO_PUSH payload for repo', m.repo, 'branch', m.branch, 'pathPrefix', m.path);
  const path = `${m.path ? `${m.path}/` : ''}muul_inbox/${Date.now()}.json`;
  const body = typeof msg === 'object' ? msg : { payload: msg };
  const data = await service.putFile(
    token!,
    m.owner,
    m.repo,
    path,
    m.branch,
    'Auto-save payload from WebView',
    JSON.stringify(body, null, 2),
    'create'
  );
  return okRes(msg, data);
};

type HandlerKey = Exclude<MessageType, undefined> | 'DEFAULT';

const handlers: Record<HandlerKey, (args: HandlerArgs) => Promise<Result>> = {
  MUULORIGIN: handleOrigin,
  PING: handlePing,
  GET_SAVED_CREDENTIALS: handleSavedCreds,
  GIT_FILE: handleGitFile,
  GIT_ZIP: handleGitZip,
  GIT_PULL: handleGitPull,
  PRINT: handlePrint,
  DEFAULT: handleAutoPush,
};

export async function handleExternalMessage(opts: {
  messageJson: string;
  originUrl: string;
  gitConfig: GitConfig;
  settings: Settings;
  service?: GitHubService;
  savedProfiles?: SafeGitProfile[];
}): Promise<Result> {
  const { messageJson, originUrl, gitConfig, settings, service = githubService, savedProfiles = [] } = opts;

  let msg: AnyMsg;
  try {
    const raw = JSON.parse(messageJson);
    // Normalize type casing and support aliases
    if (typeof raw?.type === 'string') {
      raw.type = (raw.type as string).toUpperCase() as MessageType;
    }
    msg = raw as AnyMsg;
  } catch {
    console.warn('[Bridge] Invalid JSON received from', originUrl);
    return errorRes({ type: 'PING' } as AnyMsg, 'BAD_JSON', 'Invalid JSON payload');
  }

  console.log('[Bridge] Incoming message', { type: msg.type, origin: originUrl, requestId: msg.requestId });

  if (!settings.enableExternalBridge) return errorRes(msg, 'BRIDGE_DISABLED', 'Bridge disabled');
  if (!isAllowedOrigin(originUrl, settings.allowOrigins || []))
    return errorRes(msg, 'FORBIDDEN_ORIGIN', 'Origin not allowed');

  if (settings.confirmBeforeExecute && settings.confirmFn) {
    const ok = await settings.confirmFn(msg);
    if (!ok) return errorRes(msg, 'USER_DENIED', 'User rejected request');
  }

  const merged = (payload: Partial<GitCommon>): Required<GitCommon> => ({
    owner: payload.owner || gitConfig.owner || '',
    repo: payload.repo || gitConfig.repo || '',
    branch: payload.branch || gitConfig.branch || 'main',
    path: payload.path || gitConfig.path || '',
    message: payload.message || gitConfig.message || 'Update from Muul',
  });

  const token = gitConfig.token;
  if (!token && msg.type !== 'PING' && msg.type !== 'MUULORIGIN')
    return errorRes(msg, 'NO_TOKEN', 'Missing Git token');

  try {
    const handlerKey: HandlerKey = ((msg.type as MessageType) ?? 'DEFAULT') as HandlerKey;
    const handler = handlers[handlerKey] || handlers.DEFAULT;
    // Normalize owner/repo/branch/path before handing to handlers to avoid malformed "owner/repo" inputs
    const mergedNormalized = (payload: Partial<GitCommon>) => normalizeGitFields(merged(payload));
    return handler({ msg, merged: mergedNormalized, token, service, originUrl, savedProfiles });
  } catch (e: any) {
    const code = e?.code || 'ERROR';
    const message = e?.message || 'Unknown error';
    console.warn('[Bridge] Error handling message', { type: msg.type, code, message, details: e?.details });
    return errorRes(msg, code, message, e?.details || e);
  }
}
