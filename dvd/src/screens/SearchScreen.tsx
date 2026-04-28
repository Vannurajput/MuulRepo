import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export const SearchScreen: React.FC<Props> = ({ value, onChange, onSubmit, onBack }) => {
  const inputRef = useRef<TextInput | null>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchCard}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search or type URL"
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChange}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.actions}>
          <Icon name="mic" size={20} color="#6b7280" />
          <Icon name="photo-camera" size={20} color="#6b7280" />
        </View>
      </View>

      <View style={styles.placeholderWrap}>
        <Icon name="history" size={48} color="#c4c7cf" />
        <Text style={styles.placeholderTitle}>No recent searches yet</Text>
        <Text style={styles.placeholderSub}>Start typing to see suggestions.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  iconBtn: { padding: 6 },
  inputWrap: {
    flex: 1,
  },
  input: { fontSize: 16, color: '#111827', paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  placeholderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderTitle: { fontWeight: '700', color: '#111827' },
  placeholderSub: { color: '#6b7280' },
});
