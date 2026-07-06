const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const {
  addDaysIso,
  scanTimezoneForSport,
  todayIsoInTimezone,
  DEFAULT_SCAN_TIMEZONE,
} = require('./scan-timezone');
const diskCache = require('./asana-cache');

const ROOT = path.join(__dirname, '..');
const CONFIG_FILE = path.join(ROOT, 'config', 'asana.json');
const API_BASE = 'https://app.asana.com/api/1.0';
const CACHE_TTL_MS = 5 * 60 * 1000;
const DISK_REFRESH_AFTER_MS = 5 * 60 * 1000;

let configCache = null;
let tasksCache = { key: '', expiresAt: 0, value: null };
let workspaceGidMemory = null;
const backgroundFetches = new Set();

function loadConfig() {
  if (configCache) return configCache;
  configCache = readJsonSafe(CONFIG_FILE, {});
  return configCache;
}

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function getAccessToken() {
  return String(process.env.ASANA_ACCESS_TOKEN || '').trim();
}

function getProjectGid() {
  const fromEnv = String(process.env.ASANA_PROJECT_GID || '').trim();
  if (fromEnv) return fromEnv;
  return String(loadConfig().projectGid || '').trim();
}

function isConfigured() {
  return Boolean(getAccessToken() && getProjectGid());
}

function clearAsanaCache() {
  tasksCache = { key: '', expiresAt: 0, value: null };
}

async function asanaRequest(method, apiPath, body) {
  const token = getAccessToken();
  if (!token) throw new Error('ASANA_ACCESS_TOKEN is not configured.');

  const url = `${API_BASE}${apiPath}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (_) {
        payload = null;
      }

      if (response.status === 429 && attempt < 2) {
        await sleep(800 * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const message = payload?.errors?.[0]?.message || text || response.statusText;
        throw new Error(message || `Asana API error (${response.status})`);
      }

      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error('Asana request failed.');
}

async function asanaGetAllPages(apiPath) {
  const items = [];
  let nextPath = apiPath;

  while (nextPath) {
    const payload = await asanaRequest('GET', nextPath);
    items.push(...(payload?.data || []));
    nextPath = payload?.next_page?.path || null;
  }

  return items;
}

async function asanaGetData(method, apiPath, body) {
  const payload = await asanaRequest(method, apiPath, body);
  return payload?.data ?? payload;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeAliasKey(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseSportFromTaskName(name = '', aliases = {}) {
  const config = loadConfig();
  const prefix = String(config.taskPrefix || 'Daily ');
  const raw = String(name || '').trim();
  if (!raw.startsWith(prefix)) return null;

  const suffix = normalizeAliasKey(raw.slice(prefix.length));
  if (!suffix) return null;

  const map = { ...(config.sportAliases || {}), ...(aliases || {}) };
  const direct = map[suffix];
  if (direct) return direct;

  const lowerSuffix = suffix.toLowerCase();
  for (const [alias, sportKey] of Object.entries(map)) {
    if (normalizeAliasKey(alias).toLowerCase() === lowerSuffix) return sportKey;
  }

  return null;
}

function scannerGroupForSport(sportKey = '') {
  const key = String(sportKey || '');
  if (key === 'usa_all' || key.endsWith('_usa')) return 'usa';
  if (key === 'latam_all' || key.startsWith('latam_')) return 'latam';
  if (key === 'israel_all' || key.startsWith('israel_')) return 'israel';
  return 'content';
}

function suggestedScanDateForSport(sportKey = '', dueOn = '') {
  const timezone = scanTimezoneForSport(sportKey);
  const baseDue = dueOn || todayIsoInTimezone(timezone);
  return addDaysIso(baseDue, 1);
}

function sortTasksByConfig(tasks = []) {
  const order = loadConfig().taskOrder || [];
  const rank = new Map(order.map((name, index) => [name, index]));
  return [...tasks].sort((left, right) => {
    const leftRank = rank.has(left.name) ? rank.get(left.name) : Number.MAX_SAFE_INTEGER;
    const rightRank = rank.has(right.name) ? rank.get(right.name) : Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return String(left.name).localeCompare(String(right.name));
  });
}

function enrichTask(task, dueOn) {
  const sportKey = parseSportFromTaskName(task.name);
  const config = loadConfig();
  const usaAllSportKeys = Array.isArray(config.usaAllSportKeys) && config.usaAllSportKeys.length
    ? config.usaAllSportKeys
    : ['american_football_usa', 'baseball_usa', 'basketball_usa'];
  return {
    gid: task.gid,
    name: task.name,
    completed: Boolean(task.completed),
    permalink: task.permalink_url || null,
    dueOn: task.due_on || dueOn || null,
    dueAt: task.due_at || null,
    assignee: task.assignee
      ? {
          gid: task.assignee.gid || null,
          name: task.assignee.name || null,
          email: task.assignee.email || null,
        }
      : null,
    sportKey,
    scannerGroup: sportKey ? scannerGroupForSport(sportKey) : null,
    suggestedScanDate: sportKey ? suggestedScanDateForSport(sportKey, task.due_on || dueOn) : null,
    usaAllSportKeys: sportKey === 'usa_all' ? usaAllSportKeys : null,
    mapped: Boolean(sportKey),
  };
}

async function getUserGidByEmail(email = '') {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;
  const user = await asanaGetData('GET', `/users/${encodeURIComponent(normalized)}?opt_fields=gid,email,name`);
  return user?.gid || null;
}

async function listProjects() {
  const workspaces = await asanaGetData('GET', '/workspaces?opt_fields=gid,name');
  const projects = [];

  for (const workspace of workspaces || []) {
    const rows = await asanaGetAllPages(
      `/projects?workspace=${encodeURIComponent(workspace.gid)}&archived=false&opt_fields=gid,name&limit=100`
    );
    for (const project of rows || []) {
      projects.push({
        gid: project.gid,
        name: project.name,
        workspace: workspace.name,
      });
    }
  }

  return projects.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

async function resolveWorkspaceGid(projectGid) {
  if (workspaceGidMemory) return workspaceGidMemory;

  const cached = diskCache.getCachedWorkspaceGid(projectGid);
  if (cached) {
    workspaceGidMemory = cached;
    return cached;
  }

  const project = await asanaGetData(
    'GET',
    `/projects/${encodeURIComponent(projectGid)}?opt_fields=workspace,workspace.gid`
  );
  workspaceGidMemory = project?.workspace?.gid || null;
  if (workspaceGidMemory) {
    diskCache.setCachedWorkspaceGid(projectGid, workspaceGidMemory);
  }
  return workspaceGidMemory;
}

async function fetchRawTasksForDay(projectGid, dueDate) {
  const optFields = 'gid,name,completed,due_on,due_at,assignee,assignee.name,assignee.email,permalink_url';
  const workspaceGid = await resolveWorkspaceGid(projectGid);

  let rows = [];
  if (workspaceGid) {
    try {
      const searchParams = new URLSearchParams({
        'projects.any': projectGid,
        due_on: dueDate,
        opt_fields: optFields,
        limit: '100',
      });
      rows = await asanaGetAllPages(
        `/workspaces/${encodeURIComponent(workspaceGid)}/tasks/search?${searchParams.toString()}`
      );
    } catch (_) {
      // Fall back to standard tasks endpoint if search is unavailable.
    }
  }

  if (!rows.length) {
    const fallbackParams = new URLSearchParams({
      project: projectGid,
      'due_on.after': addDaysIso(dueDate, -1),
      'due_on.before': addDaysIso(dueDate, 1),
      opt_fields: optFields,
      limit: '100',
    });
    rows = await asanaGetAllPages(`/tasks?${fallbackParams.toString()}`);
    rows = (rows || []).filter(task => task.due_on === dueDate);
  }

  await hydrateRawTaskAssignees(rows);
  await hydrateRawTaskDueAt(rows);
  return rows;
}

async function hydrateRawTaskDueAt(rawTasks = []) {
  const missing = (rawTasks || []).filter(task => task?.gid && !task.due_at);
  if (!missing.length) return rawTasks;

  await Promise.all(missing.map(async task => {
    try {
      const full = await asanaGetData(
        'GET',
        `/tasks/${encodeURIComponent(task.gid)}?opt_fields=due_at,due_on`
      );
      if (full?.due_at) task.due_at = full.due_at;
    } catch (_) {}
  }));

  return rawTasks;
}

async function hydrateRawTaskAssignees(rawTasks = []) {
  const missing = (rawTasks || []).filter(task => task?.gid && !task.assignee?.name);
  if (!missing.length) return rawTasks;

  await Promise.all(missing.map(async task => {
    try {
      const full = await asanaGetData(
        'GET',
        `/tasks/${encodeURIComponent(task.gid)}?opt_fields=assignee,assignee.name,assignee.email`
      );
      if (full?.assignee) task.assignee = full.assignee;
    } catch (_) {}
  }));

  return rawTasks;
}

async function hydrateEnrichedTaskAssignees(tasks = []) {
  const missing = (tasks || []).filter(task => task?.gid && !task.assignee?.name);
  if (!missing.length) return { tasks, changed: false };

  await Promise.all(missing.map(async task => {
    try {
      const full = await asanaGetData(
        'GET',
        `/tasks/${encodeURIComponent(task.gid)}?opt_fields=assignee,assignee.name,assignee.email,due_at,due_on`
      );
      if (full?.assignee?.name) {
        task.assignee = {
          gid: full.assignee.gid || null,
          name: full.assignee.name || null,
          email: full.assignee.email || null,
        };
      }
      if (full?.due_at) task.dueAt = full.due_at;
    } catch (_) {}
  }));

  return { tasks, changed: true };
}

async function hydrateEnrichedTaskDueAt(tasks = []) {
  const missing = (tasks || []).filter(task => task?.gid && !task.dueAt);
  if (!missing.length) return { tasks, changed: false };

  await Promise.all(missing.map(async task => {
    try {
      const full = await asanaGetData(
        'GET',
        `/tasks/${encodeURIComponent(task.gid)}?opt_fields=due_at,due_on`
      );
      if (full?.due_at) task.dueAt = full.due_at;
    } catch (_) {}
  }));

  return { tasks, changed: true };
}

function mapTasksForDay(rawTasks, dueDate, assigneeGid = null) {
  return sortTasksByConfig(
    (rawTasks || [])
      .filter(task => {
        if (!assigneeGid) return true;
        return task.assignee?.gid === assigneeGid;
      })
      .map(task => enrichTask(task, dueDate))
  );
}

function buildTasksPayload(dueDate, tasks, options = {}) {
  return {
    dueOn: dueDate,
    configured: true,
    tasks,
    warning: options.warning || null,
    cached: Boolean(options.cached),
    stale: Boolean(options.stale),
  };
}

function rememberTasksPayload(projectGid, dueDate, email, payload) {
  const cacheKey = `${projectGid}:${dueDate}:${String(email || '').toLowerCase()}`;
  tasksCache = {
    key: cacheKey,
    expiresAt: Date.now() + CACHE_TTL_MS,
    value: payload,
  };
  return payload;
}

async function refreshDayCache(projectGid, dueDate, assigneeGid = null) {
  const fetchKey = `${projectGid}:${dueDate}:${assigneeGid || ''}`;
  if (backgroundFetches.has(fetchKey)) return null;
  backgroundFetches.add(fetchKey);

  try {
    const rawTasks = await fetchRawTasksForDay(projectGid, dueDate);
    let tasks = mapTasksForDay(rawTasks, dueDate, assigneeGid);
    const hydratedAssignees = await hydrateEnrichedTaskAssignees(tasks);
    tasks = hydratedAssignees.tasks;
    const hydratedDueAt = await hydrateEnrichedTaskDueAt(tasks);
    tasks = hydratedDueAt.tasks;
    if (!assigneeGid) {
      diskCache.setCachedDay(projectGid, dueDate, tasks, {
        workspaceGid: workspaceGidMemory,
      });
    }
    const payload = buildTasksPayload(dueDate, tasks, { cached: true, stale: false });
    if (!assigneeGid) rememberTasksPayload(projectGid, dueDate, '', payload);
    return payload;
  } finally {
    backgroundFetches.delete(fetchKey);
  }
}

async function warmCache(dates = []) {
  if (!isConfigured()) return;

  const projectGid = getProjectGid();
  const uniqueDates = [...new Set((dates || []).filter(Boolean))];

  await Promise.all(uniqueDates.map(async dueDate => {
    const cached = diskCache.getCachedDay(projectGid, dueDate);
    if (cached && Date.now() - cached.fetchedAtMs < DISK_REFRESH_AFTER_MS) return;
    await refreshDayCache(projectGid, dueDate).catch(() => {});
  }));
}

function findProjectsByName(projects = [], query = '') {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return [];

  const exact = projects.filter(project => String(project.name || '').trim().toLowerCase() === normalized);
  if (exact.length) return exact;

  return projects.filter(project => String(project.name || '').toLowerCase().includes(normalized));
}

async function getProjectTasks({ dueOn, email, fresh = false } = {}) {
  if (!isConfigured()) {
    throw new Error('Asana is not configured. Set ASANA_ACCESS_TOKEN and ASANA_PROJECT_GID in .env');
  }

  const projectGid = getProjectGid();
  const dueDate = dueOn || todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE);
  const cacheKey = `${projectGid}:${dueDate}:${String(email || '').toLowerCase()}`;
  const now = Date.now();

  if (!fresh && tasksCache.key === cacheKey && tasksCache.expiresAt > now && tasksCache.value) {
    return tasksCache.value;
  }

  let assigneeGid = null;
  if (email) {
    assigneeGid = await getUserGidByEmail(email);
    if (!assigneeGid) {
      return {
        dueOn: dueDate,
        configured: true,
        tasks: [],
        warning: 'No Asana user found for this email.',
      };
    }
  }

  if (!email && !fresh) {
    const diskEntry = diskCache.getCachedDay(projectGid, dueDate);
    if (diskEntry) {
      let tasks = [...(diskEntry.tasks || [])];
      if (tasks.some(task => !task.assignee?.name)) {
        const hydrated = await hydrateEnrichedTaskAssignees(tasks);
        tasks = hydrated.tasks;
        if (hydrated.changed) {
          diskCache.setCachedDay(projectGid, dueDate, tasks, {
            workspaceGid: workspaceGidMemory || diskCache.getCachedWorkspaceGid(projectGid),
          });
        }
      }
      if (tasks.some(task => !task.dueAt)) {
        const hydratedDueAt = await hydrateEnrichedTaskDueAt(tasks);
        tasks = hydratedDueAt.tasks;
        if (hydratedDueAt.changed) {
          diskCache.setCachedDay(projectGid, dueDate, tasks, {
            workspaceGid: workspaceGidMemory || diskCache.getCachedWorkspaceGid(projectGid),
          });
        }
      }

      const stale = now - diskEntry.fetchedAtMs > DISK_REFRESH_AFTER_MS;
      const payload = rememberTasksPayload(
        projectGid,
        dueDate,
        '',
        buildTasksPayload(dueDate, tasks, { cached: true, stale })
      );

      if (stale) {
        refreshDayCache(projectGid, dueDate).catch(() => {});
      }

      return payload;
    }
  }

  const payload = await refreshDayCache(projectGid, dueDate, assigneeGid);
  return payload || buildTasksPayload(dueDate, [], { cached: false, stale: false });
}

async function completeTask(taskGid) {
  if (!taskGid) throw new Error('Missing Asana task GID.');
  clearAsanaCache();
  const result = await asanaGetData('PUT', `/tasks/${encodeURIComponent(taskGid)}`, {
    data: { completed: true },
  });
  if (isConfigured()) {
    const projectGid = getProjectGid();
    const today = todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE);
    refreshDayCache(projectGid, today).catch(() => {});
  }
  return result;
}

function getLocalStatus() {
  const token = getAccessToken();
  const projectGid = getProjectGid();
  const config = loadConfig();

  if (!token) {
    return {
      configured: false,
      ready: false,
      message: 'Add ASANA_ACCESS_TOKEN to .env (see .env.example).',
      projectGid: projectGid || null,
      projectName: config.projectName || null,
    };
  }

  if (!projectGid) {
    return {
      configured: false,
      ready: false,
      message: 'Add ASANA_PROJECT_GID to .env or config/asana.json. Run node scripts/asana-setup.js to list projects.',
      projectGid: null,
      projectName: config.projectName || null,
    };
  }

  return {
    configured: true,
    ready: true,
    message: 'Asana connected.',
    projectGid,
    projectName: config.projectName || null,
  };
}

async function getStatus({ validateProject = false } = {}) {
  const local = getLocalStatus();
  if (!validateProject || !local.ready) return local;

  try {
    const project = await asanaGetData('GET', `/projects/${encodeURIComponent(local.projectGid)}?opt_fields=gid,name`);
    return {
      ...local,
      projectGid: project.gid,
      projectName: project.name || local.projectName,
    };
  } catch (error) {
    return {
      configured: true,
      ready: false,
      message: error.message,
      projectGid: local.projectGid,
      projectName: local.projectName,
    };
  }
}

async function getDashboard({ dueOn, email, fresh = false } = {}) {
  const status = getLocalStatus();
  const dueDate = dueOn || todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE);

  if (!status.ready) {
    return {
      ...status,
      dueOn: dueDate,
      tasks: [],
      warning: null,
    };
  }

  const tasksPayload = await getProjectTasks({ dueOn: dueDate, email, fresh });
  return {
    ...status,
    dueOn: tasksPayload.dueOn,
    tasks: tasksPayload.tasks,
    warning: tasksPayload.warning,
  };
}

module.exports = {
  loadConfig,
  isConfigured,
  clearAsanaCache,
  getLocalStatus,
  getStatus,
  getDashboard,
  warmCache,
  listProjects,
  findProjectsByName,
  getUserGidByEmail,
  getProjectTasks,
  parseSportFromTaskName,
  scannerGroupForSport,
  suggestedScanDateForSport,
  completeTask,
};
