// Normalize a printer name for comparison
function normalizeName(name) {
  return (name || '').trim().toLowerCase();
}

function getConfigNames(config = {}) {
  const names = [
    config.printerName,
    config.deviceName,
    config.label
  ]
    .map(normalizeName)
    .filter(Boolean);
  return Array.from(new Set(names));
}

function collectPrinterNamesFromPayload(payload = {}) {
  const names = new Set();
  const push = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach((n) => {
        const nn = normalizeName(n);
        if (nn) names.add(nn);
      });
    }
  };

  const blocks = Array.isArray(payload.data) ? payload.data : [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'item' && block.data && Array.isArray(block.data.itemdata)) {
      for (const item of block.data.itemdata) {
        if (!item || typeof item !== 'object') continue;
        push(item.printer_name);
        if (Array.isArray(item.items)) {
          for (const sub of item.items) {
            push(sub && sub.printer_name);
          }
        }
      }
    }
  }

  return names;
}

function itemMatchesPrinter(item = {}, targetName) {
  const names = Array.isArray(item.printer_name) ? item.printer_name : item.printer_name ? [item.printer_name] : [];
  return names.some((n) => normalizeName(n) === targetName);
}

function filterItemsForPrinter(items = [], targetName) {
  const filtered = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const subItems = Array.isArray(item.items) ? item.items : [];

    const keptSubItems = subItems
      .map((sub) => {
        if (!sub || typeof sub !== 'object') return null;
        return itemMatchesPrinter(sub, targetName) ? { ...sub } : null;
      })
      .filter(Boolean);

    const matchesSelf = itemMatchesPrinter(item, targetName);
    if (!matchesSelf && keptSubItems.length === 0) continue;

    const cloned = { ...item };
    if (keptSubItems.length || Array.isArray(item.items)) {
      cloned.items = keptSubItems;
    }
    filtered.push(cloned);
  }
  return filtered;
}

function buildFilteredPayload(payload = {}, targetName) {
  const normalized = normalizeName(targetName);
  if (!normalized) return null;

  const dataBlocks = Array.isArray(payload.data) ? payload.data : [];
  const filteredBlocks = [];

  for (const block of dataBlocks) {
    if (!block || typeof block !== 'object') continue;
    if (block.type !== 'item') {
      filteredBlocks.push(block);
      continue;
    }

    const items = (block.data && Array.isArray(block.data.itemdata)) ? block.data.itemdata : [];
    const kept = filterItemsForPrinter(items, normalized);
    if (!kept.length) continue;

    const clonedBlock = { ...block, data: { ...(block.data || {}) } };
    clonedBlock.data.itemdata = kept;
    filteredBlocks.push(clonedBlock);
  }

  if (!filteredBlocks.length) return null;

  return {
    ...payload,
    printer_name: [targetName],
    data: filteredBlocks
  };
}

function buildPrinterJobs({ payload = {}, primaryConfig, printerConfigs = [] }) {
  const jobs = [];
  if (!primaryConfig) return jobs;

  const primaryNames = getConfigNames(primaryConfig);
  const primaryName = primaryNames[0] || null;
  const primaryPayload = {
    ...payload,
    ...(primaryName ? { printer_name: [primaryName] } : {})
  };
  jobs.push({ config: primaryConfig, payload: primaryPayload, targetName: primaryName, fullReceipt: true });

  const namesInPayload = collectPrinterNamesFromPayload(payload);
  const seenConfigIds = new Set();
  for (const config of printerConfigs) {
    const configNames = getConfigNames(config);
    const matchName = configNames.find((n) => namesInPayload.has(n));
    if (!matchName) continue;

    // Avoid duplicate kitchen jobs for the same config (but allow primary printer)
    const configKey = configNames.sort().join('|');
    if (seenConfigIds.has(configKey)) continue;
    seenConfigIds.add(configKey);

    const filteredPayload = buildFilteredPayload(payload, matchName);
    if (!filteredPayload) continue;

    jobs.push({ config, payload: filteredPayload, targetName: matchName, fullReceipt: false });
  }

  return jobs;
}

module.exports = {
  buildPrinterJobs,
  collectPrinterNamesFromPayload,
  buildFilteredPayload,
  getConfigNames
};
