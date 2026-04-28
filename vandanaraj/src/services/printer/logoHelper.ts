import { Buffer } from 'buffer';

// Try to load react-native-blob-util if available for reliable fetch
const loadBlobUtil = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-blob-util');
  } catch {
    return null;
  }
};

/**
 * Normalizes URL by removing double slashes (except after protocol)
 */
export const normalizeUrl = (url: string): string => {
  if (!url) return '';
  return url.replace(/([^:])(\/\/+)/g, '$1/');
};

export const fetchLogoBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  const cleanUrl = normalizeUrl(url);
  const BlobUtil = loadBlobUtil();
  const blobFetch = (BlobUtil as any)?.default?.fetch || (BlobUtil as any)?.fetch;

  try {
    console.log('[LogoHelper] Starting fetch:', cleanUrl);

    // Try standard fetch first (very stable in RN 0.82)
    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    console.log('[LogoHelper] Fetch OK, converting to arrayBuffer');
    const buf = await res.arrayBuffer();

    console.log('[LogoHelper] Buffer received, size:', buf.byteLength);
    const base64 = Buffer.from(buf).toString('base64');

    console.log('[LogoHelper] Base64 conversion complete, length:', base64.length);
    return base64;
  } catch (err: any) {
    console.warn('[LogoHelper] Standard fetch failed, trying BlobUtil fallback:', err.message);

    if (blobFetch) {
      try {
        const res = await blobFetch('GET', cleanUrl);
        const b64 = await res.base64();
        console.log('[LogoHelper] BlobUtil fallback success');
        return b64;
      } catch (fallbackErr) {
        console.warn('[LogoHelper] BlobUtil fallback also failed', fallbackErr);
      }
    }
    return null;
  }
};
