import React, { useCallback, useState } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';

const HOME_URL = 'https://www.google.com';

function normalizeToUrlOrSearch(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  if (/\.\w{2,}$/.test(trimmed) || trimmed.includes('.')) return 'https://' + trimmed;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export default function App() {
  const [stage, setStage] = useState<'home' | 'search'>('home');
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [showWeb, setShowWeb] = useState(false);

  const submit = useCallback(() => {
    const next = normalizeToUrlOrSearch(urlInput);
    setCurrentUrl(next);
    setShowWeb(true);
    setStage('home');
  }, [urlInput]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {stage === 'home' && (
        <HomeScreen
          value={urlInput}
          onChange={setUrlInput}
          onSubmit={() => { submit(); }}
          onOpenSearch={() => setStage('search')}
          showWeb={showWeb}
          webUrl={currentUrl}
        />
      )}

      {stage === 'search' && (
        <SearchScreen
          value={urlInput}
          onChange={setUrlInput}
          onSubmit={() => { submit(); }}
          onBack={() => setStage('home')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  webContainer: { flex: 1 },
});
