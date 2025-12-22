const fs = require("fs");
const {botName} = require("../config")

const MEMORY_FILE = "./memory.json";

const SYSTEM_PROMPT = `
You are ${botName}, a personal WhatsApp assistant.
You are friendly, concise, and helpful.

You remember past conversations with the user and use them only when relevant.
Never mention internal memory unless explicitly asked.
Do not make the text bold, italic, underline.
`;

function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

function getUserState(number) {
  const memory = loadMemory();

  if (!memory[number]) {
    memory[number] = {
      systemSent: false,
      history: [],
    };
    saveMemory(memory);
  }

  return memory[number];
}

function updateUserHistory(number, role, content) {
  const memory = loadMemory();

  memory[number].history.push({ role, content });

  // Keep last 20 messages
  if (memory[number].history.length > 20) {
    memory[number].history = memory[number].history.slice(-20);
  }

  saveMemory(memory);
}

function markSystemSent(number) {
  const memory = loadMemory();
  memory[number].systemSent = true;
  saveMemory(memory);
}

function buildContents(history, userQuestion) {
  const contents = [];

  for (const msg of history) {
    contents.push({
      role: msg.role, // "user" | "model"
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userQuestion }],
  });

  return contents;
}

function handleGeminiError(err) {
  const status = err?.status || err?.response?.status;

  if (status === 429) {
    return "🚦 I'm receiving too many requests right now. Please wait a moment and try again.";
  }

  if (status === 403) {
    return "🔒 API quota exceeded or access denied. Please contact the bot owner.";
  }

  if (status >= 500) {
    return "⚠️ Gemini is currently unavailable. Try again shortly.";
  }

  return "❌ An unexpected error occurred while processing your request.";
}

module.exports = {
  SYSTEM_PROMPT,
  loadMemory,
  saveMemory,
  getUserState,
  updateUserHistory,
  markSystemSent,
  buildContents,
  handleGeminiError,
};
