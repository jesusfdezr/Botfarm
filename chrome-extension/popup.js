// BotFarm Reporter - Popup Script
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scanBtn');
  const refreshStatsBtn = document.getElementById('refreshStatsBtn');
  const autoAddToggle = document.getElementById('autoAddToggle');
  const accountsContainer = document.getElementById('accountsContainer');
  
  // Load settings
  chrome.storage.local.get(['autoAddButtons'], (result) => {
    if (result.autoAddButtons !== false) {
      autoAddToggle.classList.add('active');
    }
  });

  // Toggle auto-add buttons
  autoAddToggle.addEventListener('click', () => {
    const isActive = autoAddToggle.classList.toggle('active');
    chrome.storage.local.set({ autoAddButtons: isActive });
  });

  // Scan notifications
  scanBtn.addEventListener('click', async () => {
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<div class="spinner"></div> Escaneando...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
        accountsContainer.innerHTML = `
          <div class="empty-state" style="color: #ff9100;">
            ⚠️ Debes estar en twitter.com o x.com<br>
            Navega a tus notificaciones y vuelve a intentar.
          </div>
        `;
        scanBtn.disabled = false;
        scanBtn.innerHTML = '🔍 Escanear notificaciones';
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'scan' }, (response) => {
        if (chrome.runtime.lastError) {
          accountsContainer.innerHTML = `
            <div class="empty-state" style="color: #ff9100;">
              ❌ Error al conectar con la página.<br>
              Recarga la página de notificaciones e intenta de nuevo.
            </div>
          `;
          scanBtn.disabled = false;
          scanBtn.innerHTML = '🔍 Escanear notificaciones';
          return;
        }

        displayAccounts(response.accounts || []);
        updateStats();
        scanBtn.disabled = false;
        scanBtn.innerHTML = '🔍 Escanear notificaciones';
      });
    } catch (error) {
      console.error('[BotFarm] Error:', error);
      scanBtn.disabled = false;
      scanBtn.innerHTML = '🔍 Escanear notificaciones';
    }
  });

  // Refresh stats
  refreshStatsBtn.addEventListener('click', () => {
    updateStats();
  });

  // Display accounts
  function displayAccounts(accounts) {
    if (accounts.length === 0) {
      accountsContainer.innerHTML = `
        <div class="empty-state">
          ✅ No se encontraron spam bots<br>
          ¡Tus notificaciones están limpias!
        </div>
      `;
      return;
    }

    accountsContainer.innerHTML = accounts.map((account, index) => `
      <div class="account-item" data-index="${index}">
        <div class="avatar">
          ${account.isDefaultAvatar ? '👤' : '<img src="' + account.avatarUrl + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">'}
        </div>
        <div class="info">
          <div class="username">@${account.username}</div>
          <div class="display-name">${account.displayName}</div>
          <div class="spam-score">🚩 Spam Score: ${account.spamScore}/5</div>
        </div>
        <div class="actions">
          <button class="report" onclick="reportAccount(${index})">🚩</button>
          <button class="block" onclick="blockAccount(${index})">🚫</button>
        </div>
      </div>
    `).join('');

    // Store accounts for actions
    window.scannedAccounts = accounts;
  }

  // Update stats
  function updateStats() {
    chrome.storage.local.get(['stats'], (result) => {
      const stats = result.stats || { scanned: 0, reported: 0, blocked: 0 };
      document.getElementById('scanned-count').textContent = stats.scanned;
      document.getElementById('reported-count').textContent = stats.reported;
      document.getElementById('blocked-count').textContent = stats.blocked;
    });
  }

  // Initial stats load
  updateStats();
});

// Global functions for inline onclick handlers
window.reportAccount = async (index) => {
  const account = window.scannedAccounts[index];
  if (!account) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'report', account }, (response) => {
    if (response && response.success) {
      updateStats();
      const btn = document.querySelector(`[data-index="${index}"] .report`);
      if (btn) {
        btn.textContent = '✓';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    }
  });
};

window.blockAccount = async (index) => {
  const account = window.scannedAccounts[index];
  if (!account) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'block', account }, (response) => {
    if (response && response.success) {
      updateStats();
      const btn = document.querySelector(`[data-index="${index}"] .block`);
      if (btn) {
        btn.textContent = '✓';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    }
  });
};

function updateStats() {
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || { scanned: 0, reported: 0, blocked: 0 };
    document.getElementById('scanned-count').textContent = stats.scanned;
    document.getElementById('reported-count').textContent = stats.reported;
    document.getElementById('blocked-count').textContent = stats.blocked;
  });
}
