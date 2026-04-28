import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { githubService } from '../services/githubService';
import Icon from 'react-native-vector-icons/MaterialIcons';

export type GitFormValues = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  message: string;
  token: string;
};

type Props = {
  initial?: GitFormValues;
  onCancel: () => void;
  onSave: (values: GitFormValues) => void;
};

export const GitConfigForm: React.FC<Props> = ({
  initial = { owner: '', repo: '', branch: 'main', path: '', message: '', token: '' },
  onCancel,
  onSave,
}) => {
  const [values, setValues] = useState<GitFormValues>(initial);

  const update = (patch: Partial<GitFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const confirmAndSave = async () => {
    if (!values.owner || !values.repo || !values.token) {
      Alert.alert('Missing info', 'Owner, Repository, and Token are required.');
      return;
    }
    const tryConnect = async () => {
      try {
        await githubService.testAuth(values.token);
        console.log('[GitConfig] testAuth success for', { owner: values.owner, repo: values.repo, branch: values.branch });
        Alert.alert('Connected', 'GitHub authentication succeeded.');
        onSave(values);
      } catch (e: any) {
        const msg = e?.message || 'Connection failed. Check token/owner/repo.';
        console.warn('[GitConfig] testAuth failed', msg);
        Alert.alert('Failed to connect', msg);
      }
    };

    Alert.alert('Connect to GitHub', 'Use these credentials to connect?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Connect', onPress: tryConnect },
    ]);
  };

  return (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Config - Git</Text>
        <TouchableOpacity onPress={onCancel}>
          <Icon name="close" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.label}>Owner</Text>
            <TextInput
              style={styles.input}
              placeholder="github-username"
              value={values.owner}
              onChangeText={(t) => update({ owner: t })}
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.label}>Repository</Text>
            <TextInput
              style={styles.input}
              placeholder="repo-name"
              value={values.repo}
              onChangeText={(t) => update({ repo: t })}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.label}>Branch</Text>
            <TextInput
              style={styles.input}
              placeholder="main"
              value={values.branch}
              onChangeText={(t) => update({ branch: t })}
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.label}>Default Path (in repository)</Text>
            <TextInput
              style={styles.input}
              placeholder="payloads/sample.file"
              value={values.path}
              onChangeText={(t) => update({ path: t })}
            />
          </View>
        </View>

        <View style={styles.formCol}>
          <Text style={styles.label}>Default Commit Message</Text>
          <TextInput
            style={styles.input}
            placeholder="chore: push from Muul"
            value={values.message}
            onChangeText={(t) => update({ message: t })}
          />
        </View>

        <View style={styles.formCol}>
          <Text style={styles.label}>Personal Access Token (PAT)</Text>
          <TextInput
            style={styles.input}
            placeholder="ghp_xxxxx"
            value={values.token}
            onChangeText={(t) => update({ token: t })}
            secureTextEntry
          />
        </View>
      </ScrollView>

      <View style={styles.formActions}>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={confirmAndSave}>
          <Text style={styles.saveText}>Save & Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#4f46e5' },
  formRow: { flexDirection: 'row', gap: 10 },
  formCol: { flex: 1, gap: 4 },
  label: { color: '#374151', fontWeight: '700', fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f9fafb' },
  formActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cancel: { color: '#6b7280', fontWeight: '700' },
  saveBtn: { backgroundColor: '#6c5ce7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  saveText: { color: '#fff', fontWeight: '800' },
});
