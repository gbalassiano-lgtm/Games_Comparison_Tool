/* Weekly analysis UI — isolated from core ui.js so Tasks/Scanner stay safe. */
(function () {
  const WEEKLY = {
    view: 'list', // 'list' | 'weekly' | 'monthly' — top-level History tab
    mode: 'weekly', // 'weekly' | 'monthly' — mirrors view when view !== 'list'
    team: 'content',
    sport: 'all',
    issue: 'all',
    from: '',
    to: '',
    maxDays: 7,
    month: '', // 'YYYY-MM', used only when mode === 'monthly'
    data: null,
    loading: false,
    openKey: '',
    issuesCache: Object.create(null),
    issuesLoading: Object.create(null),
  };

  const TEAM_OPTIONS = [
    { value: 'content', labelKey: 'contentTeam' },
    { value: 'usa', labelKey: 'weeklyTeamUs' },
    { value: 'latam', labelKey: 'latamTab' },
    { value: 'israel', labelKey: 'israelTeamTitle' },
  ];

  const ISSUE_OPTIONS = [
    { value: 'all', labelKey: 'allIssues' },
    { value: 'timeDiff', labelKey: 'timeDiff' },
    { value: 'statusDiff', labelKey: 'statusDiff' },
    { value: 'onlyFlash', labelKey: 'weeklyMissing365' },
    { value: 'only365', labelKey: 'weeklyMissingFlash' },
  ];

  function el(id) {
    return document.getElementById(id);
  }

  function text(key) {
    if (typeof t === 'function') return t(key);
    return key;
  }

  function safeEscape(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function groupForSportKey(sportKey = '') {
    if (typeof scannerGroupForSportKey === 'function') return scannerGroupForSportKey(sportKey);
    const key = String(sportKey || '');
    if (key === 'usa_all' || key.endsWith('_usa')) return 'usa';
    if (key === 'latam_all' || key.startsWith('latam_')) return 'latam';
    if (key === 'israel_all' || key.startsWith('israel_')) return 'israel';
    return 'content';
  }

  function sportsForTeam(team = 'content') {
    const teamKey = TEAM_OPTIONS.some(option => option.value === team) ? team : 'content';
    const appState = (typeof state !== 'undefined' && state) ? state : window.state;
    const sports = (appState && Array.isArray(appState.sports)) ? appState.sports : [];
    return sports.filter(sport => {
      const key = String(sport.key || '');
      if (!key || key === 'all' || key === 'usa_all' || key === 'latam_all' || key === 'israel_all') {
        return false;
      }
      return groupForSportKey(key) === teamKey;
    });
  }

  function isIsoDate(value = '') {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
  }

  function shiftIsoDate(isoDate = '', deltaDays = 0) {
    const date = new Date(`${String(isoDate).trim()}T12:00:00`);
    date.setDate(date.getDate() + Number(deltaDays || 0));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function inclusiveDaySpan(fromDate = '', toDate = '') {
    const fromMs = new Date(`${fromDate}T12:00:00`).getTime();
    const toMs = new Date(`${toDate}T12:00:00`).getTime();
    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 1;
    return Math.max(1, Math.floor((toMs - fromMs) / 86400000) + 1);
  }

  function defaultWeeklyWindow(maxDays = WEEKLY.maxDays || 7) {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const to = shiftIsoDate(localToday, 1);
    const from = shiftIsoDate(to, -(Math.min(7, Math.max(1, maxDays)) - 1));
    return { from, to };
  }

  function isMonthValue(value = '') {
    return /^\d{4}-\d{2}$/.test(String(value || '').trim());
  }

  function currentMonthValue() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function clampMonthValue(value = '') {
    const max = currentMonthValue();
    if (!isMonthValue(value)) return max;
    return value > max ? max : value;
  }

  function setWeeklyDateInput(id, value) {
    if (typeof setDateInputValue === 'function') {
      setDateInputValue(id, value);
      return;
    }
    const input = el(id);
    if (input) input.value = value || '';
  }

  function readWeeklyDateInput(id) {
    const input = el(id);
    return String(input?.value || '').trim();
  }

  function syncWeeklyDateInputs() {
    if (!WEEKLY.from || !WEEKLY.to) {
      const defaults = defaultWeeklyWindow(WEEKLY.maxDays || 7);
      WEEKLY.from = WEEKLY.from || defaults.from;
      WEEKLY.to = WEEKLY.to || defaults.to;
    }
    setWeeklyDateInput('weeklyFromDate', WEEKLY.from);
    setWeeklyDateInput('weeklyToDate', WEEKLY.to);
    if (typeof initLocalizedDatePickers === 'function') {
      initLocalizedDatePickers();
    }
  }

  function clampWeeklyRange({ from = '', to = '', changed = '' } = {}) {
    const maxDays = WEEKLY.maxDays || 7;
    let nextFrom = isIsoDate(from) ? from : WEEKLY.from;
    let nextTo = isIsoDate(to) ? to : WEEKLY.to;
    if (!isIsoDate(nextFrom) || !isIsoDate(nextTo)) {
      const defaults = defaultWeeklyWindow(maxDays);
      nextFrom = defaults.from;
      nextTo = defaults.to;
    }
    if (nextFrom > nextTo) {
      if (changed === 'from') nextTo = nextFrom;
      else nextFrom = nextTo;
    }
    if (inclusiveDaySpan(nextFrom, nextTo) > maxDays) {
      if (changed === 'from') nextTo = shiftIsoDate(nextFrom, maxDays - 1);
      else nextFrom = shiftIsoDate(nextTo, -(maxDays - 1));
    }
    return { from: nextFrom, to: nextTo };
  }

  function applyWeeklyRangeFromInputs({ changed = '', reload = true } = {}) {
    const clamped = clampWeeklyRange({
      from: readWeeklyDateInput('weeklyFromDate'),
      to: readWeeklyDateInput('weeklyToDate'),
      changed,
    });
    const changedRange = clamped.from !== WEEKLY.from || clamped.to !== WEEKLY.to;
    WEEKLY.from = clamped.from;
    WEEKLY.to = clamped.to;
    syncWeeklyDateInputs();
    if (reload && WEEKLY.view === 'weekly' && changedRange) {
      loadAnalysis({ force: true }).catch(() => {});
    }
    return clamped;
  }

  function syncWeeklyMonthInput() {
    if (!isMonthValue(WEEKLY.month)) WEEKLY.month = currentMonthValue();
    const input = el('weeklyMonthInput');
    if (input) {
      input.max = currentMonthValue();
      input.value = WEEKLY.month;
    }
  }

  function applyWeeklyMonthFromInput({ reload = true } = {}) {
    const input = el('weeklyMonthInput');
    const clamped = clampMonthValue(input?.value || WEEKLY.month);
    const changed = clamped !== WEEKLY.month;
    WEEKLY.month = clamped;
    syncWeeklyMonthInput();
    if (reload && WEEKLY.view === 'monthly' && changed) {
      loadAnalysis({ force: true }).catch(() => {});
    }
    return clamped;
  }

  function syncModeUI() {
    const isMonthly = WEEKLY.mode === 'monthly';
    el('weeklyFromField')?.classList.toggle('hidden', isMonthly);
    el('weeklyToField')?.classList.toggle('hidden', isMonthly);
    el('weeklyMonthField')?.classList.toggle('hidden', !isMonthly);
    el('weeklyRangeCapHint')?.classList.toggle('hidden', isMonthly);
    el('weeklyMonthHint')?.classList.toggle('hidden', !isMonthly);
    el('weeklyHintWeekly')?.classList.toggle('hidden', isMonthly);
    el('weeklyHintMonthly')?.classList.toggle('hidden', !isMonthly);
  }

  function weeklyQueryParams(extra = {}) {
    const base = {
      team: WEEKLY.team || 'content',
      sport: WEEKLY.sport || 'all',
      issue: WEEKLY.issue || 'all',
      mode: WEEKLY.mode || 'weekly',
    };
    if (WEEKLY.mode === 'monthly') {
      const [year, month] = String(WEEKLY.month || currentMonthValue()).split('-');
      base.year = year;
      base.month = month;
    } else {
      base.from = WEEKLY.from || '';
      base.to = WEEKLY.to || '';
    }
    return { ...base, ...extra };
  }

  function labelForSport(sportKey) {
    if (typeof sportLabel === 'function') return sportLabel(sportKey);
    return sportKey;
  }

  function fillTeamSelect() {
    const select = el('weeklyTeamSelect');
    if (!select) return;
    const current = WEEKLY.team || 'content';
    select.innerHTML = TEAM_OPTIONS.map(option => (
      `<option value="${option.value}">${safeEscape(text(option.labelKey))}</option>`
    )).join('');
    select.value = TEAM_OPTIONS.some(option => option.value === current) ? current : 'content';
    WEEKLY.team = select.value;
  }

  function fillSportSelect() {
    const select = el('weeklySportSelect');
    if (!select) return;
    const sports = sportsForTeam(WEEKLY.team || 'content');
    const current = WEEKLY.sport || 'all';
    select.innerHTML = [
      `<option value="all">${safeEscape(text('allSports'))}</option>`,
      ...sports.map(sport => `<option value="${safeEscape(sport.key)}">${safeEscape(labelForSport(sport))}</option>`),
    ].join('');
    select.value = sports.some(s => s.key === current) || current === 'all' ? current : 'all';
    WEEKLY.sport = select.value;
  }

  function fillIssueSelect() {
    const select = el('weeklyIssueSelect');
    if (!select) return;
    const current = WEEKLY.issue || 'all';
    select.innerHTML = ISSUE_OPTIONS.map(option => (
      `<option value="${option.value}">${safeEscape(text(option.labelKey))}</option>`
    )).join('');
    select.value = ISSUE_OPTIONS.some(option => option.value === current) ? current : 'all';
    WEEKLY.issue = select.value;
  }

  function isAnalysisView(view = WEEKLY.view) {
    return view === 'weekly' || view === 'monthly';
  }

  function syncView() {
    const listView = el('historyListView');
    const analysisView = el('weeklyHistoryView');
    const isAnalysis = isAnalysisView();
    if (listView) listView.classList.toggle('hidden', isAnalysis);
    if (analysisView) analysisView.classList.toggle('hidden', !isAnalysis);
    document.querySelectorAll('[data-history-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.historyView === WEEKLY.view);
    });
  }

  function setView(view) {
    const next = isAnalysisView(view) ? view : 'list';
    WEEKLY.view = next;
    if (isAnalysisView(next)) {
      WEEKLY.mode = next;
      syncModeUI();
      if (next === 'monthly') syncWeeklyMonthInput();
      else syncWeeklyDateInputs();
    }
    syncView();
    if (isAnalysisView(next)) {
      loadAnalysis({ force: true }).catch(() => {});
    }
  }

  function breakdownHtml(counts = {}) {
    const issue = WEEKLY.issue || 'all';
    const parts = [
      { key: 'timeDiff', label: 'timeDiff', className: 'time', value: counts.timeDiff || 0 },
      { key: 'statusDiff', label: 'statusDiff', className: 'status', value: counts.statusDiff || 0 },
      { key: 'onlyFlash', label: 'weeklyMissing365', className: 'missing-365', value: counts.onlyFlash || 0 },
      { key: 'only365', label: 'weeklyMissingFlash', className: 'missing-flash', value: counts.only365 || 0 },
    ].filter(part => issue === 'all' || part.key === issue);

    return `
      <span class="weekly-breakdown">
        ${parts.map(part => `
          <span title="${safeEscape(text(part.label))}"><i class="weekly-issue-dot ${part.className}"></i>${part.value}</span>
        `).join('')}
      </span>
    `;
  }

  function countryLabel(name) {
    const cleaned = typeof cleanReportCountry === 'function' ? cleanReportCountry(name || '-') : (name || '-');
    if (typeof renderCountryHeading === 'function') return renderCountryHeading(cleaned);
    return safeEscape(cleaned);
  }

  function issueTypeLabel(type) {
    const map = {
      timeDiff: 'timeDiff',
      statusDiff: 'statusDiff',
      onlyFlash: 'weeklyMissing365',
      only365: 'weeklyMissingFlash',
    };
    return text(map[type] || type || '-');
  }

  function issueTypeClass(type) {
    if (type === 'timeDiff') return 'time';
    if (type === 'statusDiff') return 'status';
    if (type === 'onlyFlash') return 'missing-365';
    if (type === 'only365') return 'missing-flash';
    return '';
  }

  function rowCacheKey({ sport, mode, country, competition }) {
    return [
      WEEKLY.mode || 'weekly',
      WEEKLY.mode === 'monthly' ? (WEEKLY.month || '') : `${WEEKLY.from || ''}..${WEEKLY.to || ''}`,
      WEEKLY.team || 'content',
      sport || 'all',
      WEEKLY.issue || 'all',
      mode || 'country',
      String(country || '').toLowerCase(),
      mode === 'league' ? String(competition || '').toLowerCase() : '',
    ].join('|');
  }

  function issueDetailHtml(issue = {}) {
    const teams = [issue.home, issue.away].filter(Boolean).join(' / ') || '-';
    let detail = '';
    if (issue.type === 'timeDiff') {
      detail = `${text('weeklyTime365')}: ${issue.time365 || '-'} · ${text('weeklyTimeFlash')}: ${issue.timeFlash || '-'}`;
    } else if (issue.type === 'statusDiff') {
      detail = `${text('weeklyStatus365')}: ${issue.status365 || issue.status || '-'} · ${text('weeklyStatusFlash')}: ${issue.statusFlash || '-'}`;
    } else if (issue.time || issue.status) {
      detail = [issue.time, issue.status].filter(Boolean).join(' · ');
    }

    return `
      <li class="weekly-issue-item">
        <div class="weekly-issue-main">
          <span class="weekly-issue-type">
            <i class="weekly-issue-dot ${issueTypeClass(issue.type)}"></i>
            ${safeEscape(issueTypeLabel(issue.type))}
          </span>
          ${issue.date ? `<span class="weekly-issue-date">${safeEscape(issue.date)}</span>` : ''}
        </div>
        <div class="weekly-issue-meta">
          <span>${countryLabel(issue.country || '-')}</span>
          <span>${safeEscape(issue.competition || '-')}</span>
        </div>
        <div class="weekly-issue-teams">${safeEscape(teams)}</div>
        ${detail ? `<div class="weekly-issue-detail">${safeEscape(detail)}</div>` : ''}
      </li>
    `;
  }

  function issuesPanelHtml(cacheKey) {
    if (WEEKLY.issuesLoading[cacheKey]) {
      return `<div class="weekly-issues-panel"><p class="empty-state">${safeEscape(text('weeklyIssuesLoading'))}</p></div>`;
    }
    const payload = WEEKLY.issuesCache[cacheKey];
    if (!payload) {
      return `<div class="weekly-issues-panel"><p class="empty-state">${safeEscape(text('weeklyIssuesLoading'))}</p></div>`;
    }
    if (payload.error) {
      return `<div class="weekly-issues-panel"><p class="empty-state">${safeEscape(payload.error)}</p></div>`;
    }
    const issues = payload.issues || [];
    if (!issues.length) {
      return `<div class="weekly-issues-panel"><p class="empty-state">${safeEscape(text('weeklyIssuesEmpty'))}</p></div>`;
    }
    const truncatedNote = payload.truncated
      ? `<p class="hint weekly-issues-truncated">${safeEscape(
        text('weeklyIssuesTruncated')
          .replace('{shown}', String(issues.length))
          .replace('{total}', String(payload.total ?? issues.length))
      )}</p>`
      : '';
    return `
      <div class="weekly-issues-panel">
        <div class="weekly-issues-head">
          <strong>${safeEscape(text('weeklyIssuesTitle'))}</strong>
          <span>${issues.length}${payload.truncated ? ` / ${payload.total}` : ''}</span>
        </div>
        ${truncatedNote}
        <ul class="weekly-issues-list">
          ${issues.map(issueDetailHtml).join('')}
        </ul>
      </div>
    `;
  }

  function rankingTable(rows = [], mode = 'country', sportKey = '') {
    if (!rows.length) return `<p class="empty-state">${safeEscape(text('weeklyEmpty'))}</p>`;
    const body = rows.map((row, index) => {
      const country = mode === 'country' ? (row.name || '-') : (row.country || '-');
      const competition = mode === 'league' ? (row.competition || '-') : '';
      const cacheKey = rowCacheKey({
        sport: sportKey,
        mode,
        country,
        competition,
      });
      const isOpen = WEEKLY.openKey === cacheKey;
      const label = mode === 'country'
        ? countryLabel(country)
        : `<span class="weekly-league-name">${countryLabel(country)}<span class="weekly-league-comp">${safeEscape(competition)}</span></span>`;
      return `
        <tr class="weekly-rank-row${isOpen ? ' is-open' : ''}"
            tabindex="0"
            role="button"
            aria-expanded="${isOpen ? 'true' : 'false'}"
            data-weekly-expand="1"
            data-weekly-sport="${safeEscape(sportKey)}"
            data-weekly-mode="${safeEscape(mode)}"
            data-weekly-country="${safeEscape(country)}"
            data-weekly-competition="${safeEscape(competition)}">
          <td class="weekly-rank">${index + 1}</td>
          <td>
            <span class="weekly-row-label">
              <span class="weekly-expand-icon" aria-hidden="true"></span>
              ${label}
            </span>
          </td>
          <td class="weekly-count"><strong>${row.total || 0}</strong></td>
          <td>${breakdownHtml(row)}</td>
        </tr>
        ${isOpen ? `
          <tr class="weekly-issues-row">
            <td colspan="4">${issuesPanelHtml(cacheKey)}</td>
          </tr>
        ` : ''}
      `;
    }).join('');
    return `
      <div class="weekly-table-wrap">
        <table class="weekly-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${safeEscape(mode === 'country' ? text('country') : text('competition'))}</th>
              <th>${safeEscape(text('weeklyTotal'))}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function sportBlock(entry) {
    const sportKey = entry.sport || '';
    const countries = entry.countries || [];
    const leagues = entry.leagues || [];
    const hasCountries = countries.length > 0;
    const hasLeagues = leagues.length > 0;
    // Show both columns side by side only when both have data; otherwise let the
    // single populated list take the full width instead of leaving a blank column.
    const showBoth = hasCountries === hasLeagues;
    const fullClass = showBoth ? '' : ' weekly-rank-card--full';
    const cards = [];
    if (showBoth || hasCountries) {
      cards.push(`
        <div class="weekly-rank-card${fullClass}">
          <h4>${safeEscape(text('weeklyCountries'))}</h4>
          ${rankingTable(countries, 'country', sportKey)}
        </div>
      `);
    }
    if (showBoth || hasLeagues) {
      cards.push(`
        <div class="weekly-rank-card${fullClass}">
          <h4>${safeEscape(text('weeklyLeagues'))}</h4>
          ${rankingTable(leagues, 'league', sportKey)}
        </div>
      `);
    }
    return `
      <section class="weekly-sport-block" data-weekly-sport-block="${safeEscape(sportKey)}">
        <div class="weekly-sport-head">
          <h3>${safeEscape(labelForSport(entry.sport) || entry.label || entry.sport)}</h3>
          <span class="weekly-sport-meta">${entry.scanCount || 0} scans · ${entry.totals?.total || 0} issues</span>
        </div>
        <div class="weekly-rank-grid">
          ${cards.join('')}
        </div>
      </section>
    `;
  }

  function renderSummary(data) {
    const cards = el('weeklySummaryCards');
    const range = el('weeklyRangeLabel');
    if (!cards || !range) return;
    const totals = data?.totals || {};
    const issue = WEEKLY.issue || data?.issue || 'all';
    range.textContent = text('weeklyRange')
      .replace('{from}', data?.from || '—')
      .replace('{to}', data?.to || '—')
      .replace('{scans}', String(data?.scanCount ?? 0))
      .replace('{total}', String(totals.total ?? 0));

    const metricCards = [
      { key: 'all', html: `<article class="metric"><span>${safeEscape(text('weeklyTotal'))}</span><strong>${totals.total ?? 0}</strong></article>` },
      { key: 'timeDiff', html: `<article class="metric"><span><i class="weekly-issue-dot time"></i>${safeEscape(text('timeDiff'))}</span><strong>${totals.timeDiff ?? 0}</strong></article>` },
      { key: 'statusDiff', html: `<article class="metric"><span><i class="weekly-issue-dot status"></i>${safeEscape(text('statusDiff'))}</span><strong>${totals.statusDiff ?? 0}</strong></article>` },
      { key: 'onlyFlash', html: `<article class="metric"><span><i class="weekly-issue-dot missing-365"></i>${safeEscape(text('weeklyMissing365'))}</span><strong>${totals.onlyFlash ?? 0}</strong></article>` },
      { key: 'only365', html: `<article class="metric"><span><i class="weekly-issue-dot missing-flash"></i>${safeEscape(text('weeklyMissingFlash'))}</span><strong>${totals.only365 ?? 0}</strong></article>` },
    ].filter(card => issue === 'all' || card.key === 'all' || card.key === issue);

    cards.innerHTML = metricCards.map(card => card.html).join('');
  }

  function renderAnalysis(data) {
    const body = el('weeklyAnalysisBody');
    if (!body) return;
    renderSummary(data);
    const sports = data?.sports || [];
    if (!sports.length) {
      body.innerHTML = `<p class="empty-state">${safeEscape(text('weeklyEmpty'))}</p>`;
      return;
    }
    body.innerHTML = sports.map(sportBlock).join('');
  }

  async function fetchJson(path) {
    if (typeof api === 'function') return api(path);
    const response = await fetch(path);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function closeOpenRankRow() {
    const openRow = document.querySelector('tr.weekly-rank-row.is-open[data-weekly-expand="1"]');
    if (!openRow) return;
    openRow.classList.remove('is-open');
    openRow.setAttribute('aria-expanded', 'false');
    const panelRow = openRow.nextElementSibling;
    if (panelRow?.classList.contains('weekly-issues-row')) panelRow.remove();
  }

  function openRankRow(target, cacheKey) {
    closeOpenRankRow();
    target.classList.add('is-open');
    target.setAttribute('aria-expanded', 'true');
    const panelRow = document.createElement('tr');
    panelRow.className = 'weekly-issues-row';
    panelRow.innerHTML = `<td colspan="4">${issuesPanelHtml(cacheKey)}</td>`;
    target.insertAdjacentElement('afterend', panelRow);
  }

  function seedEmbeddedIssues(data) {
    for (const entry of data?.sports || []) {
      const sportKey = entry.sport || '';
      for (const row of entry.countries || []) {
        if (!Array.isArray(row.issues)) continue;
        const cacheKey = rowCacheKey({
          sport: sportKey,
          mode: 'country',
          country: row.name || '-',
          competition: '',
        });
        WEEKLY.issuesCache[cacheKey] = {
          issues: row.issues,
          total: row.issuesTotal ?? row.issues.length,
          truncated: !!row.issuesTruncated,
        };
      }
      for (const row of entry.leagues || []) {
        if (!Array.isArray(row.issues)) continue;
        const cacheKey = rowCacheKey({
          sport: sportKey,
          mode: 'league',
          country: row.country || '-',
          competition: row.competition || '-',
        });
        WEEKLY.issuesCache[cacheKey] = {
          issues: row.issues,
          total: row.issuesTotal ?? row.issues.length,
          truncated: !!row.issuesTruncated,
        };
      }
    }
  }

  function currentWeeklyTeamLabel() {
    const option = TEAM_OPTIONS.find(o => o.value === (WEEKLY.team || 'content'));
    return text(option ? option.labelKey : 'contentTeam');
  }

  function currentWeeklySportLabel() {
    if (!WEEKLY.sport || WEEKLY.sport === 'all') return text('allSports');
    const match = sportsForTeam(WEEKLY.team || 'content').find(s => s.key === WEEKLY.sport);
    return labelForSport(match || WEEKLY.sport);
  }

  function currentWeeklyIssueLabel() {
    const option = ISSUE_OPTIONS.find(o => o.value === (WEEKLY.issue || 'all'));
    return text(option ? option.labelKey : 'allIssues');
  }

  function currentWeeklyRangeLabel() {
    if (WEEKLY.mode === 'monthly') {
      return WEEKLY.month || (WEEKLY.data?.year && WEEKLY.data?.month
        ? `${WEEKLY.data.year}-${String(WEEKLY.data.month).padStart(2, '0')}`
        : '-');
    }
    return `${WEEKLY.data?.from || WEEKLY.from || '-'} \u2192 ${WEEKLY.data?.to || WEEKLY.to || '-'}`;
  }

  function weeklyPrintSubtitleHtml() {
    const rangeLabel = WEEKLY.mode === 'monthly' ? text('weeklyMonthLabel') : `${text('weeklyFrom')}/${text('weeklyTo')}`;
    return `
      <span><b>${safeEscape(text('weeklyTeamFilter'))}:</b> ${safeEscape(currentWeeklyTeamLabel())}</span>
      <span><b>${safeEscape(text('sport'))}:</b> ${safeEscape(currentWeeklySportLabel())}</span>
      <span><b>${safeEscape(text('weeklyIssueFilter'))}:</b> ${safeEscape(currentWeeklyIssueLabel())}</span>
      <span><b>${safeEscape(rangeLabel)}:</b> ${safeEscape(currentWeeklyRangeLabel())}</span>
    `;
  }

  // PDF export reuses the report overlay's print pipeline (see ui.js `printReport`):
  // that overlay already has a battle-tested @media print stylesheet, so we borrow
  // it instead of building a second print pipeline for weekly/monthly.
  function printWeeklyAnalysis() {
    const overlay = el('reportOverlay');
    const titleEl = el('reportTitle');
    const subtitleEl = el('reportSubtitle');
    const contentEl = el('reportContent');
    const summaryEl = el('weeklySummaryCards');
    const bodyEl = el('weeklyAnalysisBody');
    if (!overlay || !titleEl || !subtitleEl || !contentEl || !bodyEl) return;
    if (!WEEKLY.data) {
      alert(text('weeklyEmpty'));
      return;
    }

    const prevTitle = titleEl.textContent;
    const prevSubtitle = subtitleEl.innerHTML;
    const prevContent = contentEl.innerHTML;

    titleEl.textContent = text(WEEKLY.mode === 'monthly' ? 'monthlyTab' : 'weeklyTab');
    subtitleEl.innerHTML = weeklyPrintSubtitleHtml();
    contentEl.innerHTML = `
      <div class="report-metrics weekly-print-summary">${summaryEl ? summaryEl.innerHTML : ''}</div>
      ${bodyEl.innerHTML}
    `;

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      titleEl.textContent = prevTitle;
      subtitleEl.innerHTML = prevSubtitle;
      contentEl.innerHTML = prevContent;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);

    // Chrome/Edge block script execution until the print dialog closes, so the
    // restore() right after window.print() only runs once the user is done there.
    // The 'afterprint' listener above covers browsers where print() is async.
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        restore();
      }, 150);
    });
  }

  function refreshWeeklyLanguage() {
    fillTeamSelect();
    fillSportSelect();
    fillIssueSelect();
    if (WEEKLY.data) renderSummary(WEEKLY.data);
    if (isAnalysisView() && WEEKLY.data) {
      renderAnalysis(WEEKLY.data);
      if (WEEKLY.openKey) patchOpenIssuesPanel(WEEKLY.openKey);
    }
  }
  window.refreshWeeklyLanguage = refreshWeeklyLanguage;

  function patchOpenIssuesPanel(cacheKey) {
    if (WEEKLY.openKey !== cacheKey) return;
    const openRow = document.querySelector('tr.weekly-rank-row.is-open[data-weekly-expand="1"]');
    const panelRow = openRow?.nextElementSibling;
    if (!panelRow?.classList.contains('weekly-issues-row')) return;
    const cell = panelRow.querySelector('td');
    if (cell) cell.innerHTML = issuesPanelHtml(cacheKey);
  }

  async function loadRowIssues({ sport, mode, country, competition, cacheKey, silent = false } = {}) {
    if (WEEKLY.issuesCache[cacheKey] || WEEKLY.issuesLoading[cacheKey]) return WEEKLY.issuesCache[cacheKey];
    WEEKLY.issuesLoading[cacheKey] = true;
    if (!silent && WEEKLY.openKey === cacheKey) patchOpenIssuesPanel(cacheKey);
    try {
      const params = new URLSearchParams(weeklyQueryParams({
        sport: sport || 'all',
        country: country || '',
      }));
      if (mode === 'league' && competition) {
        params.set('competition', competition);
      }
      const data = await fetchJson(`/api/weekly-analysis/issues?${params.toString()}`);
      WEEKLY.issuesCache[cacheKey] = data;
      return data;
    } catch (error) {
      WEEKLY.issuesCache[cacheKey] = { error: error.message || String(error), issues: [] };
      return WEEKLY.issuesCache[cacheKey];
    } finally {
      delete WEEKLY.issuesLoading[cacheKey];
      if (!silent && WEEKLY.openKey === cacheKey) patchOpenIssuesPanel(cacheKey);
    }
  }

  function prefetchTopIssues(data) {
    const jobs = [];
    for (const entry of data?.sports || []) {
      const sportKey = entry.sport || '';
      for (const row of (entry.countries || []).slice(0, 8)) {
        const job = {
          sport: sportKey,
          mode: 'country',
          country: row.name || '-',
          competition: '',
        };
        const cacheKey = rowCacheKey(job);
        if (WEEKLY.issuesCache[cacheKey] || Array.isArray(row.issues)) continue;
        jobs.push({ ...job, cacheKey });
      }
      for (const row of (entry.leagues || []).slice(0, 8)) {
        const job = {
          sport: sportKey,
          mode: 'league',
          country: row.country || '-',
          competition: row.competition || '-',
        };
        const cacheKey = rowCacheKey(job);
        if (WEEKLY.issuesCache[cacheKey] || Array.isArray(row.issues)) continue;
        jobs.push({ ...job, cacheKey });
      }
    }

    if (!jobs.length) return;

    let index = 0;
    const workers = Math.min(2, jobs.length);
    async function runWorker() {
      while (index < jobs.length) {
        const job = jobs[index++];
        try {
          await loadRowIssues({ ...job, silent: true });
        } catch (_) {
          // Prefetch is best-effort.
        }
      }
    }
    for (let i = 0; i < workers; i += 1) runWorker();
  }

  function toggleRankRow(target) {
    const sport = target.dataset.weeklySport || '';
    const mode = target.dataset.weeklyMode || 'country';
    const country = target.dataset.weeklyCountry || '';
    const competition = target.dataset.weeklyCompetition || '';
    const cacheKey = rowCacheKey({ sport, mode, country, competition });

    if (WEEKLY.openKey === cacheKey) {
      WEEKLY.openKey = '';
      closeOpenRankRow();
      return;
    }

    WEEKLY.openKey = cacheKey;
    openRankRow(target, cacheKey);
    if (!WEEKLY.issuesCache[cacheKey] && !WEEKLY.issuesLoading[cacheKey]) {
      loadRowIssues({ sport, mode, country, competition, cacheKey }).catch(() => {});
    }
  }

  async function loadAnalysis({ force = false } = {}) {
    const body = el('weeklyAnalysisBody');
    if (!body) return null;
    if (WEEKLY.loading && !force) return WEEKLY.data;

    fillTeamSelect();
    fillSportSelect();
    fillIssueSelect();
    if (WEEKLY.mode === 'monthly') applyWeeklyMonthFromInput({ reload: false });
    else applyWeeklyRangeFromInputs({ reload: false });
    WEEKLY.loading = true;
    WEEKLY.openKey = '';
    WEEKLY.issuesCache = Object.create(null);
    WEEKLY.issuesLoading = Object.create(null);
    body.innerHTML = `<p class="empty-state">${safeEscape(text('weeklyLoading'))}</p>`;

    try {
      const params = new URLSearchParams(weeklyQueryParams());
      const data = await fetchJson(`/api/weekly-analysis?${params.toString()}`);
      WEEKLY.data = data;
      if (WEEKLY.mode === 'monthly') {
        if (data?.year && data?.month) {
          WEEKLY.month = `${data.year}-${String(data.month).padStart(2, '0')}`;
        }
        syncWeeklyMonthInput();
      } else {
        if (data?.from && data?.to) {
          WEEKLY.from = data.from;
          WEEKLY.to = data.to;
        }
        if (data?.maxDays) WEEKLY.maxDays = Number(data.maxDays) || 7;
        syncWeeklyDateInputs();
      }
      seedEmbeddedIssues(data);
      renderAnalysis(data);
      prefetchTopIssues(data);
      return data;
    } catch (error) {
      body.innerHTML = `<p class="empty-state">${safeEscape(error.message || String(error))}</p>`;
      throw error;
    } finally {
      WEEKLY.loading = false;
    }
  }

  function setup() {
    if (!el('weeklyHistoryView') || !el('weeklySportSelect') || !el('weeklyTeamSelect')) return;

    document.querySelectorAll('[data-history-view]').forEach(button => {
      button.addEventListener('click', () => setView(button.dataset.historyView));
    });

    el('weeklyTeamSelect').addEventListener('change', event => {
      WEEKLY.team = event.target.value || 'content';
      WEEKLY.sport = 'all';
      fillSportSelect();
      if (isAnalysisView()) loadAnalysis({ force: true }).catch(() => {});
    });

    el('weeklySportSelect').addEventListener('change', event => {
      WEEKLY.sport = event.target.value || 'all';
      if (isAnalysisView()) loadAnalysis({ force: true }).catch(() => {});
    });

    el('weeklyIssueSelect')?.addEventListener('change', event => {
      WEEKLY.issue = event.target.value || 'all';
      if (isAnalysisView()) loadAnalysis({ force: true }).catch(() => {});
    });

    el('weeklyFromDate')?.addEventListener('change', () => {
      applyWeeklyRangeFromInputs({ changed: 'from', reload: true });
    });
    el('weeklyToDate')?.addEventListener('change', () => {
      applyWeeklyRangeFromInputs({ changed: 'to', reload: true });
    });

    el('weeklyMonthInput')?.addEventListener('change', () => {
      applyWeeklyMonthFromInput({ reload: true });
    });

    el('refreshWeeklyAnalysis')?.addEventListener('click', () => {
      if (WEEKLY.mode === 'monthly') applyWeeklyMonthFromInput({ reload: false });
      else applyWeeklyRangeFromInputs({ reload: false });
      loadAnalysis({ force: true }).catch(error => alert(error.message));
    });

    el('downloadWeeklyPdf')?.addEventListener('click', printWeeklyAnalysis);

    el('weeklyAnalysisBody')?.addEventListener('click', event => {
      const row = event.target.closest('[data-weekly-expand]');
      if (!row || !el('weeklyAnalysisBody').contains(row)) return;
      event.preventDefault();
      toggleRankRow(row);
    });

    el('weeklyAnalysisBody')?.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target.closest('[data-weekly-expand]');
      if (!row || !el('weeklyAnalysisBody').contains(row)) return;
      event.preventDefault();
      toggleRankRow(row);
    });

    fillTeamSelect();
    fillSportSelect();
    fillIssueSelect();
    syncWeeklyDateInputs();
    syncWeeklyMonthInput();
    syncModeUI();
    syncView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
