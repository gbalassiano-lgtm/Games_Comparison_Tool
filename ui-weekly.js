/* Weekly analysis UI — isolated from core ui.js so Tasks/Scanner stay safe. */
(function () {
  const WEEKLY = {
    view: 'list',
    sport: 'all',
    data: null,
    loading: false,
  };

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

  function contentSports() {
    const sports = (typeof state !== 'undefined' && Array.isArray(state.sports)) ? state.sports : [];
    return sports.filter(sport =>
      sport.key !== 'all' &&
      sport.key !== 'usa_all' &&
      !String(sport.key).endsWith('_usa') &&
      !String(sport.key).startsWith('latam_') &&
      !String(sport.key).startsWith('israel_')
    );
  }

  function labelForSport(sportKey) {
    if (typeof sportLabel === 'function') return sportLabel(sportKey);
    return sportKey;
  }

  function fillSportSelect() {
    const select = el('weeklySportSelect');
    if (!select) return;
    const sports = contentSports();
    const current = WEEKLY.sport || 'all';
    select.innerHTML = [
      `<option value="all">${safeEscape(text('allSports'))}</option>`,
      ...sports.map(sport => `<option value="${safeEscape(sport.key)}">${safeEscape(labelForSport(sport))}</option>`),
    ].join('');
    select.value = sports.some(s => s.key === current) || current === 'all' ? current : 'all';
    WEEKLY.sport = select.value;
  }

  function syncView() {
    const listView = el('historyListView');
    const weeklyView = el('weeklyHistoryView');
    const isWeekly = WEEKLY.view === 'weekly';
    if (listView) listView.classList.toggle('hidden', isWeekly);
    if (weeklyView) weeklyView.classList.toggle('hidden', !isWeekly);
    document.querySelectorAll('[data-history-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.historyView === WEEKLY.view);
    });
  }

  function setView(view) {
    WEEKLY.view = view === 'weekly' ? 'weekly' : 'list';
    syncView();
    if (WEEKLY.view === 'weekly') {
      loadAnalysis({ force: true }).catch(() => {});
    }
  }

  function breakdownHtml(counts = {}) {
    return `
      <span class="weekly-breakdown">
        <span title="${safeEscape(text('timeDiff'))}"><i class="issue-dot time"></i>${counts.timeDiff || 0}</span>
        <span title="${safeEscape(text('statusDiff'))}"><i class="issue-dot status"></i>${counts.statusDiff || 0}</span>
        <span title="${safeEscape(text('weeklyMissing365'))}"><i class="issue-dot missing-365"></i>${counts.onlyFlash || 0}</span>
        <span title="${safeEscape(text('weeklyMissingFlash'))}"><i class="issue-dot missing-flash"></i>${counts.only365 || 0}</span>
      </span>
    `;
  }

  function countryLabel(name) {
    const cleaned = typeof cleanReportCountry === 'function' ? cleanReportCountry(name || '-') : (name || '-');
    if (typeof renderCountryHeading === 'function') return renderCountryHeading(cleaned);
    return safeEscape(cleaned);
  }

  function rankingTable(rows = [], mode = 'country') {
    if (!rows.length) return `<p class="empty-state">${safeEscape(text('weeklyEmpty'))}</p>`;
    const body = rows.map((row, index) => {
      const label = mode === 'country'
        ? countryLabel(row.name || '-')
        : `<span class="weekly-league-name">${countryLabel(row.country || '-')}<span class="weekly-league-comp">${safeEscape(row.competition || '-')}</span></span>`;
      return `
        <tr>
          <td class="weekly-rank">${index + 1}</td>
          <td>${label}</td>
          <td class="weekly-count"><strong>${row.total || 0}</strong></td>
          <td>${breakdownHtml(row)}</td>
        </tr>
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
    return `
      <section class="weekly-sport-block">
        <div class="weekly-sport-head">
          <h3>${safeEscape(labelForSport(entry.sport) || entry.label || entry.sport)}</h3>
          <span class="weekly-sport-meta">${entry.scanCount || 0} scans · ${entry.totals?.total || 0} issues</span>
        </div>
        <div class="weekly-rank-grid">
          <div class="weekly-rank-card">
            <h4>${safeEscape(text('weeklyCountries'))}</h4>
            ${rankingTable(entry.countries || [], 'country')}
          </div>
          <div class="weekly-rank-card">
            <h4>${safeEscape(text('weeklyLeagues'))}</h4>
            ${rankingTable(entry.leagues || [], 'league')}
          </div>
        </div>
      </section>
    `;
  }

  function renderSummary(data) {
    const cards = el('weeklySummaryCards');
    const range = el('weeklyRangeLabel');
    if (!cards || !range) return;
    const totals = data?.totals || {};
    range.textContent = text('weeklyRange')
      .replace('{from}', data?.from || '—')
      .replace('{to}', data?.to || '—')
      .replace('{scans}', String(data?.scanCount ?? 0))
      .replace('{total}', String(totals.total ?? 0));
    cards.innerHTML = `
      <article class="metric"><span>${safeEscape(text('weeklyTotal'))}</span><strong>${totals.total ?? 0}</strong></article>
      <article class="metric"><span><i class="issue-dot time"></i>${safeEscape(text('timeDiff'))}</span><strong>${totals.timeDiff ?? 0}</strong></article>
      <article class="metric"><span><i class="issue-dot status"></i>${safeEscape(text('statusDiff'))}</span><strong>${totals.statusDiff ?? 0}</strong></article>
      <article class="metric"><span><i class="issue-dot missing-365"></i>${safeEscape(text('weeklyMissing365'))}</span><strong>${totals.onlyFlash ?? 0}</strong></article>
      <article class="metric"><span><i class="issue-dot missing-flash"></i>${safeEscape(text('weeklyMissingFlash'))}</span><strong>${totals.only365 ?? 0}</strong></article>
    `;
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

  async function loadAnalysis({ force = false } = {}) {
    const body = el('weeklyAnalysisBody');
    if (!body) return null;
    if (WEEKLY.loading && !force) return WEEKLY.data;

    fillSportSelect();
    WEEKLY.loading = true;
    body.innerHTML = `<p class="empty-state">${safeEscape(text('weeklyLoading'))}</p>`;

    try {
      const sport = WEEKLY.sport || 'all';
      const data = await fetchJson(`/api/weekly-analysis?days=7&sport=${encodeURIComponent(sport)}`);
      WEEKLY.data = data;
      renderAnalysis(data);
      return data;
    } catch (error) {
      body.innerHTML = `<p class="empty-state">${safeEscape(error.message || String(error))}</p>`;
      throw error;
    } finally {
      WEEKLY.loading = false;
    }
  }

  function setup() {
    if (!el('weeklyHistoryView') || !el('weeklySportSelect')) return;

    document.querySelectorAll('[data-history-view]').forEach(button => {
      button.addEventListener('click', () => setView(button.dataset.historyView));
    });

    el('weeklySportSelect').addEventListener('change', event => {
      WEEKLY.sport = event.target.value || 'all';
      if (WEEKLY.view === 'weekly') loadAnalysis({ force: true }).catch(() => {});
    });

    el('refreshWeeklyAnalysis')?.addEventListener('click', () => {
      loadAnalysis({ force: true }).catch(error => alert(error.message));
    });

    document.getElementById('languageSelect')?.addEventListener('change', () => {
      fillSportSelect();
      if (WEEKLY.view === 'weekly' && WEEKLY.data) renderAnalysis(WEEKLY.data);
    });

    syncView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
