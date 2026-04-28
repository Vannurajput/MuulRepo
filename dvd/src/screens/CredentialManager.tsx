import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { GitConfigForm, GitFormValues } from './GitConfigForm';
import { BluetoothPrinterScreen } from './BluetoothPrinterScreen';
import { NetworkPrinterScreen } from './NetworkPrinterScreen';

type Credential = {
  id: string;
  name: string;
  type: string;
  status: string;
  detail: string;
};

type Props = {
  data?: Credential[];
  onClose: () => void;
};

const defaultCreds: Credential[] = [];

let savedCreds: Credential[] = defaultCreds;
let savedGitForms: Record<string, GitFormValues> = {};
let AsyncStorage: any = null;
try {
  // Optional; if not installed, we still keep in-memory copies
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  AsyncStorage = null;
}

export const CredentialManager: React.FC<Props> = ({ data = defaultCreds, onClose }) => {
  const [creds, setCreds] = useState<Credential[]>(savedCreds.length ? savedCreds : data);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeForm, setActiveForm] = useState<'Git' | 'Printer' | 'NetworkPrinter' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formInitialGit, setFormInitialGit] = useState<GitFormValues>({
    owner: '',
    repo: '',
    branch: 'main',
    path: '',
    message: '',
    token: '',
  });
  const [gitForms, setGitForms] = useState<Record<string, GitFormValues>>({});

  useEffect(() => {
    if (!AsyncStorage) return;
    (async () => {
      try {
        const storedCreds = await AsyncStorage.getItem('muul_creds_v1');
        const storedGit = await AsyncStorage.getItem('muul_gitforms_v1');
        if (storedCreds) {
          const parsed = JSON.parse(storedCreds) as Credential[];
          savedCreds = parsed;
          setCreds(parsed);
        }
        if (storedGit) {
          const parsedGit = JSON.parse(storedGit) as Record<string, GitFormValues>;
          savedGitForms = parsedGit;
          setGitForms(parsedGit);
        }
      } catch (e) {
        console.warn('[Creds] Failed to load stored credentials', e);
      }
    })();
  }, []);

  const persist = async (nextCreds: Credential[], nextGit: Record<string, GitFormValues>) => {
    savedCreds = nextCreds;
    savedGitForms = nextGit;
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem('muul_creds_v1', JSON.stringify(nextCreds));
      await AsyncStorage.setItem('muul_gitforms_v1', JSON.stringify(nextGit));
    } catch (e) {
      console.warn('[Creds] Failed to persist credentials', e);
    }
  };

  const addOrUpdateCredential = (
    vals: Partial<GitFormValues & { type: string; name?: string; detail?: string; status?: string }>,
    id?: string | null
  ) => {
    if (!vals.type) return;
    const friendlyName =
      vals.name || (vals.owner && vals.repo ? `${vals.owner}/${vals.repo}` : vals.owner || vals.repo || 'Git Credentials');
    const detail = vals.detail || vals.path || vals.branch || '';
    const newCred: Credential = {
      id: id ?? String(Date.now()),
      name: friendlyName,
      type: vals.type || '',
      status: vals.status || 'Configured',
      detail,
    };

    setCreds((prev) => {
      const nextCreds = id ? prev.map((c) => (c.id === id ? newCred : c)) : [newCred, ...prev];
      setGitForms((prevGit) => {
        const gitVals: GitFormValues | null =
          (vals.type || '').toLowerCase() === 'git'
            ? {
              owner: vals.owner || '',
              repo: vals.repo || '',
              branch: vals.branch || 'main',
              path: vals.path || '',
              message: vals.message || '',
              token: vals.token || '',
            }
            : null;
        const nextGit = gitVals ? { ...prevGit, [newCred.id]: gitVals } : prevGit;
        persist(nextCreds, nextGit);
        return nextGit;
      });
      return nextCreds;
    });

    setShowForm(false);
    setShowAddMenu(false);
    setEditingId(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Muul Credential Studio</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.addWrap}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setFormInitialGit({ owner: '', repo: '', branch: 'main', path: '', message: '', token: '' });
              setEditingId(null);
              setShowAddMenu((s) => !s);
            }}
          >
            <Text style={styles.addBtnText}>+ Add Config</Text>
            <Text style={styles.addChevron}>{showAddMenu ? 'E,' : 'E.'}</Text>
          </TouchableOpacity>
          {showAddMenu && (
            <View style={styles.addMenu}>
              <TouchableOpacity
                style={styles.addMenuItem}
                onPress={() => {
                  setFormInitialGit({ owner: '', repo: '', branch: 'main', path: '', message: '', token: '' });
                  setActiveForm('Git');
                  setShowForm(true);
                  setShowAddMenu(false);
                }}
              >
                <Text style={styles.addMenuText}>Git</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addMenuItem}
                onPress={() => {
                  setActiveForm('Printer');
                  setShowForm(true);
                  setShowAddMenu(false);
                }}
              >
                <Text style={styles.addMenuText}>Bluetooth Printer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addMenuItem}
                onPress={() => {
                  setActiveForm('NetworkPrinter');
                  setShowForm(true);
                  setShowAddMenu(false);
                }}
              >
                <Text style={styles.addMenuText}>Network Printer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tableHead}>
        <Text style={[styles.headCell, { flex: 3 }]}>NAME</Text>
        <Text style={[styles.headCell, { flex: 2 }]}>TYPE</Text>
        <Text style={[styles.headCell, { flex: 2 }]}>STATUS</Text>
        <Text style={[styles.headCell, { width: 64, textAlign: 'center' }]}>ACTIONS</Text>
      </View>
      <FlatList
        data={creds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 3 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.detail}</Text>
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.type}>{item.type}</Text>
            </View>
            <View style={{ flex: 2 }}>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <View style={styles.actionsCol}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditingId(item.id);
                  const stored = gitForms[item.id] || savedGitForms[item.id];
                  if (stored) {
                    setFormInitialGit(stored);
                  } else {
                    setFormInitialGit({ owner: item.name, repo: '', branch: 'main', path: item.detail, message: '', token: '' });
                  }
                  setActiveForm('Git');
                  setShowForm(true);
                }}
              >
                <Icon name="edit" size={18} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  setCreds((prev) => {
                    const next = prev.filter((c) => c.id !== item.id);
                    setGitForms((g) => {
                      const rest = { ...g };
                      delete rest[item.id];
                      persist(next, rest);
                      return rest;
                    });
                    return next;
                  })
                }
              >
                <Icon name="delete-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowForm(false);
          setActiveForm(null);
          setEditingId(null);
        }}
      >
        <View style={styles.formOverlay}>
          {activeForm === 'Git' && (
            <GitConfigForm
              initial={formInitialGit}
              onCancel={() => {
                setShowForm(false);
                setActiveForm(null);
                setEditingId(null);
              }}
              onSave={(vals: GitFormValues) => {
                addOrUpdateCredential({ ...vals, type: 'Git' }, editingId);
              }}
            />
          )}
          {activeForm === 'Printer' && (
            <View style={{ flex: 1, width: '100%', height: '100%' }}>
              <BluetoothPrinterScreen
                onBack={() => {
                  setShowForm(false);
                  setActiveForm(null);
                }}
              />
            </View>
          )}
          {activeForm === 'NetworkPrinter' && (
            <View style={{ flex: 1, width: '100%', height: '100%' }}>
              <NetworkPrinterScreen
                onBack={() => {
                  setShowForm(false);
                  setActiveForm(null);
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f7fb', paddingHorizontal: 12, paddingTop: 24, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  close: { color: '#2563eb', fontWeight: '700' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addWrap: { position: 'relative', zIndex: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#4f46e5', fontWeight: '700' },
  addChevron: { color: '#4f46e5', fontWeight: '700' },
  addMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  addMenuItem: { paddingHorizontal: 12, paddingVertical: 10 },
  addMenuText: { color: '#1f2937', fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d5db',
  },
  headCell: { fontWeight: '700', color: '#6b7280', fontSize: 13 },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  name: { color: '#111827', fontWeight: '700' },
  sub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  type: { color: '#6b21a8', fontWeight: '700' },
  status: { color: '#10b981', fontWeight: '700' },
  actionsCol: { width: 64, alignItems: 'center', gap: 6 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  separator: { height: 12 },
  formOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 16 },
});
