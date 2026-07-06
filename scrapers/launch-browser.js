const { chromium } = require('playwright');
const { spawnSync } = require('child_process');
const { resolveScanTimezone } = require('../lib/scan-timezone');

/**
 * Launches a browser without requiring chromium-headless-shell.
 * Tries system Chrome/Edge first; falls back to Playwright Chromium (non-shell).
 */
async function launchBrowser(options = {}) {
  const { slowMo = 0, headless = true, ...rest } = options;

  for (const channel of ['chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ channel, headless, slowMo, ...rest });
      console.log(`  🌐 Browser: ${channel} (system)`);
      return browser;
    } catch (_) {
      // try next channel
    }
  }

  try {
    const browser = await chromium.launch({ headless: false, slowMo, ...rest });
    console.log('  🌐 Browser: chromium (windowed — install with: npx playwright install chromium --no-shell)');
    return browser;
  } catch (err) {
    throw new Error(
      'Could not start a browser.\n' +
      '  • Install Google Chrome or Microsoft Edge, OR\n' +
      '  • Run: npx playwright install chromium --no-shell\n' +
      `Details: ${err.message}`
    );
  }
}

async function newPageInScanTimezone(browser, options = {}) {
  const { viewport, ...rest } = options;
  const context = await browser.newContext({
    timezoneId: process.env.SCAN_TIMEZONE || resolveScanTimezone(),
    locale: 'en-US',
    viewport,
    ...rest,
  });
  return context.newPage();
}

function forceKillBrowserProcess(browser) {
  try {
    const child = typeof browser.process === 'function' ? browser.process() : null;
    if (!child?.pid) return;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      return;
    }
    child.kill('SIGKILL');
  } catch {}
}

async function closeBrowserSafe(browser, options = {}) {
  const { timeoutMs = 4000, label = 'browser' } = options;
  if (!browser) return;

  process.stdout.write(`Fechando navegador (${label})...\n`);

  const closer = (async () => {
    for (const context of browser.contexts()) {
      for (const page of context.pages()) {
        await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
      }
      await context.close().catch(() => {});
    }
    await browser.close().catch(() => {});
  })();

  await Promise.race([
    closer,
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ]);

  forceKillBrowserProcess(browser);
  if (typeof browser.disconnect === 'function') {
    await browser.disconnect().catch(() => {});
  }

  process.stdout.write(`Navegador fechado (${label}).\n`);
}

function exitScript(code = 0) {
  setImmediate(() => process.exit(code));
}

module.exports = { launchBrowser, newPageInScanTimezone, closeBrowserSafe, exitScript };
