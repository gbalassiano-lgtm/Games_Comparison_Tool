const {
  launchBrowser,
  newPageInScanTimezone,
  closeBrowserSafe,
} = require('../scrapers/launch-browser');
const {
  acceptCookiesIfPresent,
  ensureTargetDate,
  readPickerDateText,
  isDateAlreadySelected,
  isSportPageUrl,
  buildFlashscoreSportUrl,
} = require('../scrapers/flashscore-shared');

const target = process.argv[2] || '2026-07-28';

(async () => {
  const browser = await launchBrowser({ headless: true });
  const page = await newPageInScanTimezone(browser);
  try {
    // Mirror production: clean sport URL, then ensureTargetDate.
    await page.goto(buildFlashscoreSportUrl('football', target), {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await acceptCookiesIfPresent(page);
    console.log('before', await readPickerDateText(page), page.url());
    await ensureTargetDate(page, target, 'football');
    const selected = await isDateAlreadySelected(page, target);
    const text = await readPickerDateText(page);
    const onFootball = isSportPageUrl(page.url(), 'football');
    console.log('after', { text, selected, onFootball, url: page.url() });
    if (!selected) throw new Error(`Failed to select ${target}; picker=${text}`);
    if (!onFootball) throw new Error(`Left football page: ${page.url()}`);
    console.log('ensureTargetDate ok for', target);
  } finally {
    await closeBrowserSafe(browser);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
