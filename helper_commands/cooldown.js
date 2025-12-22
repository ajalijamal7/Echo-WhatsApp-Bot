const fs = require("fs");

const GLOBAL_COOLDOWN_MS = 5 * 60 * 1000;
const COOLDOWN_FILE = "./cooldown.json";

function loadCooldown() {
  if (!fs.existsSync(COOLDOWN_FILE)) {
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify({ lastRequest: 0 }));
  }
  return JSON.parse(fs.readFileSync(COOLDOWN_FILE, "utf8"));
}

function saveCooldown(data) {
  fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
}

function checkGlobalCooldown() {
  const cooldown = loadCooldown();
  const now = Date.now();

  const remaining = GLOBAL_COOLDOWN_MS - (now - cooldown.lastRequest);

  if (remaining > 0) {
    return { blocked: true, remainingMs: remaining };
  }

  return { blocked: false };
}

function updateGlobalCooldown() {
  saveCooldown({ lastRequest: Date.now() });
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.ceil((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

module.exports = {
  loadCooldown,
  saveCooldown,
  checkGlobalCooldown,
  updateGlobalCooldown,
  formatTime,
};
