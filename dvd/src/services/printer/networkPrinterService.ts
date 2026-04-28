import { NetPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { receiptFormatter } from './receiptFormatter';

const NET_PRINTER_KEY = 'muul_last_net_printer';

class NetworkPrinterService {
  private current: { ip: string; port: number } | null = null;

  async init() {
    try {
      await NetPrinter.init();
      console.log('[NetworkPrinterService] Initialized');
    } catch (err) {
      console.warn('[NetworkPrinterService] init failed', err);
      throw err;
    }
  }

  async connect(ip: string, port: number) {
    if (!ip) throw new Error('IP required');
    if (!port) throw new Error('Port required');
    try {
      await NetPrinter.connectPrinter(ip, port);
      this.current = { ip, port };
      await AsyncStorage.setItem(NET_PRINTER_KEY, JSON.stringify({ ip, port }));
      console.log('[NetworkPrinterService] Connected to', ip, port);
    } catch (err) {
      console.warn('[NetworkPrinterService] connect failed', err);
      throw err;
    }
  }

  async printTest() {
    if (!this.current) throw new Error('No printer connected');
    try {
      await NetPrinter.printText('<C><b>TEST PRINT</b></C>\n');
      await NetPrinter.printText('<C>Network printer OK</C>\n');
      // feed a few lines then send ESC/POS partial cut
      await NetPrinter.printText('\n\n\n\n\n');
      await NetPrinter.printText('\x1d\x56\x42\x00');
      console.log('[NetworkPrinterService] Test print sent');
    } catch (err) {
      console.warn('[NetworkPrinterService] test print failed', err);
      throw err;
    }
  }

  async printDynamic(payload: any) {
    if (!this.current) throw new Error('No printer connected');
    await receiptFormatter.formatAndPrint(payload, NetPrinter);
    await receiptFormatter.feedAndCut(NetPrinter);
  }

  isConnected() {
    return !!this.current;
  }

  getCurrent() {
    return this.current;
  }

  async disconnect() {
    try {
      await NetPrinter.closeConn();
      this.current = null;
      await AsyncStorage.removeItem(NET_PRINTER_KEY);
      console.log('[NetworkPrinterService] Disconnected');
    } catch (err) {
      console.warn('[NetworkPrinterService] disconnect failed', err);
      throw err;
    }
  }

  async getSaved(): Promise<{ ip: string; port: number } | null> {
    try {
      const raw = await AsyncStorage.getItem(NET_PRINTER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const saved = parsed?.ip && parsed?.port ? { ip: parsed.ip, port: Number(parsed.port) } : null;
      if (saved) console.log('[NetworkPrinterService] Loaded saved printer', saved.ip, saved.port);
      return saved;
    } catch {
      return null;
    }
  }
}

export const networkPrinterService = new NetworkPrinterService();
