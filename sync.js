// sync.js — shared cloud sync for all tools
// Uses JSONBin.io with X-MASTER-KEY
// Each tool has its own bin, identified by tool name

const MASTER_KEY = '$2a$10$jRNevEtp/uBsfJqVX/SNOejLEDh1KJjps72AoWMBA9CtoQAerT13m';
const BASE_URL = 'https://api.jsonbin.io/v3';

// Store bin IDs locally so we don't recreate them
function getBinId(toolName) {
  return localStorage.getItem('binid_' + toolName);
}
function setBinId(toolName, id) {
  localStorage.setItem('binid_' + toolName, id);
}

// Create a new bin for a tool
async function createBin(toolName, initialData) {
  const res = await fetch(`${BASE_URL}/b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY,
      'X-Bin-Name': toolName,
      'X-Bin-Private': 'true'
    },
    body: JSON.stringify(initialData)
  });
  const data = await res.json();
  return data.metadata.id;
}

// Save data to cloud
async function cloudSave(toolName, data) {
  let binId = getBinId(toolName);
  if (!binId) {
    binId = await createBin(toolName, data);
    setBinId(toolName, binId);
    return;
  }
  await fetch(`${BASE_URL}/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY
    },
    body: JSON.stringify(data)
  });
}

// Load data from cloud
async function cloudLoad(toolName, defaultData) {
  let binId = getBinId(toolName);
  if (!binId) {
    // Try to find existing bin by name
    try {
      const res = await fetch(`${BASE_URL}/b?name=${toolName}`, {
        headers: { 'X-Master-Key': MASTER_KEY }
      });
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        binId = list[0].id || list[0].record?.id;
        if (binId) setBinId(toolName, binId);
      }
    } catch(e) {}
  }
  if (!binId) return defaultData;
  try {
    const res = await fetch(`${BASE_URL}/b/${binId}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY }
    });
    const json = await res.json();
    return json.record ?? defaultData;
  } catch(e) {
    return defaultData;
  }
}

// Debounced save — waits 1.5s after last change before saving
function makeDebouncedSave(toolName, getData, ms = 1500) {
  let timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await cloudSave(toolName, getData()); } catch(e) { console.warn('Sync failed', e); }
    }, ms);
  };
}
