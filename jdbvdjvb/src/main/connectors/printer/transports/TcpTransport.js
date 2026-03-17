/**
 * TcpTransport.js
 * Sends raw bytes to a network thermal printer via TCP (typically port 9100).
 * Extracted from PrintConnector.js.
 */
const net = require('net');
const log = require('../../../../logger');

class TcpTransport {
  /**
   * Send a buffer to a network printer.
   * @param {string} host - Printer IP address
   * @param {number} port - Printer port (default 9100)
   * @param {Buffer} buffer - Raw bytes to send
   * @returns {Promise<void>}
   */
  static send(host, port, buffer) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let completed = false;
      const done = (error) => {
        if (completed) return;
        completed = true;
        socket.destroy();
        if (error) {
          log.error('[TcpTransport] send failed', error);
          reject(error);
        } else {
          log.info('[TcpTransport] send complete', { host, port });
          resolve();
        }
      };
      socket.setTimeout(8000, () => done(new Error('Network printer timeout')));
      socket.on('error', done);
      socket.connect(Number(port) || 9100, host, () => {
        const payload = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(buffer || ''), 'utf8');
        socket.write(payload, () => {
          socket.end();
        });
      });
      socket.on('close', () => done());
    });
  }
}

module.exports = TcpTransport;
