/**
 * licenseKey/app.js
 * Manages license key CRUD via the browserBridge exposed by contentPreload.
 */
(function () {
  const bridge = window.browserBridge;
  if (!bridge) {
    console.error('[LicenseKey] browserBridge not available');
    return;
  }

  const rowsEl = document.getElementById('keyRows');
  const statusEl = document.getElementById('statusMessage');
  const addKeyBtn = document.getElementById('addKeyButton');
  const searchInput = document.getElementById('searchBox');
  const keyModal = document.getElementById('keyModal');
  const keyForm = document.getElementById('keyForm');
  const keyInput = document.getElementById('keyInput');
  const keyError = document.getElementById('keyError');
  const keyModalClose = document.getElementById('keyModalClose');
  const keyCancel = document.getElementById('keyCancel');
  const keyModalTitle = document.getElementById('keyModalTitle');

  var editingId = null;
  var allKeys = [];

  var ICONS = {
    edit: '<path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.17H5v-0.92l9.06-9.06 0.92 0.92L5.92 19.42zM20.71 5.63a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
    delete: '<path fill="currentColor" d="M6 7h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-3h6l1 1h4v2H4V5h4l1-1z"/>'
  };

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    var day = String(d.getDate()).padStart(2, '0');
    var mon = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    var hrs = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return day + '/' + mon + '/' + year + ' ' + hrs + ':' + min;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || '';
  }

  function applyFilter(keys, query) {
    var term = (query || '').trim().toLowerCase();
    if (!term) return keys;
    return keys.filter(function (k) {
      return (k.key || '').toLowerCase().includes(term);
    });
  }

  function renderRows(keys) {
    if (!rowsEl) return;
    rowsEl.innerHTML = '';
    if (!keys || keys.length === 0) {
      setStatus('No license keys to display yet.');
      return;
    }
    setStatus('');

    keys.forEach(function (entry) {
      var tr = document.createElement('tr');

      // Key column
      var keyCell = document.createElement('td');
      keyCell.className = 'key-cell';
      keyCell.textContent = entry.key || '';
      tr.appendChild(keyCell);

      // Date column
      var dateCell = document.createElement('td');
      dateCell.className = 'date-cell';
      dateCell.textContent = formatDate(entry.createdAt);
      tr.appendChild(dateCell);

      // Actions column
      var actionsCell = document.createElement('td');
      actionsCell.className = 'col-actions';
      var actionsWrap = document.createElement('div');
      actionsWrap.className = 'action-pill';

      // Edit button
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn icon-edit';
      editBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.edit + '</svg>';
      editBtn.title = 'Edit key';
      editBtn.addEventListener('click', function () {
        openModal(entry.id, entry.key);
      });
      actionsWrap.appendChild(editBtn);

      // Delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'icon-btn icon-delete';
      deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.delete + '</svg>';
      deleteBtn.title = 'Delete key';
      deleteBtn.addEventListener('click', function () {
        handleDelete(entry);
      });
      actionsWrap.appendChild(deleteBtn);

      actionsCell.appendChild(actionsWrap);
      tr.appendChild(actionsCell);

      rowsEl.appendChild(tr);
    });
  }

  function handleDelete(entry) {
    var label = entry.key || entry.id;
    var modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML =
      '<div class="confirm-card">' +
      '  <div class="confirm-body">' +
      '    <div class="confirm-title">Confirm delete</div>' +
      '    <div class="confirm-text">Delete "' + escapeHtml(label) + '"? This cannot be undone.</div>' +
      '  </div>' +
      '  <div class="confirm-actions">' +
      '    <button type="button" class="btn ghost confirm-cancel">Cancel</button>' +
      '    <button type="button" class="btn primary confirm-ok">Delete</button>' +
      '  </div>' +
      '</div>';

    var cleanup = function (doDelete) {
      modal.remove();
      if (doDelete) {
        bridge.deleteLicenseKey(entry.id).then(function () {
          refresh();
        }).catch(function (err) {
          console.error('[LicenseKey] delete failed', err);
        });
      }
    };

    modal.querySelector('.confirm-cancel').addEventListener('click', function () { cleanup(false); });
    modal.querySelector('.confirm-ok').addEventListener('click', function () { cleanup(true); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cleanup(false);
    });
    document.body.appendChild(modal);
  }

  function openModal(id, keyValue) {
    editingId = id || null;
    if (keyInput) keyInput.value = keyValue || '';
    if (keyError) keyError.textContent = '';
    if (keyModalTitle) keyModalTitle.textContent = id ? 'Edit Key' : 'Add Key';
    if (keyModal) {
      keyModal.classList.add('open');
      keyModal.setAttribute('aria-hidden', 'false');
    }
    if (keyInput) keyInput.focus();
  }

  function closeModal() {
    editingId = null;
    if (keyModal) {
      keyModal.classList.remove('open');
      keyModal.setAttribute('aria-hidden', 'true');
    }
    if (keyInput) keyInput.value = '';
    if (keyError) keyError.textContent = '';
  }

  function refresh() {
    setStatus('Loading...');
    bridge.listLicenseKeys().then(function (keys) {
      allKeys = keys || [];
      var query = searchInput ? searchInput.value : '';
      var filtered = applyFilter(allKeys, query);
      renderRows(filtered);
    }).catch(function (err) {
      console.error('[LicenseKey] Failed to load keys', err);
      setStatus('Unable to load keys.');
    });
  }

  // Event listeners
  addKeyBtn.addEventListener('click', function () {
    openModal(null, '');
  });

  keyModalClose.addEventListener('click', closeModal);
  keyCancel.addEventListener('click', closeModal);
  keyModal.addEventListener('click', function (e) {
    if (e.target === keyModal) closeModal();
  });

  keyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = (keyInput.value || '').trim();
    if (!value) {
      if (keyError) keyError.textContent = 'License key cannot be empty.';
      keyInput.focus();
      return;
    }
    if (keyError) keyError.textContent = '';

    var entry = { key: value };
    if (editingId) entry.id = editingId;

    bridge.saveLicenseKey(entry).then(function () {
      closeModal();
      refresh();
    }).catch(function (err) {
      console.error('[LicenseKey] save failed', err);
      if (keyError) keyError.textContent = 'Failed to save. Please try again.';
    });
  });

  searchInput.addEventListener('input', function () {
    var filtered = applyFilter(allKeys, searchInput.value);
    renderRows(filtered);
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && keyModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Load keys on page open
  refresh();
})();
