const { Client } = require('pg');
const { buildTlsOptions, prepareHostPort, preparePassword } = require('./helpers/connectionOptions');

const parsePort = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

class PostgresQueryConnector {
  async execute({ sql, params = [], credentials = {} } = {}) {
    const { host, port, cleanup } = await prepareHostPort(credentials);
    const sslConfig = credentials.iam?.enabled
      ? { enabled: true, ...(credentials.ssl || {}) }
      : credentials.ssl;
    const ssl = buildTlsOptions(sslConfig);
    const password = await preparePassword({
      ...credentials,
      host: credentials.iam?.host || credentials.host,
      port: credentials.iam?.port || credentials.port
    });

    const client = new Client({
      host,
      port: parsePort(port, 5432),
      user: credentials.user,
      password,
      database: credentials.database,
      connectionTimeoutMillis: 8000,
      ssl
    });

    await client.connect();
    try {
      const fmtMsg = (n) => `(${n} row${n === 1 ? '' : 's'} affected)`;
      const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);
      if (statements.length > 1 && params.length === 0) {
        const results = [];
        for (const stmt of statements) {
          try {
            const result = await client.query(stmt);
            const rows = result?.rows || [];
            const count = Number.isFinite(result?.rowCount) ? result.rowCount : rows.length;
            results.push({ query: stmt, rowCount: rows.length, rows, message: fmtMsg(count) });
          } catch (stmtErr) {
            results.push({ query: stmt, rowCount: 0, rows: [], error: stmtErr?.message || 'Statement failed' });
          }
        }
        const hasError = results.some((r) => r.error);
        return { ok: !hasError, results };
      }
      const result = await client.query({ text: sql, values: params });
      const rows = result?.rows || [];
      const rowCount = Number.isFinite(result?.rowCount) ? result.rowCount : rows.length;
      return { ok: true, rowCount, rows, message: fmtMsg(rowCount) };
    } finally {
      await client.end().catch(() => {});
      await cleanup().catch?.(() => {});
    }
  }
}

module.exports = PostgresQueryConnector;

