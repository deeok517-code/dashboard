// sync.js — cloud sync with hardcoded bin IDs (works on any device instantly)

const MASTER_KEY = '$2a$10$jRNevEtp/uBsfJqVX/SNOejLEDh1KJjps72AoWMBA9CtoQAerT13m';
const BASE_URL = 'https://api.jsonbin.io/v3';

// Hardcoded bin IDs — one per tool, works on any device
const BIN_IDS = {
  habits:      '6a18dcb121f9ee59d2979a4d',
  savings1000: '6a18dcdbddf5aa59f77237ce',
  streaks:     '6a18dcf6ddf5aa59f772381b',
  todos:       '6a18dd13ddf5aa59f7723874',
  notes:       '6a18deac21f9ee59d2979ff3',
  shopping:    '6a18e00821f9ee59d297a363',
  goals:       '6a18dfee21f9ee59d297a32e',
  weekly:      '6a18e016ddf5aa59f7724096',
  budget:      '6a18dc5a21f9ee59d2979958',
  bills:       '6a18e0ed21f9ee59d297a5eb'
};

async function cloudSave(toolName, data) {
  const binId = BIN_IDS[toolName];
  if (!binId) return;
  await fetch(`${BASE_URL}/b/${binId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': MASTER_KEY
    },
    body: JSON.stringify(data)
  });
}

async function cloudLoad(toolName, defaultData) {
  const binId = BIN_IDS[toolName];
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

function makeDebouncedSave(toolName, getData, ms = 1500) {
  let timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await cloudSave(toolName, getData()); } catch(e) { console.warn('Sync failed', e); }
    }, ms);
  };
}
