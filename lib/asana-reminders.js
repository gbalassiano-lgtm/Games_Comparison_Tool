const fs = require('fs');
const path = require('path');
const asana = require('./asana');
const telegram = require('./telegram');
const { todayIsoInTimezone, DEFAULT_SCAN_TIMEZONE } = require('./scan-timezone');

const ROOT = path.join(__dirname, '..');
const SENT_FILE = path.join(ROOT, 'db', 'asana_reminders_sent.json');
const HISTORY_FILE = path.join(ROOT, 'db', 'scan_history.json');
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

let pollInFlight = false;

function isEnabled() {
  if (String(process.env.ASANA_REMINDER_ENABLED || '').trim() !== '1') return false;
  return asana.isConfigured() && telegram.isConfigured();
}

function getMinutesBefore() {
  const raw = Number(process.env.ASANA_REMINDER_MINUTES_BEFORE);
  return Number.isFinite(raw) && raw > 0 ? raw : 60;
}

function getPollMs() {
  const raw = Number(process.env.ASANA_REMINDER_POLL_MS);
  return Number.isFinite(raw) && raw >= 30000 ? raw : 120000;
}

function getDueGraceMs() {
  const raw = Number(process.env.ASANA_REMINDER_DUE_GRACE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 30 * 60 * 1000;
}

function readSentStore() {
  try {
    const payload = JSON.parse(fs.readFileSync(SENT_FILE, 'utf8'));
    return payload && typeof payload === 'object' ? payload : {};
  } catch (_) {
    return {};
  }
}

function writeSentStore(store) {
  fs.mkdirSync(path.dirname(SENT_FILE), { recursive: true });
  fs.writeFileSync(SENT_FILE, JSON.stringify(store, null, 2));
}

function legacyReminderKey(taskGid, dueAt) {
  return `${String(taskGid || '').trim()}:${String(dueAt || '').trim()}`;
}

function reminderKey(taskGid, dueAt, kind = 'before') {
  return `${legacyReminderKey(taskGid, dueAt)}:${kind}`;
}

function pruneSentStore(store = {}) {
  const cutoff = Date.now() - RETENTION_MS;
  const next = {};
  for (const [key, entry] of Object.entries(store)) {
    if (entry?.sentAtMs && entry.sentAtMs >= cutoff) next[key] = entry;
  }
  return next;
}

function wasReminderSent(store, taskGid, dueAt, kind = 'before') {
  if (store[reminderKey(taskGid, dueAt, kind)]) return true;
  if (kind === 'before' && store[legacyReminderKey(taskGid, dueAt)]) return true;
  return false;
}

function markReminderSent(store, taskGid, dueAt, kind = 'before') {
  store[reminderKey(taskGid, dueAt, kind)] = {
    sentAtMs: Date.now(),
    taskGid,
    dueAt,
    kind,
  };
}

function parseDueAtMs(dueAt) {
  const ms = Date.parse(String(dueAt || ''));
  return Number.isFinite(ms) ? ms : null;
}

function isReminderTaskEligible(task = {}) {
  return Boolean(task?.gid && !task.completed && task.dueAt && task.mapped);
}

function formatDueAtLabel(dueAt, timezone = DEFAULT_SCAN_TIMEZONE) {
  const ms = parseDueAtMs(dueAt);
  if (!ms) return String(dueAt || '');
  const date = new Date(ms);
  const datePart = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${datePart} às ${timePart}`;
}

function escapeMarkdown(text = '') {
  return String(text || '').replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

function getPublicBaseUrl() {
  return String(process.env.COMP_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
}

function readScanHistory() {
  try {
    const payload = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(payload) ? payload : [];
  } catch (_) {
    return [];
  }
}

function buildPublicScanUrl(scan = {}) {
  const base = getPublicBaseUrl();
  if (!base || !scan?.id) return null;
  return `${base}/?scanId=${encodeURIComponent(scan.id)}`;
}

function buildPublicScanStartUrl(task = {}) {
  const base = getPublicBaseUrl();
  if (!base || !task.sportKey || !task.suggestedScanDate) return null;
  const params = new URLSearchParams({
    sport: task.sportKey,
    date: task.suggestedScanDate,
  });
  if (task.gid) params.set('asanaTaskGid', task.gid);
  return `${base}/?${params.toString()}`;
}

function resolveScanLinkForTask(task = {}) {
  if (!getPublicBaseUrl()) return null;

  const history = readScanHistory();
  const completed = history.find(record =>
    record?.status === 'completed' && (
      (task.gid && String(record.asanaTaskGid || '') === String(task.gid)) ||
      (task.sportKey && record.sport === task.sportKey && record.date === task.suggestedScanDate)
    )
  );
  if (completed) return buildPublicScanUrl(completed);

  return buildPublicScanStartUrl(task);
}

function formatLeadTimeLabel(minutesBefore = 60) {
  if (minutesBefore === 60) return '1h';
  if (minutesBefore % 60 === 0) return `${minutesBefore / 60}h`;
  return `${minutesBefore} min`;
}

function buildReminderMessage(task = {}, options = {}) {
  const opts = typeof options === 'number' ? { minutesBefore: options } : options;
  const { kind = 'before', minutesBefore = 60 } = opts;

  const assigneeName = String(task.assignee?.name || '').trim();
  const assignee = assigneeName ? ` → ${assigneeName}` : '';
  const scanLinkUrl = task.scanLinkUrl || resolveScanLinkForTask(task);
  const scanLink = scanLinkUrl ? `\n[link](${scanLinkUrl})` : '';
  const asanaLink = task.permalink ? `\n[Abrir no Asana](${task.permalink})` : '';
  const dueLabel = formatDueAtLabel(task.dueAt);
  const leadTime = formatLeadTimeLabel(minutesBefore);
  const headline = kind === 'due'
    ? `⚠️ *Venceu:* ${escapeMarkdown(task.name || 'Tarefa')}${escapeMarkdown(assignee)}`
    : `⏰ *Em ${leadTime}:* ${escapeMarkdown(task.name || 'Tarefa')}${escapeMarkdown(assignee)}`;

  return `${headline}\nVencimento: ${escapeMarkdown(dueLabel)}${scanLink}${asanaLink}`;
}

function shouldSendBeforeReminder(task, nowMs, minutesBefore) {
  if (!isReminderTaskEligible(task)) return false;

  const dueMs = parseDueAtMs(task.dueAt);
  if (!dueMs) return false;

  const reminderMs = dueMs - minutesBefore * 60 * 1000;
  return nowMs >= reminderMs && nowMs < dueMs;
}

function shouldSendDueReminder(task, nowMs, graceMs = getDueGraceMs()) {
  if (!isReminderTaskEligible(task)) return false;

  const dueMs = parseDueAtMs(task.dueAt);
  if (!dueMs) return false;

  return nowMs >= dueMs && nowMs < dueMs + graceMs;
}

async function checkAndSendReminders() {
  if (!isEnabled() || pollInFlight) return { sent: 0, skipped: true };

  pollInFlight = true;
  let sentCount = 0;

  try {
    const today = todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE);
    const payload = await asana.getProjectTasks({ dueOn: today, fresh: true });
    const tasks = payload?.tasks || [];
    const minutesBefore = getMinutesBefore();
    const dueGraceMs = getDueGraceMs();
    const nowMs = Date.now();

    let store = pruneSentStore(readSentStore());

    for (const task of tasks) {
      if (shouldSendBeforeReminder(task, nowMs, minutesBefore) && !wasReminderSent(store, task.gid, task.dueAt, 'before')) {
        const message = buildReminderMessage(task, { kind: 'before', minutesBefore });
        await telegram.sendTelegramMessage(message);
        markReminderSent(store, task.gid, task.dueAt, 'before');
        sentCount += 1;
      }

      if (shouldSendDueReminder(task, nowMs, dueGraceMs) && !wasReminderSent(store, task.gid, task.dueAt, 'due')) {
        const message = buildReminderMessage(task, { kind: 'due' });
        await telegram.sendTelegramMessage(message);
        markReminderSent(store, task.gid, task.dueAt, 'due');
        sentCount += 1;
      }
    }

    writeSentStore(store);
    return { sent: sentCount, skipped: false };
  } finally {
    pollInFlight = false;
  }
}

function startReminderPolling() {
  if (!isEnabled()) {
    console.log('Asana Telegram reminders: disabled (set ASANA_REMINDER_ENABLED=1 with Asana + Telegram configured)');
    return null;
  }

  const pollMs = getPollMs();
  console.log(
    `Asana Telegram reminders: enabled (poll every ${Math.round(pollMs / 1000)}s, ${getMinutesBefore()} min before due_at, due alert within ${Math.round(getDueGraceMs() / 60000)} min after)`
  );

  const run = () => {
    checkAndSendReminders().catch(error => {
      console.error('Asana Telegram reminder error:', error.message);
    });
  };

  setTimeout(run, 5000);
  return setInterval(run, pollMs);
}

module.exports = {
  isEnabled,
  getMinutesBefore,
  getDueGraceMs,
  getPollMs,
  checkAndSendReminders,
  startReminderPolling,
  buildReminderMessage,
  shouldSendBeforeReminder,
  shouldSendDueReminder,
  shouldSendReminder: shouldSendBeforeReminder,
  resolveScanLinkForTask,
};
