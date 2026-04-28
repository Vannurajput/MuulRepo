import { BLEPrinter, IBLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { receiptFormatter } from './receiptFormatter';

const PRINTER_STORAGE_KEY = 'muul_last_printer_mac';

class PrinterService {
    private connectedPrinter: IBLEPrinter | null = null;

    async init() {
        try {
            await BLEPrinter.init();
            console.log('[PrinterService] Initialized');
        } catch (error) {
            console.error('[PrinterService] Init Error:', error);
            throw error;
        }
    }

    async getPrinters(): Promise<IBLEPrinter[]> {
        try {
            const devices = await BLEPrinter.getDeviceList();
            console.log('[PrinterService] Discovered printers', devices.length);
            return devices;
        } catch (error) {
            console.error('[PrinterService] Discovery Error:', error);
            return [];
        }
    }

    async connect(mac: string): Promise<IBLEPrinter> {
        try {
            const printer = await BLEPrinter.connectPrinter(mac);
            this.connectedPrinter = printer;
            await AsyncStorage.setItem(PRINTER_STORAGE_KEY, mac);
            console.log('[PrinterService] Connected to:', mac);
            return printer;
        } catch (error) {
            console.error('[PrinterService] Connection Error:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.connectedPrinter) {
                await BLEPrinter.closeConn();
            }
            this.connectedPrinter = null;
            await AsyncStorage.removeItem(PRINTER_STORAGE_KEY);
            console.log('[PrinterService] Disconnected');
        } catch (error) {
            console.error('[PrinterService] Disconnect Error:', error);
            throw error;
        }
    }

    async printTest() {
        if (!this.connectedPrinter) throw new Error('No printer connected');
        await receiptFormatter.printMinimalTest();
        await receiptFormatter.feedAndCut();
    }

    async printDynamic(payload: any) {
        if (!this.connectedPrinter) throw new Error('No printer connected');
        await receiptFormatter.formatAndPrint(payload, BLEPrinter);
        await receiptFormatter.feedAndCut(BLEPrinter);
    }

    async getSavedPrinterMac(): Promise<string | null> {
        return await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
    }
}

export const printerService = new PrinterService();
