// MV3 background service worker for auto sync
// Periodically sync browser history to local API in small batches

const API_BASE = 'http://localhost:8000/api';
const BATCH_SIZE = 500;
const MAX_RESULTS = 5000; // limit per cycle
const ALARM_NAME = 'favAI_auto_sync';
const SYNC_INTERVAL_MINUTES = 60;
const BOOKMARK_ALARM = 'favAI_bookmark_sync';

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: SYNC_INTERVAL_MINUTES });
  chrome.alarms.create(BOOKMARK_ALARM, { delayInMinutes: 2, periodInMinutes: 180 });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { delayInMinutes: 1, periodInMinutes: SYNC_INTERVAL_MINUTES });
  chrome.alarms.create(BOOKMARK_ALARM, { delayInMinutes: 2, periodInMinutes: 180 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    autoSync().catch(() => {});
  }
  if (alarm.name === BOOKMARK_ALARM) {
    syncBookmarks().catch(() => {});
  }
});

async function autoSync() {
  try {
    const ok = await checkHealth();
    if (!ok) return;

    const lastSyncedAt = (await chrome.storage.local.get('lastSyncedAt')).lastSyncedAt || 0;
    const endTime = Date.now();
    const startTime = lastSyncedAt ? lastSyncedAt : 0;

    const items = await chrome.history.search({ text: '', startTime, endTime, maxResults: MAX_RESULTS });
    if (!items || items.length === 0) return;

    // sort asc by time for stable lastSyncedAt
    items.sort((a, b) => a.lastVisitTime - b.lastVisitTime);

    let batch = [];
    for (const it of items) {
      batch.push({
        url: it.url,
        title: it.title || null,
        visitTime: Math.floor(it.lastVisitTime),
        visitCount: it.visitCount || 1,
      });
      if (batch.length >= BATCH_SIZE) {
        await sendBatch(batch);
        batch = [];
      }
    }
    if (batch.length > 0) {
      await sendBatch(batch);
    }

    await chrome.storage.local.set({ lastSyncedAt: endTime });
  } catch (e) {
    // swallow errors to avoid noisy logs
  }
}

async function checkHealth() {
  try {
    const r = await fetch(`${API_BASE}`.replace('/api', '/api/healthz'));
    return r.ok;
  } catch (e) {
    return false;
  }
}

async function sendBatch(items) {
  const body = { items };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/sync-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200 * Math.pow(2, attempt));
  }
  return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function syncBookmarks() {
  try {
    const ok = await checkHealth();
    if (!ok) return;
    const flat = await readAllBookmarks();
    if (!flat || flat.length === 0) return;
    // split and send
    for (let i = 0; i < flat.length; i += BATCH_SIZE) {
      const chunk = flat.slice(i, i + BATCH_SIZE);
      await sendBookmarks(chunk);
    }
  } catch (e) {}
}

async function readAllBookmarks() {
  const tree = await chrome.bookmarks.getTree();
  const out = [];
  function walk(nodes, parentId = null) {
    for (const n of nodes) {
      const isFolder = !n.url;
      out.push({
        chrome_id: n.id,
        parent_id: parentId,
        title: n.title || '',
        url: n.url || null,
        type: isFolder ? 'folder' : 'bookmark',
        dateAdded: n.dateAdded || null,
        dateModified: n.dateGroupModified || n.dateAdded || null,
        isDeleted: false,
      });
      if (n.children && n.children.length) {
        walk(n.children, n.id);
      }
    }
  }
  walk(tree);
  return out;
}

async function sendBookmarks(items) {
  const body = { items };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/bookmarks/sync-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200 * Math.pow(2, attempt));
  }
  return false;
}
