import { useCallback, useMemo } from 'react';
import { WebViewMessageEvent, WebView } from 'react-native-webview';
import { handleExternalMessage } from '../bridge/externalMessageHandler';

type GitConfig = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  message: string;
  token: string;
};

type BridgeSettings = {
  enableExternalBridge: boolean;
  allowOrigins: string[];
  confirmBeforeExecute: boolean;
  confirmFn: (msg: any) => Promise<boolean>;
};

export const useExternalBridge = ({
  gitConfig,
  bridgeSettings,
  savedProfiles,
  webUrl,
  webRef,
}: {
  gitConfig: GitConfig;
  bridgeSettings: BridgeSettings;
  savedProfiles: any[];
  webUrl: string;
  webRef: React.RefObject<WebView | null>;
}) => {
  const injectedJS = useMemo(
    () => `
    (function() {
      if (!window.externalMessage) {
        window.externalMessage = {
          send: function(jsonString) { window.ReactNativeWebView.postMessage(jsonString); }
        };
      }
    })();
    true;
  `,
    []
  );

  const sendResultToPage = useCallback(
    (result: any) => {
      const payload = JSON.stringify(result).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\u2028|\u2029/g, '');
      const js = `window.dispatchEvent(new CustomEvent('external:result', { detail: ${payload} }));`;
      webRef.current?.injectJavaScript(js);
    },
    [webRef]
  );

  const handleWebMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      if (!data) return;

      const currentUrl = event.nativeEvent.url || webUrl;
      const match = currentUrl.match(/^https?:\/\/[^/]+/i);
      const origin = match ? match[0] : currentUrl;
      let msgType = '';
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed.type === 'string') msgType = parsed.type.toUpperCase();
      } catch {
        // ignore parse errors; handled downstream
      }
      console.log('[WebView] message received', {
        origin,
        length: data?.length || 0,
        preview: data?.slice ? data.slice(0, 120) : '',
      });
      if (msgType !== 'PRINT') {
        console.log('[WebView] using gitConfig', {
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          branch: gitConfig.branch,
          path: gitConfig.path,
          hasToken: !!gitConfig.token,
        });
      } else {
        console.log('[WebView] PRINT message received; skipping git config');
      }

      const result = await handleExternalMessage({
        messageJson: data,
        originUrl: origin,
        gitConfig,
        settings: bridgeSettings,
        savedProfiles,
      });
      console.log('[WebView] sending result back', {
        type: result.type,
        ok: result.ok,
        requestId: result.requestId,
        error: result.error,
      });
      sendResultToPage(result);
    },
    [webUrl, gitConfig, bridgeSettings, sendResultToPage, savedProfiles]
  );

  return { injectedJS, handleWebMessage };
};
