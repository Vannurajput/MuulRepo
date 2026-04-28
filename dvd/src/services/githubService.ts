import { Buffer } from 'buffer';

const API_ROOT = 'https://api.github.com';
const DEFAULT_TIMEOUT = 30000;

export type GitHubService = {
  testAuth: (token: string) => Promise<any>;
  listContents: (token: string, owner: string, repo: string, path: string, branch: string) => Promise<any>;
  getFile: (token: string, owner: string, repo: string, path: string, branch: string) => Promise<any>;
  downloadZip: (token: string, owner: string, repo: string, ref: string, saveAs: string) => Promise<any>;
  putFile: (
    token: string,
    owner: string,
    repo: string,
    path: string,
    branch: string,
    message: string,
    contentText: string,
    mode: 'create' | 'update',
    isBase64Raw?: boolean
  ) => Promise<any>;
};

const withTimeout = async (url: string, init: RequestInit, timeout = DEFAULT_TIMEOUT) => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const id = controller ? setTimeout(() => controller.abort(), timeout) : null;
  try {
    return await fetch(url, { ...init, ...(controller ? { signal: controller.signal as any } : {}) });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const e: any = new Error('Request timed out');
      e.code = 'TIMEOUT';
      throw e;
    }
    throw err;
  } finally {
    if (id) clearTimeout(id);
  }
};

const request = async (token: string, url: string, init: RequestInit = {}) => {
  const res = await withTimeout(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'MuulBrowser-Mobile',
      Authorization: `token ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || res.statusText);
    if (res.status === 401) err.code = 'AUTH_FAILED';
    else if (res.status === 403) err.code = 'FORBIDDEN';
    else if (res.status === 404) err.code = 'NOT_FOUND';
    else if (res.status === 429) err.code = 'RATE_LIMIT';
    else err.code = `HTTP_${res.status}`;
    err.details = text;
    throw err;
  }

  return res;
};

const requestJson = async (token: string, url: string, init: RequestInit = {}) => {
  const res = await request(token, url, init);
  return res.json();
};

const decodeBase64 = (content: string) => Buffer.from(content, 'base64').toString('utf-8');
const encodeBase64 = (content: string) => Buffer.from(content, 'utf-8').toString('base64');

const loadRNFS = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-fs');
  } catch {
    return null;
  }
};

export const githubService: GitHubService = {
  async testAuth(token: string) {
    return requestJson(token, `${API_ROOT}/user`);
  },

  async listContents(token: string, owner: string, repo: string, path: string, branch: string) {
    const cleanPath = path ? `/${path}` : '';
    return requestJson(token, `${API_ROOT}/repos/${owner}/${repo}/contents${cleanPath}?ref=${encodeURIComponent(branch)}`);
  },

  async getFile(token: string, owner: string, repo: string, path: string, branch: string) {
    const data: any = await githubService.listContents(token, owner, repo, path, branch);
    if (Array.isArray(data)) return data;
    if (data?.encoding === 'base64' && data?.content) {
      return { ...data, text: decodeBase64(data.content) };
    }
    return data;
  },

  async downloadZip(token: string, owner: string, repo: string, ref: string, saveAs: string) {
    const res = await request(token, `${API_ROOT}/repos/${owner}/${repo}/zipball/${ref}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');

    const RNFS = loadRNFS();
    if (RNFS) {
      const path = `${RNFS.DocumentDirectoryPath}/${saveAs}`;
      await RNFS.writeFile(path, base64, 'base64');
      return { savedTo: path, bytes: buffer.byteLength };
    }

    return {
      savedTo: null,
      base64,
      note: 'Install react-native-fs to persist the zip to disk.',
    };
  },

  async putFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    branch: string,
    message: string,
    contentText: string,
    mode: 'create' | 'update',
    isBase64Raw?: boolean
  ) {
    let sha: string | undefined;
    if (mode === 'update') {
      try {
        const current: any = await githubService.getFile(token, owner, repo, path, branch);
        sha = current?.sha;
      } catch (err: any) {
        if (err?.code === 'NOT_FOUND') {
          throw new Error('Target file not found for update');
        }
        throw err;
      }
    }

    const body = {
      message,
      content: isBase64Raw ? contentText : encodeBase64(contentText),
      branch,
      ...(sha ? { sha } : {}),
    };

    return requestJson(token, `${API_ROOT}/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};

export type { GitHubService as GitHubServiceType };
