const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CACHE_FILE = path.join(ROOT, 'db', 'asana_tasks_cache.json');
const CACHE_VERSION = 1;

function readCacheFile() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (_) {
    return { version: CACHE_VERSION, projectGid: '', workspaceGid: '', days: {} };
  }
}

function writeCacheFile(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function getCachedDay(projectGid, dueOn) {
  const file = readCacheFile();
  if (String(file.projectGid || '') !== String(projectGid || '')) return null;
  const entry = file.days?.[dueOn];
  if (!entry || !Array.isArray(entry.tasks)) return null;
  return {
    fetchedAt: entry.fetchedAt || null,
    fetchedAtMs: Number(entry.fetchedAtMs) || 0,
    tasks: entry.tasks,
  };
}

function setCachedDay(projectGid, dueOn, tasks, meta = {}) {
  const file = readCacheFile();
  if (String(file.projectGid || '') !== String(projectGid || '')) {
    file.projectGid = String(projectGid || '');
    file.workspaceGid = meta.workspaceGid || file.workspaceGid || '';
    file.days = {};
  }

  file.days[dueOn] = {
    fetchedAt: new Date().toISOString(),
    fetchedAtMs: Date.now(),
    tasks,
  };

  if (meta.workspaceGid) file.workspaceGid = meta.workspaceGid;
  writeCacheFile(file);
  return file.days[dueOn];
}

function getCachedWorkspaceGid(projectGid) {
  const file = readCacheFile();
  if (String(file.projectGid || '') !== String(projectGid || '')) return null;
  return String(file.workspaceGid || '').trim() || null;
}

function setCachedWorkspaceGid(projectGid, workspaceGid) {
  const file = readCacheFile();
  file.projectGid = String(projectGid || file.projectGid || '');
  file.workspaceGid = String(workspaceGid || '');
  writeCacheFile(file);
}

module.exports = {
  CACHE_FILE,
  getCachedDay,
  setCachedDay,
  getCachedWorkspaceGid,
  setCachedWorkspaceGid,
};
