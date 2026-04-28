import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { printerService } from '../services/printer/printerService';
import { IBLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
    onBack: () => void;
};

export const BluetoothPrinterScreen: React.FC<Props> = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const [printers, setPrinters] = useState<IBLEPrinter[]>([]);
    const [connectedMac, setConnectedMac] = useState<string | null>(null);

    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                ]);
            } else {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            }
        }
    };

    const loadPrinters = useCallback(async () => {
        setLoading(true);
        try {
            await requestPermissions();
            await printerService.init();
            const list = await printerService.getPrinters();
            setPrinters(list);
        } catch {
            Alert.alert('Error', 'Failed to load printers');
        } finally {
            setLoading(false);
        }
    }, []);

    const togglePrinter = async (mac: string) => {
        setLoading(true);
        try {
            if (connectedMac === mac) {
                await printerService.disconnect();
                setConnectedMac(null);
                Alert.alert('Disconnected', 'Printer connection closed');
            } else {
                await printerService.connect(mac);
                setConnectedMac(mac);
                Alert.alert('Connected', 'Printer is ready');
            }
        } catch {
            Alert.alert('Error', 'Failed to change connection');
        } finally {
            setLoading(false);
        }
    };

    const handleTestPrint = async () => {
        try {
            await printerService.printTest();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    useEffect(() => {
        const autoReconnect = async () => {
            const savedMac = await printerService.getSavedPrinterMac();
            if (savedMac) {
                setConnectedMac(savedMac);
                // Optionally try to connect automatically
                // connectToPrinter(savedMac);
            }
            loadPrinters();
        };
        autoReconnect();
    }, [loadPrinters]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Icon name="arrow-back" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Bluetooth Printer</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.statusBox}>
                <Text style={styles.statusText}>
                    Status: {connectedMac ? <Text style={{ color: '#10b981' }}>Connected ({connectedMac})</Text> : 'Not Connected'}
                </Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, !connectedMac && styles.btnDisabled]}
                    onPress={handleTestPrint}
                    disabled={!connectedMac}
                >
                    <Text style={styles.btnText}>Print Test Receipt</Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="#4f46e5" style={{ marginVertical: 10 }} />}

            <Text style={styles.sectionTitle}>Available Printers</Text>
            <FlatList
                data={printers}
                keyExtractor={(item) => item.inner_mac_address}
                renderItem={({ item }) => (
                    <View style={styles.printerRow}>
                        <View>
                            <Text style={styles.printerName}>{item.device_name || 'Unknown Printer'}</Text>
                            <Text style={styles.printerMac}>{item.inner_mac_address}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.connectBtn, connectedMac === item.inner_mac_address && { backgroundColor: '#10b981' }]}
                            onPress={() => togglePrinter(item.inner_mac_address)}
                        >
                            <Text style={styles.connectBtnText}>
                                {connectedMac === item.inner_mac_address ? 'Disconnect' : 'Connect'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>No printers found. Make sure Bluetooth is on.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f6f7fb', padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
    statusBox: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 16, elevation: 2 },
    statusText: { fontWeight: '600', color: '#4b5563' },
    actions: { gap: 10, marginBottom: 20 },
    btn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center' },
    btnPrimary: { backgroundColor: '#4f46e5' },
    btnDisabled: { backgroundColor: '#9ca3af' },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
    printerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8, elevation: 1 },
    printerName: { fontWeight: '700', color: '#111827' },
    printerMac: { color: '#6b7280', fontSize: 12 },
    connectBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
    connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40 },
});
