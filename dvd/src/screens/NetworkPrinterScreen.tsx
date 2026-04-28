import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { networkPrinterService } from '../services/printer/networkPrinterService';

type Props = { onBack: () => void };

export const NetworkPrinterScreen: React.FC<Props> = ({ onBack }) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9100');
  const [connecting, setConnecting] = useState(false);
  const [savedLabel, setSavedLabel] = useState('');
  const [connectedLabel, setConnectedLabel] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    networkPrinterService
      .getSaved()
      .then((saved) => {
        if (saved?.ip) {
          setIp(saved.ip);
          setPort(String(saved.port || 9100));
          setSavedLabel(`Saved: ${saved.ip}:${saved.port || 9100}`);
          setConnectedLabel(`Connected: ${saved.ip}:${saved.port || 9100}`);
          setIsConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      await networkPrinterService.init();
      await networkPrinterService.connect(ip.trim(), Number(port) || 9100);
      setSavedLabel(`Saved: ${ip.trim()}:${Number(port) || 9100}`);
      setConnectedLabel(`Connected: ${ip.trim()}:${Number(port) || 9100}`);
      setIsConnected(true);
      Alert.alert('Connected', `Printer at ${ip}:${port} is ready`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setConnecting(true);
    try {
      await networkPrinterService.disconnect();
      setConnectedLabel('');
      setIsConnected(false);
      Alert.alert('Disconnected', 'Network printer connection closed');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to disconnect');
    } finally {
      setConnecting(false);
    }
  };

  const test = async () => {
    setConnecting(true);
    try {
      await networkPrinterService.printTest();
      Alert.alert('Printed', 'Test receipt sent');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to print');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Network Printer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>IP Address</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.77"
          value={ip}
          onChangeText={setIp}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          placeholder="9100"
          value={port}
          onChangeText={setPort}
          keyboardType="numeric"
        />

        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={connect} disabled={connecting}>
          <Text style={styles.btnText}>{connecting ? 'Working...' : isConnected ? 'Reconnect' : 'Connect'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={disconnect} disabled={connecting || !isConnected}>
          <Text style={[styles.btnText, { color: '#111827' }]}>Disconnect</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={test} disabled={connecting}>
          <Text style={[styles.btnText, { color: '#111827' }]}>Test Print</Text>
        </TouchableOpacity>

        {connecting && <ActivityIndicator size="small" color="#4f46e5" style={{ marginTop: 10 }} />}
        {savedLabel ? <Text style={styles.saved}>{savedLabel}</Text> : null}
        {connectedLabel ? <Text style={styles.connected}>{connectedLabel}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
  form: { gap: 10 },
  label: { fontWeight: '700', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  btn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  primary: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  secondary: { backgroundColor: '#e5e7eb' },
  btnText: { fontWeight: '800', color: '#fff' },
  saved: { marginTop: 8, color: '#6b7280', fontWeight: '600' },
  connected: { marginTop: 4, color: '#10b981', fontWeight: '700' },
});
