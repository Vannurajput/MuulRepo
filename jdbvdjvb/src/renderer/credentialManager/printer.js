(() => {
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get('embed') === '1';
  const hasNativeBridge = !!window.credentialBridge?.savePrinterEntry;

  if (isEmbed) {
    document.documentElement.classList.add('embed');
    document.body.classList.add('embed');
  }

  let embedRequestId = 0;
  const embedPending = new Map();

  const postToParent = (method, payload) => {
    if (!window.parent || window.parent === window) {
      return Promise.reject(new Error('Credential bridge missing'));
    }
    const id = ++embedRequestId;
    return new Promise((resolve, reject) => {
      embedPending.set(id, { resolve, reject });
      window.parent.postMessage({ __from: 'embed-tab', id, method, payload }, '*');
      setTimeout(() => {
        if (embedPending.has(id)) {
          embedPending.delete(id);
          reject(new Error('Credential bridge request timed out'));
        }
      }, 15000);
    });
  };

  window.addEventListener('message', (event) => {
    const msg = event?.data;
    if (!msg || msg.__from !== 'embed-shell') return;
    const pending = embedPending.get(msg.id);
    if (!pending) return;
    embedPending.delete(msg.id);
    if (msg.error) {
      pending.reject(new Error(msg.error));
    } else {
      pending.resolve(msg.result);
    }
  });

  const bridge = hasNativeBridge
    ? window.credentialBridge
    : {
      getEntry: (type, id) => postToParent('credentialsGetEntry', { type, id }),
      savePrinterEntry: (payload) => postToParent('printerSave', payload),
      testPrinterConnection: (payload) => postToParent('printerTest', payload),
      close: () => postToParent('credentialsClose')
    };
  const form = document.getElementById('printerForm');
  const cancelBtn = document.getElementById('cancelPrinter');
  const statusLabel = document.getElementById('connectedStatus');
  const testBtn = document.getElementById('testPrinter');

  let activeEntryId = params.get('entryId') || null;

  const printerNameInput = document.getElementById('printerName');
  const printerTypeInput = document.getElementById('printerType');
  const printerModelInput = document.getElementById('printerModel');
  const companyInput = document.getElementById('companyName');
  const printerPortInput = document.getElementById('printerPort');
  const printerPortRow = document.getElementById('printerPortRow');
  const printModeInput = document.getElementById('printMode');
  const usbDeviceRow = document.getElementById('usbDeviceRow');
  const usbDeviceSelect = document.getElementById('usbDevice');
  const scanUsbBtn = document.getElementById('scanUsb');
  const requestResize = () => {
    if (!isEmbed || !window.parent || window.parent === window) return;
    window.parent.postMessage({ __from: 'embed-embed', type: 'resize' }, '*');
  };

  const setStatus = (text, variant = 'neutral') => {
    if (!statusLabel) return;
    statusLabel.textContent = text || '';
    statusLabel.classList.toggle('success', variant === 'success');
    statusLabel.classList.toggle('error', variant === 'error');
    requestAnimationFrame(requestResize);
  };

  const isIpAddress = (value = '') => /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());

  const shouldShowPort = () => printerTypeInput.value === 'network';

  const printerNameLabel = document.getElementById('printerNameLabel');

  const isUsb = () => printerTypeInput.value === 'usb';
  const scanUsbDevices = async (preselectValue) => {
    if (!usbDeviceSelect) return;
    // Remember current selection if no preselect provided
    const restoreValue = preselectValue || usbDeviceSelect.value || '';
    console.log('[PrinterConfig] Scan button clicked — starting printer scan...');
    usbDeviceSelect.innerHTML = '<option value="">Scanning...</option>';
    try {
      console.log('[PrinterConfig] Calling bridge method:', hasNativeBridge ? 'listUsbPrinters' : 'postToParent(printerListUsb)');
      const result = hasNativeBridge
        ? await window.credentialBridge.listUsbPrinters()
        : await postToParent('printerListUsb');

      console.log('[PrinterConfig] Raw result from bridge:', result);

      // Handle both formats: plain array (legacy) or { devices, diagnostics }
      const devices = Array.isArray(result) ? result : (result?.devices || []);
      const diagnostics = result?.diagnostics || [];

      if (diagnostics.length) {
        console.log('[PrinterConfig] Scan diagnostics:');
        diagnostics.forEach((d) => console.log('  ', d));
      }

      console.log(`[PrinterConfig] Found ${devices.length} printer(s):`);
      devices.forEach((d, i) => {
        console.log(`  [${i}] name=${d.printerName} port=${d.portName} driver=${d.driverName} label=${d.label}`);
      });

      usbDeviceSelect.innerHTML = '<option value="">Select printer</option>';
      if (Array.isArray(devices) && devices.length) {
        devices.forEach((d) => {
          const opt = document.createElement('option');
          opt.value = d.printerName || d.vendorId || '';
          opt.textContent = d.label || d.printerName || 'Unknown';
          if (d.portName) opt.dataset.port = d.portName;
          if (d.driverName) opt.dataset.driver = d.driverName;
          if (d.printerName) opt.dataset.name = d.printerName;
          usbDeviceSelect.appendChild(opt);
        });
        // Restore previously selected value
        if (restoreValue) {
          const exists = Array.from(usbDeviceSelect.options).some((o) => o.value === restoreValue);
          if (exists) usbDeviceSelect.value = restoreValue;
        }
      } else {
        console.log('[PrinterConfig] No printers found in scan result');
        usbDeviceSelect.innerHTML = '<option value="">No printers found</option>';
      }
    } catch (err) {
      console.error('[PrinterConfig] Scan failed:', err);
      usbDeviceSelect.innerHTML = '<option value="">Scan failed</option>';
    }
  };

  scanUsbBtn?.addEventListener('click', scanUsbDevices);

  // Auto-fill form fields when a printer is selected from USB Device dropdown
  usbDeviceSelect?.addEventListener('change', () => {
    if (!isUsb() || !usbDeviceSelect.value) return;
    const selected = usbDeviceSelect.options[usbDeviceSelect.selectedIndex];
    const name = selected?.dataset?.name || usbDeviceSelect.value;
    const driver = selected?.dataset?.driver || '';

    if (printerNameInput) printerNameInput.value = name;
    if (printerModelInput) printerModelInput.value = driver;
    // Extract company from printer name (first word, e.g. "EPSON TM-m30" → "EPSON")
    if (companyInput) {
      const firstWord = name.split(/\s+/)[0] || '';
      companyInput.value = firstWord;
    }
  });

  const updatePortVisibility = () => {
    const isNetwork = shouldShowPort();
    const isUsbType = isUsb();
    printerPortRow?.classList.toggle('visible', isNetwork);
    usbDeviceRow?.classList.toggle('visible', isUsbType);
    if (printerPortInput) {
      printerPortInput.required = isNetwork;
      printerPortInput.disabled = isUsbType;
      if (!isNetwork && !isUsbType) {
        printerPortInput.value = '';
      } else if (isNetwork && !printerPortInput.value) {
        printerPortInput.value = '9100';
      }
    }
    if (printerNameLabel) {
      printerNameLabel.textContent = isNetwork ? 'Printer IP' : 'Printer name';
    }
    if (printerNameInput) {
      printerNameInput.placeholder = isNetwork ? 'e.g. 192.168.1.100' : 'e.g. Front Desk';
      printerNameInput.disabled = isUsbType;
    }
    if (printerModelInput) {
      printerModelInput.disabled = isUsbType;
    }
    if (companyInput) {
      companyInput.disabled = isUsbType;
    }
    if (isUsbType) {
      scanUsbDevices(printerNameInput?.value || '');
    }
    requestAnimationFrame(requestResize);
  };

  const fillForm = (entry = {}) => {
    printerNameInput.value = entry.printerName || entry.deviceName || entry.label || entry.name || '';
    printerTypeInput.value = entry.printerType || '';
    printerModelInput.value = entry.printerModel || '';
    companyInput.value = entry.companyName || '';
    // [ADDED: Print Mode]
    if (printModeInput) {
      printModeInput.value = entry.printMode || 'graphic';
    }
    if (printerPortInput) {
      printerPortInput.value = entry.printerPort || entry.port || '';
    }
    if (usbDeviceSelect && entry.printerType === 'usb' && entry.printerName) {
      const savedName = entry.printerName;
      const exists = Array.from(usbDeviceSelect.options).some((o) => o.value === savedName);
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = savedName;
        opt.textContent = entry.usbDeviceLabel || savedName;
        usbDeviceSelect.appendChild(opt);
      }
      usbDeviceSelect.value = savedName;
    }
    updatePortVisibility();
    if (entry.id && entry.printerName) {
      // Real connectivity check
      setStatus('Checking printer...', 'neutral');
      checkPrinterStatus(entry.printerName);
    } else if (entry.id) {
      setStatus('Saved (no printer name)', 'neutral');
    } else {
      setStatus('New printer', 'neutral');
    }
  };

  const checkPrinterStatus = async (printerName) => {
    try {
      const result = hasNativeBridge
        ? await window.credentialBridge.getEntry?.('printer-status', printerName)
        : await postToParent('printerCheckStatus', printerName);
      console.log('[PrinterConfig] Status check result:', result);
      if (result?.online) {
        setStatus(result.status || 'Printer connected', 'success');
      } else {
        setStatus(result?.status || 'Printer offline', 'error');
      }
    } catch (err) {
      console.error('[PrinterConfig] Status check failed:', err);
      setStatus('Status check failed', 'error');
    }
  };

  const collectFormPayload = () => {
    const payload = {
      id: activeEntryId || undefined,
      printerName: printerNameInput.value.trim(),
      printerType: printerTypeInput.value,
      printerPort: printerPortInput?.value.trim(),
      printerModel: printerModelInput.value.trim(),
      companyName: companyInput.value.trim(),
      printMode: printModeInput ? printModeInput.value : 'graphic'
    };
    if (isUsb() && usbDeviceSelect?.value) {
      const selected = usbDeviceSelect.options[usbDeviceSelect.selectedIndex];
      payload.printerName = usbDeviceSelect.value;
      payload.deviceName = usbDeviceSelect.value;
      payload.usbDeviceLabel = selected?.textContent || '';
      if (selected?.dataset?.port) {
        payload.printerPort = selected.dataset.port;
      }
    }
    return payload;
  };

  const loadExisting = async () => {
    if (!activeEntryId) {
      fillForm({});
      requestAnimationFrame(requestResize);
      return;
    }
    try {
      const entry = await bridge?.getEntry?.('printer', activeEntryId);
      if (entry) {
        fillForm(entry);
      } else {
        fillForm({});
      }
    } catch (error) {
      console.error('[PrinterConfig] failed to load printer entry', error);
      fillForm({});
    } finally {
      requestAnimationFrame(requestResize);
    }
  };

  cancelBtn?.addEventListener('click', () => {
    if (isEmbed) {
      bridge?.close?.();
    } else {
      window.close?.();
    }
  });

  testBtn?.addEventListener('click', async () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (typeof bridge?.testPrinterConnection !== 'function') {
      setStatus('Test unavailable.', 'error');
      return;
    }
    const payload = collectFormPayload();
    try {
      const result = await bridge.testPrinterConnection(payload);
      if (result?.ok) {
        setStatus('Printer test sent successfully.', 'success');
      } else {
        setStatus(result?.error || 'Printer test failed.', 'error');
      }
    } catch (error) {
      console.error('[PrinterConfig] printer test failed', error);
      setStatus('Unable to run printer test.', 'error');
    }
  });

  printerTypeInput?.addEventListener('change', updatePortVisibility);

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload = collectFormPayload();
    console.log('[PrinterConfig] submit payload', payload);
    try {
      setStatus('Saving...', 'neutral');
      const saved = await bridge?.savePrinterEntry?.(payload);
      console.log('[PrinterConfig] save result', saved);
      activeEntryId = saved?.id || activeEntryId;
      await loadExisting();
      setStatus('Saved successfully', 'success');
    } catch (error) {
      console.error('[PrinterConfig] save failed', error);
      setStatus('Unable to save printer configuration.', 'error');
    }
  });

  loadExisting();
})();
