// BotFarm Twitter Spam Reporter - Content Script
// Scans notifications and profiles to detect and report spam bots

class SpamReporter {
  constructor() {
    this.isRunning = false;
    this.reportedAccounts = new Set();
    this.blockedAccounts = new Set();
    this.stats = { scanned: 0, reported: 0, blocked: 0 };
    this.spamIndicators = [
      'default profile image',
      'random username pattern',
      'very low followers',
      'very new account',
      'repetitive content',
      'suspicious links'
    ];
  }

  // Scan notifications page for potential spam
  scanNotifications() {
    console.log('[BotFarm] Scanning notifications for spam...');
    const notifications = document.querySelectorAll('[data-testid="notification"]');
    const spamAccounts = [];

    notifications.forEach((notif, index) => {
      const accountData = this.extractAccountData(notif);
      if (accountData && this.isLikelySpam(accountData)) {
        spamAccounts.push(accountData);
      }
    });

    console.log(`[BotFarm] Found ${spamAccounts.length} potential spam accounts`);
    return spamAccounts;
  }

  // Extract account information from notification element
  extractAccountData(element) {
    try {
      const usernameEl = element.querySelector('[data-testid="User-Name"] a');
      const displayNameEl = element.querySelector('[data-testid="User-Name"] span');
      const avatarEl = element.querySelector('[data-testid="Tweet-User-Avatar"] img');
      
      if (!usernameEl) return null;

      const username = usernameEl.href?.split('/').pop() || '';
      const displayName = displayNameEl?.textContent || '';
      const avatarUrl = avatarEl?.src || '';
      const isDefaultAvatar = !avatarUrl || avatarUrl.includes('default_profile');

      return {
        username,
        displayName,
        avatarUrl,
        isDefaultAvatar,
        element,
        spamScore: 0
      };
    } catch (error) {
      console.error('[BotFarm] Error extracting account data:', error);
      return null;
    }
  }

  // Analyze if account is likely spam based on indicators
  isLikelySpam(accountData) {
    let score = 0;

    // Default profile image
    if (accountData.isDefaultAvatar) score += 2;

    // Random username pattern (lots of numbers)
    if (/^[a-zA-Z]+[0-9]{6,}$/.test(accountData.username)) score += 2;

    // Very short display name or same as username
    if (accountData.displayName.length < 4 || accountData.displayName === accountData.username) {
      score += 1;
    }

    accountData.spamScore = score;
    return score >= 3; // Threshold for spam detection
  }

  // Report account to Twitter
  async reportAccount(accountData) {
    if (this.reportedAccounts.has(accountData.username)) {
      console.log(`[BotFarm] Already reported @${accountData.username}`);
      return false;
    }

    try {
      console.log(`[BotFarm] Reporting @${accountData.username}...`);
      
      // Navigate to profile
      const profileUrl = `https://twitter.com/${accountData.username}`;
      window.location.href = profileUrl;
      
      // Wait for page load
      await this.waitForElement('[data-testid="confirmationSheetConfirm"]');
      
      // Click more options button
      const moreButton = document.querySelector('[data-testid="caret"]');
      if (moreButton) moreButton.click();
      
      await this.sleep(500);
      
      // Click report
      const reportButton = Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find(btn => btn.textContent.includes('Report'));
      
      if (reportButton) {
        reportButton.click();
        await this.sleep(1000);
        
        // Select spam reason
        const spamOption = Array.from(document.querySelectorAll('[role="radio"]'))
          .find(opt => opt.textContent.includes('spam'));
        
        if (spamOption) {
          spamOption.click();
          await this.sleep(500);
          
          // Submit report
          const submitButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
          if (submitButton) {
            submitButton.click();
            this.reportedAccounts.add(accountData.username);
            this.stats.reported++;
            console.log(`[BotFarm] Successfully reported @${accountData.username}`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[BotFarm] Error reporting @${accountData.username}:`, error);
      return false;
    }
  }

  // Block account
  async blockAccount(accountData) {
    if (this.blockedAccounts.has(accountData.username)) {
      console.log(`[BotFarm] Already blocked @${accountData.username}`);
      return false;
    }

    try {
      console.log(`[BotFarm] Blocking @${accountData.username}...`);
      
      // Click more options button
      const moreButton = document.querySelector('[data-testid="caret"]');
      if (moreButton) moreButton.click();
      
      await this.sleep(500);
      
      // Click block
      const blockButton = Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find(btn => btn.textContent.includes('Block'));
      
      if (blockButton) {
        blockButton.click();
        await this.sleep(500);
        
        // Confirm block
        const confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (confirmButton) {
          confirmButton.click();
          this.blockedAccounts.add(accountData.username);
          this.stats.blocked++;
          console.log(`[BotFarm] Successfully blocked @${accountData.username}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[BotFarm] Error blocking @${accountData.username}:`, error);
      return false;
    }
  }

  // Add report/block buttons to notification elements
  addActionButtons() {
    const notifications = document.querySelectorAll('[data-testid="notification"]');
    
    notifications.forEach((notif) => {
      if (notif.querySelector('.botfarm-action-btn')) return; // Already added
      
      const container = document.createElement('div');
      container.className = 'botfarm-actions';
      container.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; gap: 5px;';
      
      const reportBtn = document.createElement('button');
      reportBtn.className = 'botfarm-action-btn botfarm-report-btn';
      reportBtn.textContent = '🚩 Report';
      reportBtn.onclick = (e) => {
        e.stopPropagation();
        const accountData = this.extractAccountData(notif);
        if (accountData) this.reportAccount(accountData);
      };
      
      const blockBtn = document.createElement('button');
      blockBtn.className = 'botfarm-action-btn botfarm-block-btn';
      blockBtn.textContent = '🚫 Block';
      blockBtn.onclick = (e) => {
        e.stopPropagation();
        const accountData = this.extractAccountData(notif);
        if (accountData) this.blockAccount(accountData);
      };
      
      container.appendChild(reportBtn);
      container.appendChild(blockBtn);
      notif.style.position = 'relative';
      notif.appendChild(container);
    });
  }

  // Utility: Wait for element to appear
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  }

  // Utility: Sleep
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get stats
  getStats() {
    return {
      scanned: this.stats.scanned,
      reported: this.stats.reported,
      blocked: this.stats.blocked,
      reportedAccounts: Array.from(this.reportedAccounts),
      blockedAccounts: Array.from(this.blockedAccounts)
    };
  }
}

// Initialize
const reporter = new SpamReporter();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scan') {
    const spamAccounts = reporter.scanNotifications();
    sendResponse({ accounts: spamAccounts });
  } else if (request.action === 'report') {
    reporter.reportAccount(request.account).then(success => {
      sendResponse({ success });
    });
    return true; // Async response
  } else if (request.action === 'block') {
    reporter.blockAccount(request.account).then(success => {
      sendResponse({ success });
    });
    return true;
  } else if (request.action === 'addButtons') {
    reporter.addActionButtons();
    sendResponse({ success: true });
  } else if (request.action === 'getStats') {
    sendResponse({ stats: reporter.getStats() });
  }
});

// Auto-add buttons when notifications page loads
if (window.location.pathname.includes('/notifications')) {
  setTimeout(() => {
    reporter.addActionButtons();
  }, 2000);

  // Watch for new notifications
  const observer = new MutationObserver(() => {
    reporter.addActionButtons();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

console.log('[BotFarm] Twitter Spam Reporter loaded');
