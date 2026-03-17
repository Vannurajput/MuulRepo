/**
 * BleTransport.js
 * Sends raw ESC/POS bytes to a BLE thermal printer via GATT characteristic writes.
 *
 * Requires the @anthropic-ai/noble or @abandonware/noble package.
 * Falls back gracefully if BLE is unavailable on the system.
 */
const log = require('../../../../logger');

// Common BLE printer service/characteristic UUIDs
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Another common printer service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART
];

const KNOWN_WRITE_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb', // Common write characteristic
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Another common write char
  '49535343-8841-43f4-a8d4-ecbe34729bb3', // ISSC transparent UART TX
];

let noble = null;

function getNoble() {
  if (noble) return noble;
  try {
    noble = require('@abandonware/noble');
    return noble;
  } catch (_) {}
  try {
    noble = require('noble');
    return noble;
  } catch (_) {}
  return null;
}

class BleTransport {
  /**
   * Scan for nearby BLE printers.
   * @param {number} [timeoutMs=8000] - How long to scan
   * @returns {Promise<Array<{name: string, address: string, uuid: string}>>}
   */
  static async scanDevices(timeoutMs = 8000) {
    const ble = getNoble();
    if (!ble) {
      log.warn('[BleTransport] BLE library not available');
      return [];
    }

    return new Promise((resolve) => {
      const devices = [];
      const seen = new Set();
      let scanTimer = null;

      const finish = () => {
        clearTimeout(scanTimer);
        try { ble.stopScanning(); } catch (_) {}
        ble.removeAllListeners('discover');
        log.info(`[BleTransport] scan complete, found ${devices.length} device(s)`);
        resolve(devices);
      };

      const onDiscover = (peripheral) => {
        const name = peripheral.advertisement?.localName || peripheral.address || '';
        const addr = peripheral.address || peripheral.uuid || '';
        const key = addr.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        // Only include devices that look like printers (have known services or "print" in name)
        const serviceUuids = (peripheral.advertisement?.serviceUuids || []).map(s => s.toLowerCase());
        const isPrinter = KNOWN_PRINTER_SERVICES.some(s => serviceUuids.includes(s)) ||
          /print|pos|receipt|thermal|esc/i.test(name);

        if (isPrinter || !name) {
          devices.push({
            name: name || 'Unknown BLE Device',
            address: addr,
            uuid: peripheral.uuid || addr
          });
        }
      };

      ble.on('discover', onDiscover);
      scanTimer = setTimeout(finish, timeoutMs);

      // Handle BLE state
      if (ble.state === 'poweredOn') {
        ble.startScanning([], false);
      } else {
        const onState = (state) => {
          if (state === 'poweredOn') {
            ble.removeListener('stateChange', onState);
            ble.startScanning([], false);
          } else if (state === 'poweredOff' || state === 'unsupported') {
            ble.removeListener('stateChange', onState);
            finish();
          }
        };
        ble.on('stateChange', onState);

        // If BLE never powers on, timeout will handle it
      }
    });
  }

  /**
   * Send a buffer to a BLE printer.
   * @param {string} deviceAddress - BLE device address or UUID
   * @param {Buffer} buffer - Raw ESC/POS bytes
   * @param {object} [opts]
   * @param {number} [opts.chunkSize=500] - Max bytes per GATT write
   * @param {number} [opts.chunkDelayMs=20] - Delay between chunks
   * @param {number} [opts.timeoutMs=30000] - Overall timeout
   * @returns {Promise<void>}
   */
  static async send(deviceAddress, buffer, opts = {}) {
    const ble = getNoble();
    if (!ble) {
      throw new Error('BLE library not available. Install @abandonware/noble.');
    }

    const chunkSize = opts.chunkSize || 500;
    const chunkDelayMs = opts.chunkDelayMs || 20;
    const timeoutMs = opts.timeoutMs || 30000;
    const targetAddr = String(deviceAddress).toLowerCase();

    log.info(`[BleTransport] connecting to ${targetAddr}, sending ${buffer.length} bytes`);

    return new Promise((resolve, reject) => {
      let settled = false;
      let overallTimer = null;
      let peripheral = null;

      const settle = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(overallTimer);
        try { ble.stopScanning(); } catch (_) {}
        fn(value);
      };

      overallTimer = setTimeout(() => {
        settle(reject, new Error(`[BleTransport] send timed out after ${timeoutMs}ms`));
        try { if (peripheral) peripheral.disconnect(); } catch (_) {}
      }, timeoutMs);

      const onDiscover = async (p) => {
        const addr = (p.address || p.uuid || '').toLowerCase();
        if (addr !== targetAddr && (p.uuid || '').toLowerCase() !== targetAddr) return;

        peripheral = p;
        ble.stopScanning();
        ble.removeListener('discover', onDiscover);

        try {
          // Connect
          await new Promise((res, rej) => {
            p.connect((err) => err ? rej(err) : res());
          });

          log.info(`[BleTransport] connected to ${addr}`);

          // Discover services and characteristics
          const { characteristics } = await new Promise((res, rej) => {
            p.discoverSomeServicesAndCharacteristics(
              KNOWN_PRINTER_SERVICES,
              KNOWN_WRITE_CHARACTERISTICS,
              (err, services, chars) => {
                if (err) return rej(err);
                res({ services, characteristics: chars || [] });
              }
            );
          });

          // Find a writable characteristic
          let writeChar = characteristics.find(c => {
            const props = c.properties || [];
            return props.includes('write') || props.includes('writeWithoutResponse');
          });

          // If no match from known UUIDs, try discovering all
          if (!writeChar) {
            const allResult = await new Promise((res, rej) => {
              p.discoverAllServicesAndCharacteristics((err, services, chars) => {
                if (err) return rej(err);
                res({ services, characteristics: chars || [] });
              });
            });
            writeChar = allResult.characteristics.find(c => {
              const props = c.properties || [];
              return props.includes('write') || props.includes('writeWithoutResponse');
            });
          }

          if (!writeChar) {
            throw new Error('No writable GATT characteristic found on device');
          }

          const useWithoutResponse = writeChar.properties.includes('writeWithoutResponse');
          log.info(`[BleTransport] using characteristic ${writeChar.uuid}, withoutResponse=${useWithoutResponse}`);

          // Send in chunks
          for (let offset = 0; offset < buffer.length; offset += chunkSize) {
            const chunk = buffer.slice(offset, Math.min(offset + chunkSize, buffer.length));
            await new Promise((res, rej) => {
              writeChar.write(chunk, useWithoutResponse, (err) => {
                if (err) return rej(err);
                res();
              });
            });
            if (chunkDelayMs > 0 && offset + chunkSize < buffer.length) {
              await new Promise((r) => setTimeout(r, chunkDelayMs));
            }
          }

          log.info(`[BleTransport] sent ${buffer.length} bytes in ${Math.ceil(buffer.length / chunkSize)} chunks`);

          // Disconnect
          try { p.disconnect(); } catch (_) {}
          settle(resolve);

        } catch (err) {
          try { p.disconnect(); } catch (_) {}
          settle(reject, err);
        }
      };

      ble.on('discover', onDiscover);

      // Start scanning
      if (ble.state === 'poweredOn') {
        ble.startScanning([], false);
      } else {
        const onState = (state) => {
          if (state === 'poweredOn') {
            ble.removeListener('stateChange', onState);
            ble.startScanning([], false);
          } else if (state === 'poweredOff' || state === 'unsupported') {
            ble.removeListener('stateChange', onState);
            settle(reject, new Error('BLE is not available on this system'));
          }
        };
        ble.on('stateChange', onState);
      }
    });
  }
}

module.exports = BleTransport;
