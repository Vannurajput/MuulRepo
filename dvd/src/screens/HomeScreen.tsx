import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, View, Modal, TouchableWithoutFeedback, BackHandler, PanResponder, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import WebView from 'react-native-webview';
import { CredentialManager } from './CredentialManager';
import { useExternalBridge } from '../hooks/useExternalBridge';

type TabInfo = { id: string; title: string; url: string };
let AsyncStorage: any = null;
try {
  // optional dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onOpenSearch: () => void;
  showWeb: boolean;
  webUrl: string;
};

const MENU_ITEMS = [
  'New Tab',
  'New Window',
  'Set as default browser',
  'Download',
  'History',
  'Skin',
  'Credential Manager',
  'Zoom',
  'DevTools',
  'Exit',
];

const TRENDING = [
  { tag: 'Live', color: '#2563eb', text: 'Live: Latest headlines curated for you' },
  { tag: 'Tech', color: '#9333ea', text: 'Tech: Breakthroughs in AI and devices' },
  { tag: 'Travel', color: '#ea580c', text: 'Travel: Hidden gems near you' },
  { tag: 'Sports', color: '#16a34a', text: 'Sports: Matchday updates' },
  { tag: 'Finance', color: '#0ea5e9', text: 'Finance: Market movers and insights' },
  { tag: 'Health', color: '#f59e0b', text: 'Health: Wellness tips and updates' },
];

type MenuModalProps = {
  visible: boolean;
  onSelect: (label: string) => void;
  onClose: () => void;
};

const MenuModal: React.FC<MenuModalProps> = ({ visible, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.menuOverlay}>
        <TouchableOpacity activeOpacity={1} style={styles.menuCard}>
          {MENU_ITEMS.map((label) => (
            <TouchableOpacity key={label} style={styles.menuRow} onPress={() => onSelect(label)}>
              <Text style={styles.menuLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

type HistoryModalProps = {
  visible: boolean;
  history: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
};

const HistoryModal: React.FC<HistoryModalProps> = ({ visible, history, onSelect, onClose }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.historySafe}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>History</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.historyList}>
        {history.length === 0 ? (
          <Text style={styles.historyEmpty}>No history yet</Text>
        ) : (
          history.map((item, idx) => (
            <TouchableOpacity key={`${item}-${idx}`} style={styles.historyRow} onPress={() => onSelect(item)}>
              <Icon name="history" size={18} color="#6b7280" />
              <Text style={styles.historyText}>{item}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

type DownloadsModalProps = {
  visible: boolean;
  downloads: Array<{ name: string; repoPath: string; savedTo?: string; error?: string; ts: number }>;
  onClose: () => void;
  onRefresh: () => void;
};

const DownloadsModal: React.FC<DownloadsModalProps> = ({ visible, downloads, onClose, onRefresh }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={styles.historySafe}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Downloads</Text>
        <TouchableOpacity onPress={onRefresh} style={{ paddingHorizontal: 8 }}>
          <Icon name="refresh" size={22} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.historyList}>
        {downloads.length === 0 ? (
          <Text style={styles.historyEmpty}>No downloads yet</Text>
        ) : (
          downloads.map((item, idx) => (
            <View key={`${item.repoPath}-${idx}`} style={styles.historyRow}>
              <Icon name={item.error ? 'error-outline' : 'download-done'} size={18} color={item.error ? '#ef4444' : '#2563eb'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyText}>{item.name}</Text>
                <Text style={styles.historySub}>{item.repoPath}</Text>
                {item.savedTo ? <Text style={styles.historySub}>{item.savedTo}</Text> : null}
                {item.error ? <Text style={[styles.historySub, { color: '#ef4444' }]}>{item.error}</Text> : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

type TabsModalProps = {
  visible: boolean;
  tabs: TabInfo[];
  activeTabId: string;
  tabsCount: number;
  onAddTab: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onClose: () => void;
};

const TabsModal: React.FC<TabsModalProps> = ({ visible, tabs, activeTabId, tabsCount, onAddTab, onSelectTab, onCloseTab, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.tabsOverlay}>
        <TouchableOpacity activeOpacity={1} style={styles.tabsCard}>
          <View style={styles.tabsHeader}>
            <TouchableOpacity style={styles.newTabBtn} onPress={onAddTab}>
              <Icon name="add" size={18} color="#2563eb" />
            </TouchableOpacity>
            <View style={styles.tabsCountBadge}>
              <Text style={styles.tabsCountText}>{tabsCount}</Text>
            </View>
            <Icon name="grid-view" size={22} color="#111827" />
          </View>

          <ScrollView contentContainerStyle={styles.tabsList}>
            {tabs.map((tab) => (
              <View
                key={tab.id}
                style={[
                  styles.tabCard,
                  tab.id === activeTabId ? { borderColor: '#2563eb', backgroundColor: '#eef2ff' } : null,
                ]}
              >
                <TouchableOpacity style={{ flex: 1 }} onPress={() => onSelectTab(tab.id)}>
                  <Text style={styles.tabTitle} numberOfLines={1}>
                    {tab.title}
                  </Text>
                  <Text style={styles.tabUrl} numberOfLines={1}>
                    {tab.url}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onCloseTab(tab.id)}>
                  <Icon name="close" size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

export const HomeScreen: React.FC<Props> = ({ value, onChange, onSubmit, onOpenSearch, showWeb, webUrl }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [tabsCount, setTabsCount] = useState(1);
  const [webKey, setWebKey] = useState(0);
  const webRef = useRef<WebView | null>(null);
  const [, setNextTabId] = useState(1);
  const [tabs, setTabs] = useState<Array<TabInfo>>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [showTabs, setShowTabs] = useState(false);
  const [activeSection, setActiveSection] = useState<'home' | 'notifications' | 'activity' | 'search'>('home');
  const [canWebGoBack, setCanWebGoBack] = useState(false);
  const [storedGit, setStoredGit] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    path: '',
    message: 'Update from Muul',
    token: '',
  });
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [downloads, setDownloads] = useState<Array<{ name: string; repoPath: string; savedTo?: string; error?: string; ts: number }>>([]);
  const [showDownloads, setShowDownloads] = useState(false);

  const reloadDownloads = useCallback(() => {
    if (!AsyncStorage) return;
    AsyncStorage.getItem('muul_downloads_v1')
      .then((val: any) => {
        if (!val) return;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) setDownloads(parsed);
      })
      .catch(() => {});
  }, []);

  const addTab = useCallback((url: string) => {
    setNextTabId((n) => {
      const id = `tab-${n}`;
      setTabs((prev) => [...prev, { id, title: `Tab ${prev.length + 1}`, url }]);
      setActiveTabId(id);
      setTabsCount((c) => c + 1);
      setWebKey((k) => k + 1);
      return n + 1;
    });
  }, []);

  const resetTabsToSingle = useCallback(
    (url: string) => {
      setNextTabId((n) => {
        const id = `tab-${n}`;
        setTabs([{ id, title: 'Tab 1', url }]);
        setActiveTabId(id);
        setTabsCount(1);
        setWebKey((k) => k + 1);
        return n + 1;
      });
    },
    []
  );

  const closeTab = useCallback(
    (id: string, fallbackUrl: string) => {
      setTabs((prev) => {
        const nextTabs = prev.filter((t) => t.id !== id);
        if (nextTabs.length === 0) {
          resetTabsToSingle(fallbackUrl);
          return prev;
        }
        if (activeTabId === id) {
          setActiveTabId(nextTabs[0].id);
          setWebKey((k) => k + 1);
        }
        setTabsCount(nextTabs.length);
        return nextTabs;
      });
    },
    [activeTabId, resetTabsToSingle]
  );

  const loadPersistedState = useCallback(async () => {
    if (!AsyncStorage) return;
    try {
      const [storedCreds, storedGitForms, storedHistory, storedDownloads] = await Promise.all([
        AsyncStorage.getItem('muul_creds_v1'),
        AsyncStorage.getItem('muul_gitforms_v1'),
        AsyncStorage.getItem('muul_search_history_v1'),
        AsyncStorage.getItem('muul_downloads_v1'),
      ]);
      let gitMap: Record<string, any> = {};
      if (storedGitForms) gitMap = JSON.parse(storedGitForms);
      if (storedCreds) {
        const parsedCreds = JSON.parse(storedCreds);
        const gitCreds = Array.isArray(parsedCreds)
          ? parsedCreds.filter((c) => (c.type || '').toUpperCase() === 'GIT')
          : [];
        const profiles = gitCreds.map((c: any) => ({
          id: c.id,
          name: c.name,
          owner: gitMap[c.id]?.owner || '',
          repo: gitMap[c.id]?.repo || '',
          branch: gitMap[c.id]?.branch || 'main',
          path: gitMap[c.id]?.path || '',
          message: gitMap[c.id]?.message || 'Update from Muul',
          token: gitMap[c.id]?.token || '',
        }));
        setSavedProfiles(profiles);
        const firstId = profiles[0]?.id;
        if (firstId && gitMap[firstId]) {
          const g = gitMap[firstId];
          setStoredGit({
            owner: g.owner || '',
            repo: g.repo || '',
            branch: g.branch || 'main',
            path: g.path || '',
            message: g.message || 'Update from Muul',
            token: g.token || '',
          });
        }
      }
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) setHistory(parsedHistory);
      }
      if (storedDownloads) {
        const parsedDownloads = JSON.parse(storedDownloads);
        if (Array.isArray(parsedDownloads)) setDownloads(parsedDownloads);
      }
    } catch (e) {
      console.warn('[Home] Failed to load stored git config', e);
    }
  }, []);

  useEffect(() => {
    loadPersistedState();
  }, [loadPersistedState]);

  useEffect(() => {
    // when closing creds modal, reload latest creds/git forms
    if (!showCreds) loadPersistedState();
  }, [showCreds, loadPersistedState]);

  useEffect(() => {
    // initialize tabs once when we have a URL and no tabs yet
    if (!webUrl || tabs.length > 0) return;
    resetTabsToSingle(webUrl);
  }, [webUrl, tabs.length, resetTabsToSingle]);

  // Bridge settings: off by default, origin allowlist is strict, confirm each privileged request
  const allowOrigins = useMemo(
    () => [''],
    []
  );
  const gitConfig = storedGit;
  const confirmExternal = useCallback(
    (msg: any) =>
      new Promise<boolean>((resolve) => {
        Alert.alert('External Request', `Allow operation ${msg.type}?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Allow', onPress: () => resolve(true) },
        ]);
      }),
    []
  );
  const bridgeSettings = useMemo(
    () => ({
      enableExternalBridge: true, // now enabled
      allowOrigins,
      confirmBeforeExecute: true,
      confirmFn: confirmExternal,
    }),
    [allowOrigins, confirmExternal]
  );

  const { injectedJS, handleWebMessage } = useExternalBridge({
    gitConfig,
    bridgeSettings,
    savedProfiles,
    webUrl,
    webRef,
  });

  const goBackInWebView = useCallback(() => {
    if (webRef.current && canWebGoBack) {
      webRef.current.goBack();
    }
  }, [canWebGoBack]);

  const backSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isRightSwipe = gestureState.dx > 20 && Math.abs(gestureState.dy) < 20;
        const isFromEdge = (evt.nativeEvent?.locationX ?? 100) < 30;
        return isRightSwipe && isFromEdge;
      },
      onPanResponderRelease: () => goBackInWebView(),
    })
  ).current;

  const addHistoryEntry = async (query: string) => {
    if (!query) return;
    setHistory((prev) => {
      const next = [query, ...prev].slice(0, 50);
      if (AsyncStorage) AsyncStorage.setItem('muul_search_history_v1', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const navigateActiveTab = useCallback(
    (url: string, title?: string) => {
      setTabs((prev) => {
        if (prev.length === 0) {
          resetTabsToSingle(url);
          return prev;
        }
        const updated = prev.map((t) => (t.id === activeTabId ? { ...t, url, title: t.title || title || url } : t));
        setWebKey((k) => k + 1);
        return updated;
      });
    },
    [activeTabId, resetTabsToSingle]
  );

  const handleHistorySelect = (query: string) => {
    if (!query) return;
    const url = /^https?:\/\//i.test(query) ? query : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    setShowHistory(false);
    onChange(url);
    addHistoryEntry(query);
    navigateActiveTab(url, query);
    setTimeout(() => onSubmit(), 0);
  };

  const handleSelectTab = useCallback((id: string) => {
    setActiveTabId(id);
    setWebKey((k) => k + 1);
    setShowTabs(false);
  }, []);

  const handleCloseTab = useCallback(
    (id: string) => {
      closeTab(id, webUrl);
    },
    [closeTab, webUrl]
  );

  const handleAddTab = useCallback(() => addTab(''), [addTab]);

  const renderHeader = (compact: boolean, includeExtras: boolean = true) => (
    <>
      <View style={styles.topRow}>
        <View style={styles.topSpacer} />
        <View style={styles.brandWrap}>
          <Image source={require('../assets/muul_logo.png')} style={styles.logoIcon} resizeMode="contain" />
          <Text style={styles.title}>MuulBrowser</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.tabBadge}
            onPress={() => {
              addTab('');
              setShowTabs(true);
            }}
          >
            <Text style={styles.tabBadgeText}>{tabsCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Icon name="more-vert" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={onOpenSearch} style={[styles.searchWrap, { marginTop: 10 }]}>
        <Icon name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.input}
          placeholder="Search or type URL"
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => {
            addHistoryEntry(value);
            onSubmit();
          }}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.searchActions}>
          <Icon name="mic" size={20} color="#6b7280" />
          <Icon name="photo-camera" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>

      {!compact && includeExtras && (
        <>
          <View style={[styles.chipsRow, { marginTop: 10 }]}>
            {['AI Mode', 'Discover', 'Images'].map((label) => (
              <View key={label} style={styles.chip}>
                <Text style={styles.chipText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cardsRow}>
            <View style={styles.card}>
             <Text style={styles.cardTitle}>Daffarpur</Text>
              <Text style={styles.cardValue}>58°F</Text>
              <Text style={styles.cardSub}>Cloudy · 10%</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sunset today</Text>
              <Text style={styles.cardValue}>5:32 PM</Text>
              <Text style={styles.cardSub}>Clear sky</Text>
            </View>
          </View>
        </>
      )}
    </>
  );

  const handleMenuAction = (label: string) => {
    setShowMenu(false);
    switch (label) {
      case 'New Tab': {
        addTab(webUrl);
        setShowTabs(true);
        break;
      }
      case 'New Window': {
        resetTabsToSingle('');
        break;
      }
      case 'Set as default browser': {
        Alert.alert('Default Browser', 'Set as default browser is not available on this build.');
        break;
      }
      case 'Download': {
        setShowDownloads(true);
        break;
      }
      case 'History': {
        setShowHistory(true);
        break;
      }
      case 'Skin': {
        Alert.alert('Themes', 'Theme switcher is not implemented yet.');
        break;
      }
      case 'Credential Manager': {
        setShowCreds(true);
        break;
      }
      case 'Zoom': {
        Alert.alert('Zoom', 'Zoom controls are not implemented yet.');
        break;
      }
      case 'DevTools': {
        Alert.alert('DevTools', 'DevTools are not available in this build.');
        break;
      }
      case 'Exit': {
        BackHandler.exitApp();
        break;
      }
      default:
        break;
    }
  };

  const renderHomeBody = () => {
    if (showWeb && tabs.find((t) => t.id === activeTabId && t.url)?.url) {
      return (
        <>
          <View style={styles.headerFixed}>{renderHeader(true)}</View>
          <View style={styles.webBox}>
            <WebView
              ref={webRef}
              key={webKey}
              source={{ uri: tabs.find((t) => t.id === activeTabId)?.url || webUrl }}
              injectedJavaScript={injectedJS}
              onMessage={handleWebMessage}
              onNavigationStateChange={(navState) => setCanWebGoBack(navState.canGoBack)}
              {...backSwipeResponder.panHandlers}
            />
          </View>
        </>
      );
    }

    const header = renderHeader(false);

    return (
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: 0 }]} stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>{header}</View>
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <View style={styles.trendList}>
            {TRENDING.map((item) => (
              <View key={item.text} style={styles.trendCard}>
                <View style={[styles.trendBadge, { backgroundColor: `${item.color}15`, borderColor: item.color }]}>
                  <Text style={[styles.trendBadgeText, { color: item.color }]}>{item.tag}</Text>
                </View>
                <Text style={styles.trendText}>{item.text}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    );
  };

  const renderNotifications = () => (
    <View style={styles.placeholderWrap}>
      <Icon name="notifications-none" size={52} color="#c4c7cf" />
      <Text style={styles.placeholderTitle}>Notifications</Text>
      <Text style={styles.placeholderSub}>You’re all caught up.</Text>
    </View>
  );

  const renderActivity = () => (
    <View style={styles.activityWrap}>
      <View style={styles.activityHeader}>
        <Icon name="history" size={22} color="#2563eb" />
        <Text style={styles.activityTitle}>Recent Activity</Text>
      </View>
      {history.length === 0 ? (
        <View style={styles.placeholderWrap}>
          <Icon name="history" size={52} color="#c4c7cf" />
          <Text style={styles.placeholderTitle}>No recent searches</Text>
          <Text style={styles.placeholderSub}>Start searching to see them here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {history.map((item, idx) => (
            <TouchableOpacity key={`${item}-${idx}`} style={styles.activityCard} onPress={() => handleHistorySelect(item)}>
              <Icon name="search" size={18} color="#6b7280" />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityText}>{item}</Text>
                <Text style={styles.activitySub}>Recent search</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderBody = () => {
    if (activeSection === 'notifications') return renderNotifications();
    if (activeSection === 'activity') return renderActivity();
    return renderHomeBody();
  };

  const navItems = [
    { icon: 'home', label: 'Home', key: 'home' as const, onPress: () => setActiveSection('home') },
    {
      icon: 'search',
      label: 'Search',
      key: 'search' as const,
      onPress: () => {
        setActiveSection('search');
        onOpenSearch();
      },
    },
    { icon: 'notifications-none', label: 'Notifications', key: 'notifications' as const, onPress: () => setActiveSection('notifications') },
    { icon: 'history', label: 'Activity', key: 'activity' as const, onPress: () => setActiveSection('activity') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {renderBody()}

      <MenuModal visible={showMenu} onSelect={handleMenuAction} onClose={() => setShowMenu(false)} />

      <Modal visible={showCreds} animationType="slide" onRequestClose={() => setShowCreds(false)}>
        <CredentialManager onClose={() => setShowCreds(false)} />
      </Modal>

      <HistoryModal visible={showHistory} history={history} onSelect={handleHistorySelect} onClose={() => setShowHistory(false)} />

      <DownloadsModal
        visible={showDownloads}
        downloads={downloads}
        onRefresh={reloadDownloads}
        onClose={() => setShowDownloads(false)}
      />

      <TabsModal
        visible={showTabs}
        tabs={tabs}
        activeTabId={activeTabId}
        tabsCount={tabsCount}
        onAddTab={handleAddTab}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onClose={() => setShowTabs(false)}
      />

      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <TouchableOpacity key={item.label} style={styles.navItem} onPress={item.onPress}>
              <Icon name={item.icon} size={22} color={isActive ? '#2563eb' : '#6b7280'} />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80, gap: 14 },
  headerFixed: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  topSpacer: { width: 48 },
  brandWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 28, height: 28 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginLeft: 6 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  searchActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipText: { color: '#111827', fontWeight: '600' },
  cardsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  card: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  cardTitle: { color: '#111827', fontWeight: '700' },
  cardValue: { color: '#111827', fontSize: 18, fontWeight: '800', marginTop: 6 },
  cardSub: { color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 6 },
  trendList: { gap: 10 },
  trendCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  trendBadgeText: { fontWeight: '700', fontSize: 12 },
  trendText: { color: '#111827', fontWeight: '600' },
  webBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginTop: 10,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  navItem: { alignItems: 'center', gap: 2 },
  navText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  navTextActive: { color: '#2563eb' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', alignItems: 'flex-end', padding: 12 },
  menuCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuRow: { paddingHorizontal: 14, paddingVertical: 12 },
  menuLabel: { color: '#111827', fontSize: 14, fontWeight: '600' },
  menuClose: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  tabBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: { fontWeight: '800', color: '#1f2937' },
  tabsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-start', paddingTop: 40 },
  tabsCard: {
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '80%',
  },
  tabsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  newTabBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsCountBadge: {
    minWidth: 32,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
    tabsCountText: { fontWeight: '800', color: '#111827' },
    tabsList: { gap: 10 },
    tabCard: {
      flexDirection: 'row',
      alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
  },
    tabTitle: { fontWeight: '700', color: '#111827', marginBottom: 2 },
    tabUrl: { color: '#6b7280', fontSize: 12 },
    historySafe: { flex: 1, backgroundColor: '#fff' },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    historyTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    historyList: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  historyText: { color: '#111827', fontWeight: '600' },
  historyEmpty: { color: '#6b7280', padding: 16 },
  historySub: { color: '#6b7280', fontSize: 11 },
  placeholderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  placeholderTitle: { fontWeight: '700', color: '#111827', fontSize: 16 },
  placeholderSub: { color: '#6b7280' },
  activityWrap: { flex: 1, backgroundColor: '#fff' },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  activityTitle: { fontWeight: '800', color: '#111827', fontSize: 18 },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityText: { color: '#111827', fontWeight: '600' },
  activitySub: { color: '#6b7280', fontSize: 11 },
  stickyHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
});









